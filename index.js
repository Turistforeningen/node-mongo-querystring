/*jshint loopfunc: true */
'use strict';

module.exports = function MongoQS(opts) {
  opts = opts || {};

  this.ops = opts.ops || ['!', '^', '$', '~', '>', '<', '$in'];
  this.alias = opts.alias || {};
  this.blacklist = opts.blacklist || {};
  this.whitelist = opts.whitelist || {};
  this.custom = opts.custom || {};

  // String Value Parsing
  opts.string = opts.string || {};
  this.string = opts.string || {};
  this.string.toBoolean = opts.string.toBoolean || true;
  this.string.toNumber = opts.string.toNumber || true;

  this.keyRegex = opts.keyRegex || /^[a-zæøå0-9-_.]+$/i;
  this.valRegex = opts.valRegex || /[^a-zæøå0-9-_.* ]/i;
  this.arrRegex = opts.arrRegex || /^[a-zæøå0-9-_.]+(\[\])?$/i;

  for (var param in this.custom) {
    switch (param) {
      case 'bbox':
        this.custom.bbox = this.customBBOX(this.custom[param]);
        break;
      case 'near':
        this.custom.near = this.customNear(this.custom[param]);
        break;
      case 'after':
        this.custom.after = this.customAfter(this.custom[param]);
    }
  }
  return this;
};

module.exports.prototype.customBBOX = function(field) {
  return function(query, bbox) {
    bbox = bbox.split(',');

    if (bbox.length === 4) {
      // Optimize by unrolling the loop
      bbox[0] = parseFloat(bbox[0], 10);
      bbox[1] = parseFloat(bbox[1], 10);
      bbox[2] = parseFloat(bbox[2], 10);
      bbox[3] = parseFloat(bbox[3], 10);

      if (!isNaN(bbox.reduce(function(a,b){return a+b;}))) {
        query[field] = {
          $geoWithin: {
            $geometry: {
              type: 'Polygon',
              coordinates: [[
                [bbox[0], bbox[1]],
                [bbox[2], bbox[1]],
                [bbox[2], bbox[3]],
                [bbox[0], bbox[3]],
                [bbox[0], bbox[1]],
              ]],
            },
          },
        };
      }
    }
  };
};

module.exports.prototype.customNear = function(field) {
  return function(query, point) {
    point = point.split(',');

    if (point.length >= 2) {
      point[0] = parseFloat(point[0], 10);
      point[1] = parseFloat(point[1], 10);

      if (!isNaN(point.reduce(function(a,b){return a+b;}))) {
        var max = parseInt(point[2], 10);
        var min = parseInt(point[3], 10);

        query[field] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: point,
            },
          },
        };

        if (!isNaN(max)) {
          query[field].$near.$maxDistance = parseInt(point[2], 10);

          if (!isNaN(min)) {
            query[field].$near.$minDistance = parseInt(point[3], 10);
          }
        }
      }
    }
  };
};

module.exports.prototype.customAfter = function(field) {
  return function(query, date) {
    if (!isNaN(date)) {
      if ((date + '').length === 10) {
        date = date + '000';
      }
      date = parseInt(date, 10);
    }

    date = new Date(date);

    if (date.toString() !== 'Invalid Date') {
      query[field] = {
        $gte: date.toISOString()
      };
    }
  };
};

module.exports.prototype.parseString = function(string, array) {
  var op = string[0] || '';
  var eq = string[1] === '=';
  var org = string.substr(eq ? 2 : 1) || '';
  var val = this.parseStringVal(org);

  var ret = {op: op, org: org, value: val};

  switch (op) {
    case '!':
      if (array) {
        ret.field = '$nin';
      } else if (org === '') {
        ret.field = '$exists';
        ret.value = false;
      } else {
        ret.field = '$ne';
      }
      break;
    case '>':
      ret.field = eq ? '$gte' : '$gt';
      break;
    case '<':
      ret.field = eq ? '$lte' : '$lt';
      break;
    case '^':
    case '$':
    case '~':
      ret.field = '$regex';
      ret.options = 'i';
      ret.value = org.replace(this.valReqex, '');

      switch (op) {
        case '^':
          ret.value = '^' + val;
          break;
        case '$':
          ret.value = val + '$';
          break;
      }
      break;
    default:
      ret.org = org = op + org;
      ret.op = op = '';
      ret.value = this.parseStringVal(org);

      if (array) {
        ret.field = '$in';
      } else if (org === '') {
        ret.field = '$exists';
        ret.value = true;
      } else {
        ret.field = '$eq';
      }
  }

  ret.parsed = {};
  ret.parsed[ret.field] = ret.value;

  if (ret.options) {
    ret.parsed.$options = ret.options;
  }

  return ret;
};

module.exports.prototype.parseStringVal = function(string) {
  if (this.string.toBoolean && string.toLowerCase() === 'true') {
    return true;
  } else if (this.string.toBoolean && string.toLowerCase() === 'false') {
    return false;
  } else if (this.string.toNumber && !isNaN(parseFloat(string, 10))) {
    return parseFloat(string, 10);
  } else {
    return string;
  }
};

module.exports.prototype.parse = function(query) {
  var val;
  var res = {};

  for (var key in query) {
    val = query[key];

    // whitelist
    if (Object.keys(this.whitelist).length && !this.whitelist[key]) {
      continue;
    }

    // blacklist
    if (this.blacklist[key]) {
      continue;
    }

    // alias
    if (this.alias[key]) {
      key = this.alias[key];
    }

    // string key
    if (typeof val === 'string' && !this.keyRegex.test(key)) {
      continue;
    }

    // array key
    if (val instanceof Array && this.arrRegex.test(key)) {
      if (this.ops.indexOf('$in') >= 0 && val.length > 0) {
        // remove [] at end of key name (unless it has already been removed)
        key = key.replace(/\[\]$/, '');
        res[key] = {};

        for (var i = 0; i < val.length; i++) {
          if (this.ops.indexOf(val[i][0]) >= 0) {
            var parsed = this.parseString(val[i], true);

            switch (parsed.field) {
              case '$in':
              case '$nin':
                res[key][parsed.field] = res[key][parsed.field] || [];
                res[key][parsed.field].push(parsed.value);
                break;
              case '$regex':
                res[key].$regex = parsed.value;
                res[key].$options = parsed.options;
                break;
              default:
                res[key][parsed.field] = parsed.value;
            }
          } else {
            res[key].$in = res[key].$in || [];
            res[key].$in.push(this.parseStringVal(val[i]));
          }
        }
      }

      continue;
    }

    // value must be a string
    if (typeof val !== 'string') {
      continue;
    }

    // custom functions
    if (typeof this.custom[key] === 'function') {
      this.custom[key](res, val);

    // field exists query
    } else if (!val) {
      res[key] = { $exists: true };

    // query operators
    } else if (this.ops.indexOf(val[0]) >= 0) {
      res[key] = this.parseString(val).parsed;

    // equal operator (no operator)
    } else {
      res[key] = this.parseStringVal(val);
    }
  }
  return res;
};
