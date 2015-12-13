# MongoDB QueryString

[![Build status](https://img.shields.io/wercker/ci/566dca6762f42c407207777a.svg "Build status")](https://app.wercker.com/project/bykey/a31eed21b34f26d9b7af766b4614c260)
[![NPM downloads](https://img.shields.io/npm/dm/mongo-querystring.svg "NPM downloads")](https://www.npmjs.com/package/mongo-querystring)
[![NPM version](https://img.shields.io/npm/v/mongo-querystring.svg "NPM version")](https://www.npmjs.com/package/mongo-querystring)
[![Node version](https://img.shields.io/node/v/mongo-querystring.svg "Node version")](https://www.npmjs.com/package/mongo-querystring)
[![Dependency status](https://img.shields.io/david/turistforeningen/node-mongo-querystring.svg "Dependency status")](https://david-dm.org/turistforeningen/node-mongo-querystring)

Accept MongoDB query parameters through URI queries safe and easy. This is
useful when building an API and accepting various user specificed queries.

## Features

* Aliased query parameters
* Blacklisted query parameters
* Whitelisted query parameters
* Basic operators
  * `$ne`
  * `$gt`
  * `$lt`
  * `$regex`
  * `$exists`

| operation | query string  | query object |
|-----------|---------------|--------------|
| equal     | `?foo=bar`    | `{ foo: "bar" }` |
| unequal   | `?foo=!bar`   | `{ foo: { $ne: "bar" }}` |
| exists    | `?foo=`       | `{ foo: { $exists: true }}` |
| not exists | `?foo=!`     | `{ foo: { $exists: false }}` |
| greater than | `?foo=>10` | `{ foo: { $gt: 10 }}` |
| less than | `?foo=<10`    | `{ foo: { $lt: 10 }}` |
| starts with | `?foo=^bar` | `{ foo: { $regex: "^foo", $options: "i" }}` |
| ends with | `?foo=$bar`   | `{ foo: { $regex: "foo$", $options: "i" }}` |
| contains  | `?foo=~bar`   | `{ foo: { $regex: "foo", $options: "i" }}` |

* Geospatial operators
  * `$geoWithin` (polygon)
  * `$near` (point)

| operation | query string  | query object |
|-----------|---------------|--------------|
| bbox | `?bbox=~0,1,2,3` | `{ geojson: { $geoWithin: { $geometry: { … } } } }` |
| near | `?near=~0,1` | `{ geojson: { $near: { $geometry: { … } } } }` |

* Custom query functions
  * `after` (date)

| operation | query string  | query object |
|-----------|---------------|--------------|
| after | `?after=2014-01-01` | `{ endret: { $gte: "2014-01-01T00:00:00.000Z" } }` |
| after | `?after=1388534400` | `{ endret: { $gte: "2014-01-01T00:00:00.000Z" } }` |

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
* `object` whitelist - whitelisted query params
* `object` custom - custom query params

#### Bult in custom queries

* `bbox` - bounding box geostatial query
* `near` - proximity geostatial query
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

## [MIT Licensed](https://raw.githubusercontent.com/Turistforeningen/node-mongo-querystring/master/LICENSE)
