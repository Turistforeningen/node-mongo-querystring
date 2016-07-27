/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
'use strict';

const express = require('express');

const app = module.exports = express();

const JSONStream = require('JSONStream');
const MongoQS = require('../index');
const mongo = require('./db');

// Create a new Mongo QueryString parser
const qs = new MongoQS({
  custom: {
    bbox: 'geojson',
    near: 'geojson',
  },
});

app.get('/api/places', (req, res) => {
  res.set('Content-Type', 'application/json');

  // Parse the request query parameters
  const query = qs.parse(req.query);
  const collection = mongo.db.collection('places');
  const cursor = collection.find(query).limit(3);

  cursor.stream().pipe(JSONStream.stringify()).pipe(res);
});

if (!module.parent) {
  mongo.once('ready', () => {
    app.listen(3000);
    console.log('Express started on port 3000'); // eslint-disable-line no-console
  });
}
