'use strict';

var assert = require('assert');
var MongoQS = require('./');

var qs, query;

beforeEach(function() {
  qs = new MongoQS();
  query = {};
});

describe('customBBOX()', function() {
  it('does not return $geoWithin query for invalid bbox', function() {
    ['0123', '0,1,2', '0,1,2,a'].forEach(function(bbox) {
      qs.customBBOX('gojson')(query, bbox);
      assert.deepEqual(query, {});
    });
  });

  it('returns $geoWithin query for valid bbox', function() {
    qs.customBBOX('geojson')(query, '0,1,2,3');
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

describe('customNear()', function() {
  it('does not return $near query for invalid point', function() {
    ['0123', '0,'].forEach(function(bbox) {
      qs.customNear('gojson')(query, bbox);
      assert.deepEqual(query, {});
    });
  });

  it('returns $near query for valid point', function() {
    ['0,1', '60.70908,10.37140'].forEach(function(point) {
      qs.customNear('geojson')(query, point);
      assert.deepEqual(query, {
        geojson: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: point.split(',').map(parseFloat),
            }
          }
        }
      });
    });
  });
});

describe('customAfter()', function() {
  it('does not return after query for invalid date', function() {
    ['foo', '2015-13-40'].forEach(function(date) {
      qs.customAfter('endret')(query, date);
      assert.deepEqual(query, {});
    });
  });

  it('returns after query for valid ISO date', function() {
    qs.customAfter('endret')(query, '2014-09-22T11:50:37.843Z');
    assert.deepEqual(query, {
      endret: {
        $gte: '2014-09-22T11:50:37.843Z'
      }
    });
  });

  it('returns after query for milliseconds timestamp', function() {
    qs.customAfter('endret')(query, '1411386637843');
    assert.deepEqual(query, {
      endret: {
        $gte: '2014-09-22T11:50:37.843Z'
      }
    });
  });

  it('returns after query for unix timestamp', function() {
    qs.customAfter('endret')(query, '1411386637');
    assert.deepEqual(query, {
      endret: {
        $gte: '2014-09-22T11:50:37.000Z'
      }
    });
  });
});

describe('parseStringVal()', function() {
  it('returns boolean true for "true" string', function() {
    assert.equal(qs.parseStringVal('true'), true);
  });

  it('returns string "true" when boolean parsing is disabled', function() {
    qs.string.toBoolean = false;
    assert.equal(qs.parseStringVal('true'), 'true');
  });

  it('returns boolean false for "flase" string', function() {
    assert.equal(qs.parseStringVal('false'), false);
  });

  it('returns string "false" when boolean parsing is disabled', function() {
    qs.string.toBoolean = false;
    assert.equal(qs.parseStringVal('false'), 'false');
  });

  it('returns number for parseable integer', function() {
    assert.equal(qs.parseStringVal('100'), 100);
  });

  it('returns string number when number parsing is disabled', function() {
    qs.string.toNumber = false;
    assert.equal(qs.parseStringVal('100'), '100');
  });

  it('returns number for zero padded parseable integer', function() {
    assert.equal(qs.parseStringVal('000100'), 100);
  });

  it('returns number for parseable float', function() {
    assert.equal(qs.parseStringVal('10.123'), 10.123);
  });

  it('returns number for zero padded parseable float', function() {
    assert.equal(qs.parseStringVal('00010.123'), 10.123);
  });

  it('returns string for empty string', function() {
    assert.equal(qs.parseStringVal(''), '');
  });
});

describe('parseString()', function() {
  it('returns $nin for "!" operator when array is true', function() {
    assert.deepEqual(qs.parseString('!10', true), {
      field: '$nin',
      op: '!',
      org: '10',
      parsed: {$nin: 10},
      value: 10
    });
  });

  it('returns $in for "" operator when array is true', function() {
    assert.deepEqual(qs.parseString('10', true), {
      field: '$in',
      op: '',
      org: '10',
      parsed: {$in: 10},
      value: 10
    });
  });

  it('returns $exists false for "!" operator when value is ""', function() {
    assert.deepEqual(qs.parseString('!'), {
      field: '$exists',
      op: '!',
      org: '',
      parsed: {$exists: false},
      value: false
    });
  });

  it('returns $exists true for "" operator when value is ""', function() {
    assert.deepEqual(qs.parseString(''), {
      field: '$exists',
      op: '',
      org: '',
      parsed: {$exists: true},
      value: true
    });
  });

  it('returns $ne for "!" operator', function() {
    assert.deepEqual(qs.parseString('!10'), {
      field: '$ne',
      op: '!',
      org: '10',
      parsed: {$ne: 10},
      value: 10
    });
  });

  it('returns $eq for "" operator', function() {
    assert.deepEqual(qs.parseString('10'), {
      field: '$eq',
      op: '',
      org: '10',
      parsed: {$eq: 10},
      value: 10
    });
  });

  it('returns $gt for ">" operator', function() {
    assert.deepEqual(qs.parseString('>10'), {
      field: '$gt',
      op: '>',
      org: '10',
      parsed: {$gt: 10},
      value: 10
    });
  });

  it('returns $gte for ">=" operator', function() {
    assert.deepEqual(qs.parseString('>=10'), {
      field: '$gte',
      op: '>',
      org: '10',
      parsed: {$gte: 10},
      value: 10
    });
  });

  it('returns $lt for "<" operator', function() {
    assert.deepEqual(qs.parseString('<10'), {
      field: '$lt',
      op: '<',
      org: '10',
      parsed: {$lt: 10},
      value: 10
    });
  });

  it('returns $lte for "<=" operator', function() {
    assert.deepEqual(qs.parseString('<=10'), {
      field: '$lte',
      op: '<',
      org: '10',
      parsed: {$lte: 10},
      value: 10
    });
  });

  it('returns $regex for "^" operator', function() {
    assert.deepEqual(qs.parseString('^10'), {
      field: '$regex',
      op: '^',
      options: 'i',
      org: '10',
      parsed: {$options: 'i', $regex: '^10'},
      value: '^10'
    });
  });

  it('returns $regex for "$" operator', function() {
    assert.deepEqual(qs.parseString('$10'), {
      field: '$regex',
      op: '$',
      options: 'i',
      org: '10',
      parsed: {$options: 'i', $regex: '10$'},
      value: '10$'
    });
  });

  it('returns $regex for "~" operator', function() {
    assert.deepEqual(qs.parseString('~10'), {
      field: '$regex',
      op: '~',
      options: 'i',
      org: '10',
      parsed: {$options: 'i', $regex: '10'},
      value: '10'
    });
  });
});

describe('parse()', function() {
  describe('parsing', function() {
    describe('key value validation', function() {
      it('accepts keys with alpha num names', function() {
        assert.deepEqual(qs.parse({
          'Abc.Æøå_123-456': 'bix'
        }), {
          'Abc.Æøå_123-456': 'bix'
        });
      });

      it('discards keys with special chars', function() {
        assert.deepEqual(qs.parse({
          'h4xor$': 'bix'
        }), {});
      });

      it('discards non-string values', function() {
        assert.deepEqual(qs.parse({
          'foo': []
        }), {});
        assert.deepEqual(qs.parse({
          'foo': {}
        }), {});
        assert.deepEqual(qs.parse({
          'foo': false
        }), {});
      });
    });

    describe('no operator', function() {
      it('returns empty query set', function() {
        assert.deepEqual(qs.parse({}), {});
      });

      it('returns equal query', function() {
        assert.deepEqual(qs.parse({
          navn: 'foo'
        }), {
          navn: 'foo'
        });
      });

      it('return string boolean as boolean', function() {
        query = qs.parse({
          foo: 'true',
          bar: 'false'
        });
        assert.deepEqual(query, {
          foo: true,
          bar: false
        });
      });

      it('returns string integer as number', function() {
        query = qs.parse({
          navn: '10'
        });
        assert.deepEqual(query, {
          navn: 10
        });
        assert.strictEqual(query.navn, 10);
      });

      it('returns string float as number', function() {
        query = qs.parse({
          navn: '10.110'
        });
        assert.deepEqual(query, {
          navn: 10.110
        });
        assert.strictEqual(query.navn, 10.110);
      });

      it('returns exists for empty query', function() {
        assert.deepEqual(qs.parse({
          navn: ''
        }), {
          navn: {
            $exists: true
          }
        });
      });
    });

    describe('! operator', function() {
      it('returns unequal query', function() {
        assert.deepEqual(qs.parse({
          navn: '!foo'
        }), {
          navn: {
            $ne: 'foo'
          }
        });
      });

      it('return string boolean as boolean', function() {
        query = qs.parse({
          foo: '!true',
          bar: '!false'
        });
        assert.deepEqual(query, {
          foo: {$ne: true},
          bar: {$ne: false}
        });
      });

      it('returns string integer as number', function() {
        query = qs.parse({
          navn: '!10'
        });
        assert.deepEqual(query, {
          navn: {
            $ne: 10
          }
        });
        assert.strictEqual(query.navn.$ne, 10);
      });

      it('returns string float as number', function() {
        query = qs.parse({
          navn: '!10.110'
        });
        assert.deepEqual(query, {
          navn: {
            $ne: 10.110
          }
        });
        assert.strictEqual(query.navn.$ne, 10.110);
      });

      it('returns not exists for empty query', function() {
        assert.deepEqual(qs.parse({
          navn: '!'
        }), {
          navn: {
            $exists: false
          }
        });
      });
    });

    describe('> operator', function() {
      it('returns greater than query', function() {
        query = qs.parse({
          navn: '>10.110'
        });
        assert.deepEqual(query, {
          navn: {
            $gt: 10.110
          }
        });
        return assert.strictEqual(query.navn.$gt, 10.110);
      });
    });

    describe('>= operator', function() {
      it('returns greater than or equal to query', function() {
        query = qs.parse({
          navn: '>=10.110'
        });
        assert.deepEqual(query, {
          navn: {
            $gte: 10.110
          }
        });
        return assert.strictEqual(query.navn.$gte, 10.110);
      });
    });

    describe('< operator', function() {
      it('returns less than query', function() {
        query = qs.parse({
          navn: '<10.110'
        });
        assert.deepEqual(query, {
          navn: {
            $lt: 10.110
          }
        });
        assert.strictEqual(query.navn.$lt, 10.110);
      });
    });

    describe('<= operator', function() {
      it('returns less than query or equal to', function() {
        query = qs.parse({
          navn: '<=10.110'
        });
        assert.deepEqual(query, {
          navn: {
            $lte: 10.110
          }
        });
        assert.strictEqual(query.navn.$lte, 10.110);
      });
    });

    describe('multiple <, <=, >, >= operators', function() {
      it('returns multiple comparison operators for same field', function() {
        query = qs.parse({
          count: ['>0.123', '>=1.234', '<2.345', '<=3.456']
        });
        assert.deepEqual(query, {
          count: {
            $gt: 0.123,
            $gte: 1.234,
            $lt: 2.345,
            $lte: 3.456
          }
        });
      });
    });

    describe('^ operator', function() {
      it('returns starts with query', function() {
        assert.deepEqual(qs.parse({
          navn: '^foo'
        }), {
          navn: {
            $regex: '^foo',
            $options: 'i'
          }
        });
      });
    });

    describe('$ operator', function() {
      it('returns ends with query', function() {
        assert.deepEqual(qs.parse({
          navn: '$foo'
        }), {
          navn: {
            $regex: 'foo$',
            $options: 'i'
          }
        });
      });
    });

    describe('~ operator', function() {
      it('returns contains query', function() {
        assert.deepEqual(qs.parse({
          navn: '~foo'
        }), {
          navn: {
            $regex: 'foo',
            $options: 'i'
          }
        });
      });
    });

    describe('$in / $nin operator', function() {
      it('returns in array query', function() {
        var string = 'foo[]=10&foo[]=10.011&foo[]=bar&foo[]=true';
        var params = require('querystring').parse(string);

        assert.deepEqual(qs.parse(params), {
          foo: {
            $in: [10, 10.011, 'bar', true]
          }
        });
      });

      it('returns in array query with "qs" parser (GH-06)', function() {
        var string = 'foo[]=10&foo[]=10.011&foo[]=bar&foo[]=true';
        var params = require('qs').parse(string);

        assert.deepEqual(qs.parse(params), {
          foo: {
            $in: [10, 10.011, 'bar', true]
          }
        });
      });

      it('returns in array with any not in array query', function() {
        var string = 'foo[]=10&foo[]=!10.011&foo[]=!bar&foo[]=baz';
        var params = require('querystring').parse(string);

        assert.deepEqual(qs.parse(params), {
          foo: {
            $in: [10, 'baz'],
            $nin: [10.011, 'bar']
          }
        });
      });

      it('returns not in array query', function() {
        var string = 'foo[]=!10&foo[]=!10.011&foo[]=!bar&foo[]=!false';
        var params = require('querystring').parse(string);

        assert.deepEqual(qs.parse(params), {
          foo: {
            $nin: [10, 10.011, 'bar', false]
          }
        });
      });

      it('returns not in array query with "gs" parser (GH-06)', function() {
        var string = 'foo[]=!10&foo[]=!10.011&foo[]=!bar&foo[]=!false';
        var params = require('qs').parse(string);

        assert.deepEqual(qs.parse(params), {
          foo: {
            $nin: [10, 10.011, 'bar', false]
          }
        });
      });


      it('returns not in array with any in array query', function() {
        var string = 'foo[]=!10&foo[]=10.011&foo[]=bar&foo[]=!baz';
        var params = require('querystring').parse(string);

        assert.deepEqual(qs.parse(params), {
          foo: {
            $nin: [10, 'baz'],
            $in: [10.011, 'bar']
          }
        });
      });
    });

    it('returns multiple querys', function() {
      var string = [
        'foo=',
        'bar=!',
        'baz=!foo',
        'bix=bez',
        '%foo=bar',
        'bix.bax=that',
        'foo-bar=bar-foo'
      ].join('&&');
      var params = require('querystring').parse(string);

      assert.deepEqual(qs.parse(params), {
        foo: { $exists: true },
        bar: { $exists: false },
        baz: { $ne: 'foo' },
        bix: 'bez',
        'bix.bax': 'that',
        'foo-bar': 'bar-foo'
      });
    });
  });

  describe('aliasing', function() {
    it('returns query for aliased key', function() {
      qs = new MongoQS({
        alias: {
          foo: 'bar'
        }
      });

      assert.deepEqual(qs.parse({
        foo: 'bix'
      }), {
        bar: 'bix'
      });
    });

    it('returns multiple queries for aliased keys', function() {
      qs = new MongoQS({
        alias: {
          foo: 'bar',
          baz: 'bax'
        }
      });

      assert.deepEqual(qs.parse({
        foo: 'bix',
        baz: 'box'
      }), {
        bar: 'bix',
        bax: 'box'
      });
    });
  });

  describe('blacklisting', function() {
    it('does not return query for blacklisted key', function() {
      qs = new MongoQS({
        blacklist: {
          foo: true
        }
      });

      assert.deepEqual(qs.parse({
        foo: 'bar',
        bar: 'foo'
      }), {
        bar: 'foo'
      });
    });

    it('does not return multiple query for blacklisted keys', function() {
      qs = new MongoQS({
        blacklist: {
          foo: true,
          bar: true
        }
      });

      assert.deepEqual(qs.parse({
        foo: 'bar',
        bar: 'foo',
        baz: 'bax'
      }), {
        baz: 'bax'
      });
    });
  });

  describe('whitelisting', function() {
    it('returns query only for whitelisted key', function() {
      qs = new MongoQS({
        whitelist: {
          foo: true
        }
      });

      assert.deepEqual(qs.parse({
        foo: 'bar',
        bar: 'foo',
        baz: 'bax'
      }), {
        foo: 'bar'
      });
    });

    it('returns multiple queries for whitelisted keys', function() {
      qs = new MongoQS({
        whitelist: {
          foo: true,
          bar: true
        }
      });

      assert.deepEqual(qs.parse({
        foo: 'bar',
        bar: 'foo',
        baz: 'bax'
      }), {
        foo: 'bar',
        bar: 'foo'
      });
    });
  });

  describe('custom', function() {
    it('returns custom bbox query', function() {
      qs = new MongoQS({
        custom: {
          bbox: 'geojson'
        }
      });

      assert.deepEqual(qs.parse({
        bbox: '0,1,2,3'
      }), {
        geojson: {
          $geoWithin: {
            $geometry: {
              type: 'Polygon',
              coordinates: [[[0, 1], [2, 1], [2, 3], [0, 3], [0, 1]]]
            }
          }
        }
      });
    });

    it('returns custom near query', function() {
      qs = new MongoQS({
        custom: {
          near: 'geojson'
        }
      });

      assert.deepEqual(qs.parse({
        near: '0,1'
      }), {
        geojson: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [0, 1]
            }
          }
        }
      });
    });

    it('returns custom after query', function() {
      qs = new MongoQS({
        custom: {
          after: 'endret'
        }
      });
      assert.deepEqual(qs.parse({
        after: '2014-01-01'
      }), {
        endret: {
          $gte: '2014-01-01T00:00:00.000Z'
        }
      });
    });
  });
});
