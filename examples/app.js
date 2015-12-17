'use strict';

var express = require('express');
var app = module.exports = express();

var MongoQS = require('../index');

// Create a new Mongo QueryString parser
var qs = new MongoQS({
  custom: {
    bbox: 'geojson',
    near: 'geojson'
  }
});

app.get('/api/places', function(req, res) {
  res.set('Content-Type', 'application/json');

  // Parse the request query parameters
  var query = qs.parse(req.query);
  var collection = require('./db').db.collection('places');
  var cursor = collection.find(query).limit(3);

  cursor.stream().pipe(require('JSONStream').stringify()).pipe(res);
});

if (!module.parent) {
  require('./db').once('ready', function() {
    app.listen(3000);
    console.log('Express started on port 3000');
  });
}
