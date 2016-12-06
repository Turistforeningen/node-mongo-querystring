'use strict';

const assert = require('assert');
const MongoQS = require('./');

const querystring = require('querystring');
const qs = require('qs'); // eslint-disable-line import/no-extraneous-dependencies

let mqs = null;
let query = null;

beforeEach(() => {
  mqs = new MongoQS();
  query = {};
});

describe('customBBOX()', () => {
  it('does not return $geoWithin query for invalid bbox', () => {
    ['0123', '0,1,2', '0,1,2,a'].forEach((bbox) => {
      mqs.customBBOX('gojson')(query, bbox);
      assert.deepEqual(query, {});
    });
  });

  it('returns $geoWithin query for valid bbox', () => {
    mqs.customBBOX('geojson')(query, '0,1,2,3');
    assert.deepEqual(query, {
      geojson: {
        $geoWithin: {
          $geometry: {
            type: 'Polygon',
            coordinates: [[
              [0, 1],
              [2, 1],
              [2, 3],
              [0, 3],
              [0, 1],
            ]],
          },
        },
      },
    });
  });
});

describe('customNear()', () => {
  it('does not return $near query for invalid point', () => {
    ['0123', '0,'].forEach((bbox) => {
      mqs.customNear('gojson')(query, bbox);
      assert.deepEqual(query, {});
    });
  });

  it('returns $near query for valid point', () => {
    ['0,1', '60.70908,10.37140'].forEach((point) => {
      mqs.customNear('geojson')(query, point);
      assert.deepEqual(query, {
        geojson: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: point.split(',').map(parseFloat),
            },
          },
        },
      });
    });
  });

  it('returns $near query with max distance', () => {
    ['0,1,2', '60.70908,10.37140,211.123'].forEach((point) => {
      const q = {};

      mqs.customNear('geojson')(q, point);
      assert.deepEqual(q, {
        geojson: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: point.split(',').splice(0, 2).map(parseFloat, 10),
            },
            $maxDistance: parseFloat(point.split(',')[2], 10),
          },
        },
      });
    });
  });

  it('returns $near query with max and min distance', () => {
    ['0,1,2,4', '60.70908,10.37140,211.123,321.456'].forEach((point) => {
      const q = {};

      mqs.customNear('geojson')(q, point);
      assert.deepEqual(q, {
        geojson: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: point.split(',').splice(0, 2).map(parseFloat, 10),
            },
            $maxDistance: parseFloat(point.split(',')[2], 10),
            $minDistance: parseFloat(point.split(',')[3], 10),
          },
        },
      });
    });
  });
});

describe('customAfter()', () => {
  it('does not return after query for invalid date', () => {
    ['foo', '2015-13-40'].forEach((date) => {
      mqs.customAfter('endret')(query, date);
      assert.deepEqual(query, {});
    });
  });

  it('returns after query for valid ISO date', () => {
    mqs.customAfter('endret')(query, '2014-09-22T11:50:37.843Z');
    assert.deepEqual(query, {
      endret: {
        $gte: '2014-09-22T11:50:37.843Z',
      },
    });
  });

  it('returns after query for milliseconds timestamp', () => {
    mqs.customAfter('endret')(query, '1411386637843');
    assert.deepEqual(query, {
      endret: {
        $gte: '2014-09-22T11:50:37.843Z',
      },
    });
  });

  it('returns after query for unix timestamp', () => {
    mqs.customAfter('endret')(query, '1411386637');
    assert.deepEqual(query, {
      endret: {
        $gte: '2014-09-22T11:50:37.000Z',
      },
    });
  });
});

