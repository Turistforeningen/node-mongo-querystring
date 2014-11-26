MongoDB QueryString [![Build Status](https://drone.io/github.com/Turistforeningen/node-mongo-querystring/status.png)](https://drone.io/github.com/Turistforeningen/node-mongo-querystring/latest)
=====================

[![NPM](https://nodei.co/npm/mongo-querystring.png?downloads=true)](https://www.npmjs.org/package/mongo-querystring)

Accept MongoDB query parameters through URI queries safe and easy. This is
useful when building an API and accepting various user specificed queries.

## Features

* Aliased query parameters
* Blacklisted query parameters
* Basic operators
  * `$ne`
  * `$gt`
  * `$lt`
  * `$regex`
  * `$exists`
* Geospatial operators
  * `$geoWithin`
  * `$near`
* Custom query functions

## Install

```
npm install mongo-querystring --save
```

## API

```javascript
var MongoQS = require('mongo-querystring');
```

### new MongoQS(`object` options)

* `Array` ops - list of supported operators
* `object` alias - query param aliases
* `object` blacklist - blacklisted query params
* `object` custom - custom query params

#### Bult in custom queries

* `bbox` - bounding box query
* `near` - proximity query
* `after` - modified since query

#### Define custom queries

Custom queries are on the folling form; you define the URL query parameter name
that your users will be using and a function which takes the result query object
and the value for query parameter.

```javascript
var qs = new MongoQS({
  custom: {
    urlQueryParamName: function(query, input) {
      // do some processing of input value
      // add your queries to the query object
      query['someField'] = input;
      query['someOtherFiled'] = 'some value';
    }
  }
});
```

### qs.parse(`object` params)

Params is an object with URI query params and their values. Ex. `req.params`
if you are working with ExpressJS.

```javascript
var query = qs.parse(req.params);

mongo.collection('mycol').find(query, field).toArray(function(err, documents) {
  // matching documents
});
```

