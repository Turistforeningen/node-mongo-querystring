/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */

'use strict';

const EventEmitter = require('events').EventEmitter;
const MongoClient = require('mongodb').MongoClient;
const inherits = require('util').inherits;

function Mongo(uri) {
  EventEmitter.call(this);

  this.db = null;

  MongoClient.connect(uri, (err, db) => {
    if (err) { throw err; }

    this.db = db;
    this.emit('ready');
  });

  return this;
}

inherits(Mongo, EventEmitter);

module.exports = new Mongo('mongodb://mongo:27017/test');
