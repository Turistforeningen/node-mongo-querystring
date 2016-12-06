/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */

'use strict';

const assert = require('assert');
const request = require('supertest');

const data = require('./data');
const app = request(require('./app'));
const db = require('./db');

describe('Example App', () => {
  before((done) => {
    if (db.db) { return done(); }
    return db.once('ready', done);
  });

  before((done) => {
    db.db.dropDatabase(done);
  });

  before((done) => {
    db.db.collection('places').createIndex({ geojson: '2dsphere' }, done);
  });

  before((done) => {
    db.db.collection('places').insertMany(data, done);
  });

  const url = '/api/places';

  it('returns all them places', (done) => {
    app.get(url)
      .expect(200)
      .expect((res) => {
        assert.equal(res.body.length, 3);
      })
      .end(done);
  });

  it('returns places matching name', (done) => {
    app.get(`${url}?name=Vatnane`)
      .expect(200)
      .expect((res) => {
        assert.equal(res.body.length, 1);
        assert.equal(res.body[0].name, 'Vatnane');
      })
      .end(done);
  });

  it('returns places near point', (done) => {
    app.get(`${url}?near=6.13037,61.00607`)
      .expect(200)
      .expect((res) => {
        assert.equal(res.body.length, 3);
        assert.equal(res.body[0].name, 'Solrenningen');
        assert.equal(res.body[1].name, 'Åsedalen');
        assert.equal(res.body[2].name, 'Norddalshytten');
      })
      .end(done);
  });

  it('returns places near point with max distance', (done) => {
    app.get(`${url}?near=6.13037,61.00607,7000`)
      .expect(200)
      .expect((res) => {
        assert.equal(res.body.length, 2);
        assert.equal(res.body[0].name, 'Solrenningen');
        assert.equal(res.body[1].name, 'Åsedalen');
      })
      .end(done);
  });

  it('returns places near point with max and min distance', (done) => {
    app.get(`${url}?near=6.13037,61.00607,7000,1000`)
      .expect(200)
      .expect((res) => {
        assert.equal(res.body.length, 1);
        assert.equal(res.body[0].name, 'Åsedalen');
      })
      .end(done);
  });

  it('returns places inside bbox', (done) => {
    const bbox = [
      '5.5419158935546875',
      '60.92859723298985',
      '6.0363006591796875',
      '61.018719220334525',
    ].join(',');

    app.get(`${url}?bbox=${bbox}`)
      .expect(200)
      .expect((res) => {
        assert.equal(res.body.length, 2);
        assert.equal(res.body[0].name, 'Norddalshytten');
        assert.equal(res.body[1].name, 'Vardadalsbu');
      })
      .end(done);
  });

  it('returns places with any of the following tags', (done) => {
    app.get(`${url}?tags[]=Båt&tags[]=Stekeovn`)
      .expect(200)
      .expect((res) => {
        assert.equal(res.body.length, 3);
        assert.equal(res.body[0].name, 'Solrenningen');
        assert.equal(res.body[1].name, 'Åsedalen');
        assert.equal(res.body[2].name, 'Selhamar');
      })
      .end(done);
  });

  it('returns places with visits less than 40', (done) => {
    app.get(`${url}?visits=<40`)
      .expect(200)
      .expect((res) => {
        assert.equal(res.body.length, 0);
      })
      .end(done);
  });

  it('returns places with visits less than or equal to 40', (done) => {
    app.get(`${url}?visits=<=40`)
      .expect(200)
      .expect((res) => {
        assert.equal(res.body.length, 1);
        assert.equal(res.body[0].name, 'Solrenningen');
      })
      .end(done);
  });

  it('returns places with visits greater than 10,000', (done) => {
    app.get(`${url}?visits=>10000`)
      .expect(200)
      .expect((res) => {
        assert.equal(res.body.length, 1);
        assert.equal(res.body[0].name, 'Vardadalsbu');
      })
      .end(done);
  });

  it('returns places with visits > or equal to 10,000', (done) => {
    app.get(`${url}?visits=>=10000`)
      .expect(200)
      .expect((res) => {
        assert.equal(res.body.length, 2);
        assert.equal(res.body[0].name, 'Åsedalen');
        assert.equal(res.body[1].name, 'Vardadalsbu');
      })
      .end(done);
  });

  it('returns places with visits > 40 and < 10,000', (done) => {
    app.get(`${url}?visits=>40&visits=<10000`)
      .expect(200)
      .expect((res) => {
        assert.equal(res.body.length, 3);
        assert.equal(res.body[0].name, 'Norddalshytten');
        assert.equal(res.body[1].name, 'Vatnane');
        assert.equal(res.body[2].name, 'Selhamar');
      })
      .end(done);
  });
});
