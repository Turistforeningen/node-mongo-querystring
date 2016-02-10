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

    if (point.length === 2) {
      point[0] = parseFloat(point[0], 10);
      point[1] = parseFloat(point[1], 10);

      if (!isNaN(point.reduce(function(a,b){return a+b;}))) {
        query[field] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: point,
            },
          },
        };
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

module.exports.prototype.parseString = function(string) {
  if (this.string.toBoolean && string.toLowerCase() === 'true') {
    return true;
  } else if (this.string.toBoolean && string.toLowerCase() === 'false') {
    return false;
  } else if (this.string.toNumber && !isNaN(string)) {
    return parseFloat(string, 10);
  } else {
    return string;
  }
};

module.exports.prototype.parse = function(query) {
  var op, val;
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

        // $in query
        if (val[0][0] !== '!') {
          res[key] = {$in: val.filter(function(element) {
            return element[0] !== '!';
          }).map(function(element) {
            return this.parseString(element);
          }.bind(this))};

        // $nin query
        } else {
          res[key] = {$nin: val.filter(function(element) {
            return element[0] === '!';
          }).map(function(element) {
            return this.parseString(element.substr(1));
          }.bind(this))};
        }
      }

      continue;
    }

    if (typeof val !== 'string') {
      continue;
    }

    if (typeof this.custom[key] === 'function') {
      this.custom[key](res, val);

    } else if (!val) {
      res[key] = { $exists: true };

    } else if (this.ops.indexOf(val[0]) >= 0) {
      op = val.charAt(0);
      val = val.substr(1);

      res[key] = (function() {
        switch (op) {
          case '!':
            if (val) {
              return { $ne: this.parseString(val) };
            } else {
              return { $exists: false };
            }
            break;
          case '>':
            return { $gt: parseFloat(val, 10) };
          case '<':
            return { $lt: parseFloat(val, 10) };
          default:
            val = val.replace(/[^a-zæøå0-9-_.* ]/i, '');
            switch (op) {
              case '^':
                return { $regex: '^' + val, $options: 'i' };
              case '$':
                return { $regex: val + '$', $options: 'i' };
              default:
                return { $regex: val, $options: 'i' };
            }
        }
      }.bind(this))();
    } else {
      res[key] = this.parseString(val);
    }
  }
  return res;
};
