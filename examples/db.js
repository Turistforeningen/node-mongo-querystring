'use strict';

var EventEmitter = require('events').EventEmitter;
var MongoClient = require('mongodb').MongoClient;
var inherits = require('util').inherits;

var Mongo = function(uri) {
  EventEmitter.call(this);

  this.db = null;

  var $this = this;

  new MongoClient.connect(uri, function(err, db) {
    if (err) { throw err; }

    $this.db = db;
    $this.emit('ready');
  });

  return this;
};

inherits(Mongo, EventEmitter);

module.exports = new Mongo('mongodb://mongo:27017/test');
