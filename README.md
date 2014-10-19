MongoDB QueryString [![Build Status](https://drone.io/github.com/Turistforeningen/node-mongo-querystring/status.png)](https://drone.io/github.com/Turistforeningen/node-mongo-querystring/latest)
=====================

[![NPM](https://nodei.co/npm/mongo-querystring.png?downloads=true)](https://www.npmjs.org/package/mongo-querystring)

Accept MongoDB query parameters through URI queries safe and easy. This is
useful when building an API and accepting various user specificed queries.

## Features

* Basic operators
  * `$ne`
  * `$gt`
  * `$lt`
  * `$regex`
  * `$exists`
* Geospatial operators
  * `$geoWithin`
  * `$near`
* Custom queries

## Install

```
npm install mongo-querystring --save
```

## API

```javascript
var MongoQS = require('mongo-querystring');
```

### new MongoQS(`options`)

* `Array` ops - list of supported operators
* `object` alias - query param aliases
* `object` ignore - ignored query params
* `object` custom - custom query params

#### Custom query params

`TODO`

### qs.parse(`params`)

Params is an object with URI query params and their values. Ex. `req.params`
if you are working with ExpressJS.

```javascript
collection.find(qs.parse(params), field).toArray(function(err, documents) {
  // matching documents
});
```

