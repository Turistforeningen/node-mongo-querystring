assert = require 'assert'
MongoQS = require '../src/'

qs = query = null

beforeEach ->
  qs = new MongoQS()
  query = {}

describe 'customBBOX()', ->
  it 'should not genearate $geoWithin query for invalid bbox', ->
    for input in ['0123', '0,1,2']
      qs.customBBOX('geojson') query, input
      assert.deepEqual query, {}, "#{input} should not be valid BBOX input"

  it 'should generate $geoWithin query for valid bbox', ->
    qs.customBBOX('geojson') query, '0,1,2,3'
    assert.deepEqual query, geojson: $geoWithin: $geometry:
      type: 'Polygon'
      coordinates: [[
        [0, 1]
        [2, 1]
        [2, 3]
        [0, 3]
        [0, 1]
      ]]

describe 'customNear()', ->
  it 'should not genearate $near query for invalid point', ->
    for input in ['0123']
      qs.customNear('geojson') query, input
      assert.deepEqual query, {}, "#{input} should not be valid BBOX input"

  it 'should generate $near query for valid point', ->
    qs.customNear('geojson') query, '0,1'
    assert.deepEqual query, geojson: $near: $geometry:
      type: 'Point'
      coordinates: [0, 1]

describe 'customAfter()', ->
  it 'should not generate after query for invalid date', ->
    for input in ['foo']
      qs.customAfter('endret') query, input
      assert.deepEqual query, {}, "#{input} should not be valid after date"

  it 'should generate after query for ISO date', ->
    qs.customAfter('endret') query, '2014-09-22T11:50:37.843Z'
    assert.deepEqual query, endret: $gte: '2014-09-22T11:50:37.843Z'

  it 'should generate after query for milliseconds timestamp', ->
    qs.customAfter('endret') query, '1411386637843'
    assert.deepEqual query, endret: $gte: '2014-09-22T11:50:37.843Z'

  it 'should generate after query for unix timestamp', ->
    qs.customAfter('endret') query, '1411386637'
    assert.deepEqual query, endret: $gte: '2014-09-22T11:50:37.000Z'

describe 'parse()', ->
  describe 'parsing', ->
    describe 'key value validation', ->
      it 'should allow basic alpha num key names', ->
        assert.deepEqual qs.parse({'Abc.Æøå_123-456': 'bix'}), 'Abc.Æøå_123-456': "bix"

      it 'should discard keys with special chars', ->
        assert.deepEqual qs.parse({'h4xor$': 'bix'}), {}

      it 'should discard non-string values', ->
        assert.deepEqual qs.parse({'foo': []}), {}
        assert.deepEqual qs.parse({'foo': {}}), {}
        assert.deepEqual qs.parse({'foo': false}), {}

    describe 'no operator', ->
      it 'should return empty query set', ->
        assert.deepEqual qs.parse({}), {}

      it 'should return equal query', ->
        assert.deepEqual qs.parse({navn: 'foo'}), navn: 'foo'

      it 'should parse float if applicable', ->
        query = qs.parse navn: '10'
        assert.deepEqual query, navn: 10
        assert.strictEqual query.navn, 10

      it 'should return empty equal query', ->
        assert.deepEqual qs.parse({navn: ''}), navn: $exists: true

    describe '! operator', ->
      it 'should return not equal query', ->
        assert.deepEqual qs.parse({navn: '!foo'}), navn: $ne: 'foo'

      it 'should parse float if applicable', ->
        query = qs.parse navn: '!10'
        assert.deepEqual query, navn: $ne: 10
        assert.strictEqual query.navn.$ne, 10

      it 'should return empty not equal query', ->
        assert.deepEqual qs.parse({navn: '!'}), navn: $exists: false

    describe '> operator', ->
      it 'should return greater than query', ->
        query = qs.parse navn: '>10'
        assert.deepEqual query, navn: $gt: 10
        assert.strictEqual query.navn.$gt, 10

    describe '< operator', ->
      it 'should return less than query', ->
        query = qs.parse navn: '<10'
        assert.deepEqual query, navn: $lt: 10
        assert.strictEqual query.navn.$lt, 10

    describe '^ operator', ->
      it 'should return starts with query', ->
        assert.deepEqual qs.parse({navn: '^foo'}), navn: $regex: '^foo', $options: 'i'

    describe '$ operator', ->
      it 'should return ends with query', ->
        assert.deepEqual qs.parse({navn: '$foo'}), navn: $regex: 'foo$', $options: 'i'

    describe '~ operator', ->
      it 'should return contains query', ->
        assert.deepEqual qs.parse({navn: '~foo'}), navn: $regex: 'foo', $options: 'i'

    it 'should parse multiple keys', ->
      query = qs.parse
        foo: ''
        bar: '!foo'
        '%foo': 'bar'
        'bix.bax': 'that'
        'foo-bar': 'bar-foo'

      assert.deepEqual query,
        foo: $exists: true
        bar: $ne: 'foo'
        'bix.bax': 'that'
        'foo-bar': 'bar-foo'

  describe 'aliasing', ->
    it 'should alias key', ->
      qs = new MongoQS alias: foo: 'bar'
      assert.deepEqual qs.parse({foo: 'bix'}), bar: 'bix'

    it 'should alias multiple keys'

  describe 'ignoring', ->
    it 'should ignore key', ->
      qs = new MongoQS ignore: foo: true
      assert.deepEqual qs.parse({foo: 'bar', bar: 'foo'}), bar: 'foo'

    it 'should ingore multiple keys'

  describe 'custom', ->
    it 'should enable built in bbox handler', ->
      qs = new MongoQS custom: bbox: 'geojson'
      assert.deepEqual qs.parse({bbox: '0,1,2,3'}), geojson:
        $geoWithin:
          $geometry:
            type: 'Polygon'
            coordinates: [[[0,1],[2,1],[2,3],[0,3],[0,1]]]

    it 'should enable built in near handler', ->
      qs = new MongoQS custom: near: 'geojson'
      assert.deepEqual qs.parse({near: '0,1'}), geojson:
        $near:
          $geometry:
            type: 'Point'
            coordinates: [0,1]

    it 'should enable build in after handler', ->
      qs = new MongoQS custom: after: 'endret'
      assert.deepEqual qs.parse({after: '2014-01-01'}), endret: $gte: '2014-01-01T00:00:00.000Z'