describe('customBefore()', () => {
  it('does not return before query for invalid date', () => {
    ['foo', '2015-13-40'].forEach((date) => {
      mqs.customBefore('endret')(query, date);
      assert.deepEqual(query, {});
    });
  });

  it('returns before query for valid ISO date', () => {
    mqs.customBefore('endret')(query, '2014-09-22T11:50:37.843Z');
    assert.deepEqual(query, {
      endret: {
        $lt: '2014-09-22T11:50:37.843Z',
      },
    });
  });

  it('returns before query for milliseconds timestamp', () => {
    mqs.customBefore('endret')(query, '1411386637843');
    assert.deepEqual(query, {
      endret: {
        $lt: '2014-09-22T11:50:37.843Z',
      },
    });
  });

  it('returns before query for unix timestamp', () => {
    mqs.customBefore('endret')(query, '1411386637');
    assert.deepEqual(query, {
      endret: {
        $lt: '2014-09-22T11:50:37.000Z',
      },
    });
  });
});

describe('customBetween()', () => {
  it('does not return between query for invalid date', () => {
    ['foo|bar', '2015-13-40|2020-42-69'].forEach((date) => {
      mqs.customBetween('endret')(query, date);
      assert.deepEqual(query, {});
    });
  });

  it('returns between query for valid ISO date', () => {
    mqs.customBetween('endret')(query, '2014-09-22T11:50:37.843Z|2015-09-22T11:50:37.843Z');
    assert.deepEqual(query, {
      endret: {
        $gte: '2014-09-22T11:50:37.843Z',
        $lt: '2015-09-22T11:50:37.843Z',
      },
    });
  });

  it('returns between query for milliseconds timestamp', () => {
    mqs.customBetween('endret')(query, '1411386637843|1442922637843');
    assert.deepEqual(query, {
      endret: {
        $gte: '2014-09-22T11:50:37.843Z',
        $lt: '2015-09-22T11:50:37.843Z',
      },
    });
  });

  it('returns before query for unix timestamp', () => {
    mqs.customBetween('endret')(query, '1411386637|1442922637');
    assert.deepEqual(query, {
      endret: {
        $gte: '2014-09-22T11:50:37.000Z',
        $lt: '2015-09-22T11:50:37.000Z',
      },
    });
  });
});

describe('parseStringVal()', () => {
  describe('true', () => {
    [
      'true',
      'TrUe',
      'TRUE',
    ].forEach((val) => {
      it(`returns true for "${val}" string`, () => {
        assert.strictEqual(mqs.parseStringVal(val), true);
      });

      it(`returns "${val}" for "${val}" when !toBoolean`, () => {
        mqs.string.toBoolean = false;
        assert.strictEqual(mqs.parseStringVal(val), val);
      });
    });
  });

  describe('false', () => {
    [
      'false',
      'FaLsE',
      'FALSE',
    ].forEach((val) => {
      it(`returns false for "${val}" string`, () => {
        assert.strictEqual(mqs.parseStringVal(val), false);
      });

      it(`returns "${val}" for "${val}" when !toBoolean`, () => {
        mqs.string.toBoolean = false;
        assert.strictEqual(mqs.parseStringVal(val), val);
      });
    });
  });

  describe('integers', () => {
    [
      '0',
      '1',
      '100',
      '000100',

      '+0',
      '+1',
      '+100',
      '+000100',

      '-0',
      '-1',
      '-100',
      '-000100',

      ' 0 ',
      ' 1 ',
      ' 100 ',
      ' 000100 ',
    ].forEach((val) => {
      const ret = parseInt(val, 10);

      it(`returns ${ret} for "${val}"`, () => {
        assert.strictEqual(mqs.parseStringVal(val), ret);
        assert.notStrictEqual(mqs.parseStringVal(val), NaN);
      });

      it(`returns "${val}" for "${val}" when !toNumber`, () => {
        mqs.string.toNumber = false;
        assert.strictEqual(mqs.parseStringVal(val), val);
      });
    });
  });

  describe('floats', () => {
    [
      '0.0',
      '1.1',
      '100.99',
      '000100.0099',

      '+0.0',
      '+1.1',
      '+100.99',
      '+000100.0099',

      '-0.0',
      '-1.1',
      '-100.99',
      '-000100.0099',

      ' 0.0 ',
      ' 1.1 ',
      ' 100.99 ',
      ' 000100.0099 ',
    ].forEach((val) => {
      const ret = parseFloat(val, 10);

      it(`returns ${ret} for "${val}"`, () => {
        assert.strictEqual(mqs.parseStringVal(val), parseFloat(val, 10));
        assert.notStrictEqual(mqs.parseStringVal(val), NaN);
      });

      it(`returns "${val}" for "${val}" when !toNumber`, () => {
        mqs.string.toNumber = false;
        assert.strictEqual(mqs.parseStringVal(val), val);
      });
    });
  });

  describe('strings', () => {
    [
      '',

      ' ',
      '  ',
      '    ',

      '+',
      '-',
      ' + ',
      ' - ',

      'a',
      'ab',
      'abc',

      ' a ',
      ' ab ',
      ' abc ',

      'abc123abc',
      'abc123',
      '123abc',
      '123abc123',
    ].forEach((val) => {
      it(`returns "${val}" for "${val}"`, () => {
        assert.strictEqual(mqs.parseStringVal(val), val);
      });
    });
  });
});

