'use strict';

module.exports = function MongoQS(options) {
  const opts = options || {};

  this.ops = opts.ops || ['!', '^', '$', '~', '>', '<', '$in'];
  this.alias = opts.alias || {};
  this.blacklist = opts.blacklist || {};
  this.whitelist = opts.whitelist || {};
  this.custom = opts.custom || {};

  // String Value Parsing
  opts.string = opts.string || {};
  this.string = opts.string || {};
  this.string.toBoolean = (typeof opts.string.toBoolean === 'boolean') ? opts.string.toBoolean : true;
  this.string.toNumber = (typeof opts.string.toNumber === 'boolean') ? opts.string.toNumber : true;

  this.keyRegex = opts.keyRegex || /^[a-zæøå0-9-_.]+$/i;
  this.valRegex = opts.valRegex || /[^a-zæøå0-9-_.* ]/i;
  this.arrRegex = opts.arrRegex || /^[a-zæøå0-9-_.]+(\[])?$/i;

  if (this.custom.bbox) {
    this.custom.bbox = this.customBBOX(this.custom.bbox);
  }

  if (this.custom.near) {
    this.custom.near = this.customNear(this.custom.near);
  }

  if (this.custom.after) {
    this.custom.after = this.customAfter(this.custom.after);
  }

  if (this.custom.before) {
    this.custom.before = this.customBefore(this.custom.before);
  }

  if (this.custom.between) {
    this.custom.between = this.customBetween(this.custom.between);
  }


  return this;
};

module.exports.prototype.customBBOX = field => (query, bbox) => {
  const bboxArr = bbox.split(',');

  if (bboxArr.length === 4) {
    // Optimize by unrolling the loop
    bboxArr[0] = parseFloat(bboxArr[0], 10);
    bboxArr[1] = parseFloat(bboxArr[1], 10);
    bboxArr[2] = parseFloat(bboxArr[2], 10);
    bboxArr[3] = parseFloat(bboxArr[3], 10);

    if (!isNaN(bboxArr.reduce((a, b) => a + b))) {
      query[field] = {
        $geoWithin: {
          $geometry: {
            type: 'Polygon',
            coordinates: [[
              [bboxArr[0], bboxArr[1]],
              [bboxArr[2], bboxArr[1]],
              [bboxArr[2], bboxArr[3]],
              [bboxArr[0], bboxArr[3]],
              [bboxArr[0], bboxArr[1]],
            ]],
          },
        },
      };
    }
  }
};

module.exports.prototype.customNear = field => (query, point) => {
  const pointArr = point.split(',').map(p => parseFloat(p, 10));

  if (pointArr.length >= 2) {
    if (!isNaN(pointArr.reduce((a, b) => a + b))) {
      const max = pointArr[2];
      const min = pointArr[3];

      query[field] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: pointArr.splice(0, 2),
          },
        },
      };

      if (!isNaN(max)) {
        query[field].$near.$maxDistance = max;

        if (!isNaN(min)) {
          query[field].$near.$minDistance = min;
        }
      }
    }
  }
};

function parseDate(value) {
  let date = value;

  if (!isNaN(date)) {
    if (`${date}`.length === 10) {
      date = `${date}000`;
    }
    date = parseInt(date, 10);
  }

  date = new Date(date);

  return date;
}

module.exports.prototype.customAfter = field => (query, value) => {
  const date = parseDate(value);

  if (date.toString() !== 'Invalid Date') {
    query[field] = {
      $gte: date.toISOString(),
    };
  }
};

module.exports.prototype.customBefore = field => (query, value) => {
  const date = parseDate(value);

  if (date.toString() !== 'Invalid Date') {
    query[field] = {
      $lt: date.toISOString(),
    };
  }
};

module.exports.prototype.customBetween = field => (query, value) => {
  const dates = value.split('|');
  const afterValue = dates[0];
  const beforeValue = dates[1];

  const after = parseDate(afterValue);
  const before = parseDate(beforeValue);

  if (after.toString() !== 'Invalid Date' && before.toString() !== 'Invalid Date') {
    query[field] = {
      $gte: after.toISOString(),
      $lt: before.toISOString(),
    };
  }
};

module.exports.prototype.parseString = function parseString(string, array) {
  let op = string[0] || '';
  const eq = string[1] === '=';
  let org = string.substr(eq ? 2 : 1) || '';
  const val = this.parseStringVal(org);

  const ret = { op, org, value: val };

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
          ret.value = `^${val}`;
          break;
        case '$':
          ret.value = `${val}$`;
          break;
        default:
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

module.exports.prototype.parseStringVal = function parseStringVal(string) {
  if (this.string.toBoolean && string.toLowerCase() === 'true') {
    return true;
  } else if (this.string.toBoolean && string.toLowerCase() === 'false') {
    return false;
  } else if (this.string.toNumber && !isNaN(parseInt(string, 10)) &&
      ((+string - +string) + 1) >= 0) {
    return parseFloat(string, 10);
  }

  return string;
};

module.exports.prototype.parse = function parse(query) {
  const res = {};

  Object.keys(query).forEach((k) => {
    let key = k;
    const val = query[key];

    // normalize array keys
    if (val instanceof Array) {
      key = key.replace(/\[]$/, '');
    }

    // whitelist
    if (Object.keys(this.whitelist).length && !this.whitelist[key]) {
      return;
    }

    // blacklist
    if (this.blacklist[key]) {
      return;
    }

    // alias
    if (this.alias[key]) {
      key = this.alias[key];
    }

    // string key
    if (typeof val === 'string' && !this.keyRegex.test(key)) {
      return;

    // array key
    } else if (val instanceof Array && !this.arrRegex.test(key)) {
      return;
    }

    // custom functions
    if (typeof this.custom[key] === 'function') {
      this.custom[key].apply(null, [res, val]);
      return;
    }

    // array key
    if (val instanceof Array) {
      if (this.ops.indexOf('$in') >= 0 && val.length > 0) {
        res[key] = {};

        for (let i = 0; i < val.length; i += 1) {
          if (this.ops.indexOf(val[i][0]) >= 0) {
            const parsed = this.parseString(val[i], true);

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

      return;
    }

    // value must be a string
    if (typeof val !== 'string') {
      return;
    }

    // field exists query
    if (!val) {
      res[key] = { $exists: true };

    // query operators
    } else if (this.ops.indexOf(val[0]) >= 0) {
      res[key] = this.parseString(val).parsed;

    // equal operator (no operator)
    } else {
      res[key] = this.parseStringVal(val);
    }
  });

  return res;
};