describe('parseString()', () => {
  it('returns $nin for "!" operator when array is true', () => {
    assert.deepEqual(mqs.parseString('!10', true), {
      field: '$nin',
      op: '!',
      org: '10',
      parsed: { $nin: 10 },
      value: 10,
    });
  });

  it('returns $in for "" operator when array is true', () => {
    assert.deepEqual(mqs.parseString('10', true), {
      field: '$in',
      op: '',
      org: '10',
      parsed: { $in: 10 },
      value: 10,
    });
  });

  it('returns $exists false for "!" operator when value is ""', () => {
    assert.deepEqual(mqs.parseString('!'), {
      field: '$exists',
      op: '!',
      org: '',
      parsed: { $exists: false },
      value: false,
    });
  });

  it('returns $exists true for "" operator when value is ""', () => {
    assert.deepEqual(mqs.parseString(''), {
      field: '$exists',
      op: '',
      org: '',
      parsed: { $exists: true },
      value: true,
    });
  });

  it('returns $ne for "!" operator', () => {
    assert.deepEqual(mqs.parseString('!10'), {
      field: '$ne',
      op: '!',
      org: '10',
      parsed: { $ne: 10 },
      value: 10,
    });
  });

  it('returns $eq for "" operator', () => {
    assert.deepEqual(mqs.parseString('10'), {
      field: '$eq',
      op: '',
      org: '10',
      parsed: { $eq: 10 },
      value: 10,
    });
  });

  it('returns $gt for ">" operator', () => {
    assert.deepEqual(mqs.parseString('>10'), {
      field: '$gt',
      op: '>',
      org: '10',
      parsed: { $gt: 10 },
      value: 10,
    });
  });

  it('returns $gte for ">=" operator', () => {
    assert.deepEqual(mqs.parseString('>=10'), {
      field: '$gte',
      op: '>',
      org: '10',
      parsed: { $gte: 10 },
      value: 10,
    });
  });

  it('returns $lt for "<" operator', () => {
    assert.deepEqual(mqs.parseString('<10'), {
      field: '$lt',
      op: '<',
      org: '10',
      parsed: { $lt: 10 },
      value: 10,
    });
  });

  it('returns $lte for "<=" operator', () => {
    assert.deepEqual(mqs.parseString('<=10'), {
      field: '$lte',
      op: '<',
      org: '10',
      parsed: { $lte: 10 },
      value: 10,
    });
  });

  it('returns $regex for "^" operator', () => {
    assert.deepEqual(mqs.parseString('^10'), {
      field: '$regex',
      op: '^',
      options: 'i',
      org: '10',
      parsed: { $options: 'i', $regex: '^10' },
      value: '^10',
    });
  });

  it('returns $regex for "$" operator', () => {
    assert.deepEqual(mqs.parseString('$10'), {
      field: '$regex',
      op: '$',
      options: 'i',
      org: '10',
      parsed: { $options: 'i', $regex: '10$' },
      value: '10$',
    });
  });

  it('returns $regex for "~" operator', () => {
    assert.deepEqual(mqs.parseString('~10'), {
      field: '$regex',
      op: '~',
      options: 'i',
      org: '10',
      parsed: { $options: 'i', $regex: '10' },
      value: '10',
    });
  });
});

describe('parse()', () => {
  describe('parsing', () => {
    describe('key value validation', () => {
      it('accepts keys with alpha num names', () => {
        assert.deepEqual(mqs.parse({
          'Abc.Æøå_123-456': 'bix',
        }), {
          'Abc.Æøå_123-456': 'bix',
        });
      });

      it('discards keys with special chars', () => {
        assert.deepEqual(mqs.parse({
          h4xor$: 'bix',
        }), {});
      });

      it('discards non-string values', () => {
        assert.deepEqual(mqs.parse({
          foo: [],
        }), {});
        assert.deepEqual(mqs.parse({
          foo: {},
        }), {});
        assert.deepEqual(mqs.parse({
          foo: false,
        }), {});
      });
    });

    describe('no operator', () => {
      it('returns empty query set', () => {
        assert.deepEqual(mqs.parse({}), {});
      });

      it('returns equal query', () => {
        assert.deepEqual(mqs.parse({
          navn: 'foo',
        }), {
          navn: 'foo',
        });
      });

      it('return string boolean as boolean', () => {
        query = mqs.parse({
          foo: 'true',
          bar: 'false',
        });
        assert.deepEqual(query, {
          foo: true,
          bar: false,
        });
      });

      it('returns string integer as number', () => {
        query = mqs.parse({
          navn: '10',
        });
        assert.deepEqual(query, {
          navn: 10,
        });
        assert.strictEqual(query.navn, 10);
      });

      it('returns string float as number', () => {
        query = mqs.parse({
          navn: '10.110',
        });
        assert.deepEqual(query, {
          navn: 10.110,
        });
        assert.strictEqual(query.navn, 10.110);
      });

      it('returns exists for empty query', () => {
        assert.deepEqual(mqs.parse({
          navn: '',
        }), {
          navn: {
            $exists: true,
          },
        });
      });
    });

    describe('! operator', () => {
      it('returns unequal query', () => {
        assert.deepEqual(mqs.parse({
          navn: '!foo',
        }), {
          navn: {
            $ne: 'foo',
          },
        });
      });

      it('return string boolean as boolean', () => {
        query = mqs.parse({
          foo: '!true',
          bar: '!false',
        });
        assert.deepEqual(query, {
          foo: { $ne: true },
          bar: { $ne: false },
        });
      });

      it('returns string integer as number', () => {
        query = mqs.parse({
          navn: '!10',
        });
        assert.deepEqual(query, {
          navn: {
            $ne: 10,
          },
        });
        assert.strictEqual(query.navn.$ne, 10);
      });

      it('returns string float as number', () => {
        query = mqs.parse({
          navn: '!10.110',
        });
        assert.deepEqual(query, {
          navn: {
            $ne: 10.110,
          },
        });
        assert.strictEqual(query.navn.$ne, 10.110);
      });

      it('returns not exists for empty query', () => {
        assert.deepEqual(mqs.parse({
          navn: '!',
        }), {
          navn: {
            $exists: false,
          },
        });
      });
    });

    describe('> operator', () => {
      it('returns greater than query', () => {
        query = mqs.parse({
          navn: '>10.110',
        });
        assert.deepEqual(query, {
          navn: {
            $gt: 10.110,
          },
        });
        return assert.strictEqual(query.navn.$gt, 10.110);
      });
    });

    describe('>= operator', () => {
      it('returns greater than or equal to query', () => {
        query = mqs.parse({
          navn: '>=10.110',
        });
        assert.deepEqual(query, {
          navn: {
            $gte: 10.110,
          },
        });
        return assert.strictEqual(query.navn.$gte, 10.110);
      });
    });

    describe('< operator', () => {
      it('returns less than query', () => {
        query = mqs.parse({
          navn: '<10.110',
        });
        assert.deepEqual(query, {
          navn: {
            $lt: 10.110,
          },
        });
        assert.strictEqual(query.navn.$lt, 10.110);
      });
    });

    describe('<= operator', () => {
      it('returns less than query or equal to', () => {
        query = mqs.parse({
          navn: '<=10.110',
        });
        assert.deepEqual(query, {
          navn: {
            $lte: 10.110,
          },
        });
        assert.strictEqual(query.navn.$lte, 10.110);
      });
    });

    describe('multiple <, <=, >, >= operators', () => {
      it('returns multiple comparison operators for same field', () => {
        query = mqs.parse({
          count: ['>0.123', '>=1.234', '<2.345', '<=3.456'],
        });
        assert.deepEqual(query, {
          count: {
            $gt: 0.123,
            $gte: 1.234,
            $lt: 2.345,
            $lte: 3.456,
          },
        });
      });
    });

    describe('^ operator', () => {
      it('returns starts with query', () => {
        assert.deepEqual(mqs.parse({
          navn: '^foo',
        }), {
          navn: {
            $regex: '^foo',
            $options: 'i',
          },
        });
      });
    });

    describe('$ operator', () => {
      it('returns ends with query', () => {
        assert.deepEqual(mqs.parse({
          navn: '$foo',
        }), {
          navn: {
            $regex: 'foo$',
            $options: 'i',
          },
        });
      });
    });

    describe('~ operator', () => {
      it('returns contains query', () => {
        assert.deepEqual(mqs.parse({
          navn: '~foo',
        }), {
          navn: {
            $regex: 'foo',
            $options: 'i',
          },
        });
      });
    });

    describe('$in / $nin operator', () => {
      it('returns in array query', () => {
        const string = 'foo[]=10&foo[]=10.011&foo[]=bar&foo[]=true';
        const params = querystring.parse(string);

        assert.deepEqual(mqs.parse(params), {
          foo: {
            $in: [10, 10.011, 'bar', true],
          },
        });
      });

      it('returns in array query with "qs" parser (GH-06)', () => {
        const string = 'foo[]=10&foo[]=10.011&foo[]=bar&foo[]=true';
        const params = qs.parse(string);

        assert.deepEqual(mqs.parse(params), {
          foo: {
            $in: [10, 10.011, 'bar', true],
          },
        });
      });

      it('returns in array with any not in array query', () => {
        const string = 'foo[]=10&foo[]=!10.011&foo[]=!bar&foo[]=baz';
        const params = querystring.parse(string);

        assert.deepEqual(mqs.parse(params), {
          foo: {
            $in: [10, 'baz'],
            $nin: [10.011, 'bar'],
          },
        });
      });

      it('returns not in array query', () => {
        const string = 'foo[]=!10&foo[]=!10.011&foo[]=!bar&foo[]=!false';
        const params = querystring.parse(string);

        assert.deepEqual(mqs.parse(params), {
          foo: {
            $nin: [10, 10.011, 'bar', false],
          },
        });
      });

      it('returns not in array query with "gs" parser (GH-06)', () => {
        const string = 'foo[]=!10&foo[]=!10.011&foo[]=!bar&foo[]=!false';
        const params = qs.parse(string);

        assert.deepEqual(mqs.parse(params), {
          foo: {
            $nin: [10, 10.011, 'bar', false],
          },
        });
      });


      it('returns not in array with any in array query', () => {
        const string = 'foo[]=!10&foo[]=10.011&foo[]=bar&foo[]=!baz';
        const params = querystring.parse(string);

        assert.deepEqual(mqs.parse(params), {
          foo: {
            $nin: [10, 'baz'],
            $in: [10.011, 'bar'],
          },
        });
      });
    });

    it('returns multiple querys', () => {
      const string = [
        'foo=',
        'bar=!',
        'baz=!foo',
        'bix=bez',
        '%foo=bar',
        'bix.bax=that',
        'foo-bar=bar-foo',
      ].join('&&');
      const params = querystring.parse(string);

      assert.deepEqual(mqs.parse(params), {
        foo: { $exists: true },
        bar: { $exists: false },
        baz: { $ne: 'foo' },
        bix: 'bez',
        'bix.bax': 'that',
        'foo-bar': 'bar-foo',
      });
    });
  });

  describe('aliasing', () => {
    it('returns query for aliased key', () => {
      mqs = new MongoQS({
        alias: {
          foo: 'bar',
        },
      });

      assert.deepEqual(mqs.parse({
        foo: 'bix',
      }), {
        bar: 'bix',
      });
    });

    it('returns multiple queries for aliased keys', () => {
      mqs = new MongoQS({
        alias: {
          foo: 'bar',
          baz: 'bax',
        },
      });

      assert.deepEqual(mqs.parse({
        foo: 'bix',
        baz: 'box',
      }), {
        bar: 'bix',
        bax: 'box',
      });
    });
  });

  describe('blacklisting', () => {
    it('does not return query for blacklisted key', () => {
      mqs = new MongoQS({
        blacklist: {
          foo: true,
        },
      });

      assert.deepEqual(mqs.parse({
        foo: 'bar',
        bar: 'foo',
      }), {
        bar: 'foo',
      });
    });

    it('does not return multiple query for blacklisted keys', () => {
      mqs = new MongoQS({
        blacklist: {
          foo: true,
          bar: true,
        },
      });

      assert.deepEqual(mqs.parse({
        foo: 'bar',
        bar: 'foo',
        baz: 'bax',
      }), {
        baz: 'bax',
      });
    });
  });

  describe('whitelisting', () => {
    it('returns query only for whitelisted key', () => {
      mqs = new MongoQS({
        whitelist: {
          foo: true,
        },
      });

      assert.deepEqual(mqs.parse({
        foo: 'bar',
        bar: 'foo',
        baz: 'bax',
      }), {
        foo: 'bar',
      });
    });

    it('returns multiple queries for whitelisted keys', () => {
      mqs = new MongoQS({
        whitelist: {
          foo: true,
          bar: true,
        },
      });

      assert.deepEqual(mqs.parse({
        foo: 'bar',
        bar: 'foo',
        baz: 'bax',
      }), {
        foo: 'bar',
        bar: 'foo',
      });
    });
  });

  describe('custom', () => {
    it('returns custom bbox query', () => {
      mqs = new MongoQS({
        custom: {
          bbox: 'geojson',
        },
      });

      assert.deepEqual(mqs.parse({
        bbox: '0,1,2,3',
      }), {
        geojson: {
          $geoWithin: {
            $geometry: {
              type: 'Polygon',
              coordinates: [[[0, 1], [2, 1], [2, 3], [0, 3], [0, 1]]],
            },
          },
        },
      });
    });

    it('returns custom near query', () => {
      mqs = new MongoQS({
        custom: {
          near: 'geojson',
        },
      });

      assert.deepEqual(mqs.parse({
        near: '0,1',
      }), {
        geojson: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [0, 1],
            },
          },
        },
      });
    });

    it('returns custom after query', () => {
      mqs = new MongoQS({
        custom: {
          after: 'endret',
        },
      });
      assert.deepEqual(mqs.parse({
        after: '2014-01-01',
      }), {
        endret: {
          $gte: '2014-01-01T00:00:00.000Z',
        },
      });
    });

    it('returns custom before query', () => {
      mqs = new MongoQS({
        custom: {
          before: 'endret',
        },
      });
      assert.deepEqual(mqs.parse({
        before: '2014-01-01',
      }), {
        endret: {
          $lt: '2014-01-01T00:00:00.000Z',
        },
      });
    });

    it('returns custom between query', () => {
      mqs = new MongoQS({
        custom: {
          between: 'endret',
        },
      });
      assert.deepEqual(mqs.parse({
        between: '2014-01-01|2015-01-01',
      }), {
        endret: {
          $gte: '2014-01-01T00:00:00.000Z',
          $lt: '2015-01-01T00:00:00.000Z',
        },
      });
    });

    it('returns custom function query', () => {
      mqs = new MongoQS({
        custom: {
          assigned: (queryObject, inputValue) => {
            queryObject['assigned.users._id'] = {
              $in: inputValue.map(id => parseInt(id, 10)),
            };
          },
        },
      });

      assert.deepEqual(mqs.parse({
        assigned: ['1111', '2222'],
      }), {
        'assigned.users._id': { $in: [1111, 2222] },
      });
    });
  });
});
