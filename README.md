# MongoDB QueryString Parser

[![Build status](https://app.wercker.com/status/b33b844c0ab10d56c318e116e587e2fa/s "wercker status")](https://app.wercker.com/project/bykey/b33b844c0ab10d56c318e116e587e2fa)
[![Codacy grade](https://img.shields.io/codacy/grade/782d0dc482ea4033892f99f968090b35.svg "Codacy grade")](https://www.codacy.com/app/DNT/node-mongo-querystring)
[![Codacy coverage](https://img.shields.io/codacy/coverage/782d0dc482ea4033892f99f968090b35.svg "Codacy coverage")](https://www.codacy.com/app/DNT/node-mongo-querystring)
[![NPM downloads](https://img.shields.io/npm/dm/mongo-querystring.svg "NPM downloads")](https://www.npmjs.com/package/mongo-querystring)
[![NPM version](https://img.shields.io/npm/v/mongo-querystring.svg "NPM version")](https://www.npmjs.com/package/mongo-querystring)
[![Node version](https://img.shields.io/node/v/mongo-querystring.svg "Node version")](https://www.npmjs.com/package/mongo-querystring)
[![Dependency status](https://img.shields.io/david/Turistforeningen/node-mongo-querystring.svg "Dependency status")](https://david-dm.org/Turistforeningen/node-mongo-querystring)

Accept MongoDB query parameters through URI queries safe and easy. This is
useful when building an API and accepting various user specificed queries.

## Features

* Aliased query parameters
* Blacklisted query parameters
* Whitelisted query parameters
* Basic operators
  * `$eq`
  * `$gt`
  * `$gte`
  * `$lt`
  * `$lte`
  * `$ne`
  * `$in`
  * `$nin`
  * `$exists`
  * `$regex`
* Parse string integers and floats to numbers
* Parse string boolean to ture/false booleans

| operation | query string  | query object |
|-----------|---------------|--------------|
| equal     | `?foo=bar`    | `{ foo: "bar" }` |
| unequal   | `?foo=!bar`   | `{ foo: { $ne: "bar" }}` |
| exists    | `?foo=`       | `{ foo: { $exists: true }}` |
| not exists | `?foo=!`     | `{ foo: { $exists: false }}` |
| greater than | `?foo=>10` | `{ foo: { $gt: 10 }}` |
| less than | `?foo=<10`    | `{ foo: { $lt: 10 }}` |
| greater than or equal to | `?foo=>=10` | `{ foo: { $gte: 10 }}` |
| less than or equal to | `?foo=<=10`    | `{ foo: { $lte: 10 }}` |
| starts with | `?foo=^bar` | `{ foo: { $regex: "^bar", $options: "i" }}` |
| ends with | `?foo=$bar`   | `{ foo: { $regex: "bar$", $options: "i" }}` |
| contains  | `?foo=~bar`   | `{ foo: { $regex: "bar", $options: "i" }}` |
| in array  | `?foo[]=bar&foo[]=baz` | `{ foo: { $in: ['bar', 'baz'] }}` |
| not in array | `?foo[]=!bar&foo[]=!baz` | `{ foo: { $nin: ['bar', 'baz'] }}` |

* Geospatial operators
  * `$geoWithin` (polygon)
  * `$near` (point)

| operation | query string  | query object |
|-----------|---------------|--------------|
| bbox | `?bbox=0,1,2,3` | `{ geojson: { $geoWithin: { $geometry: { … } } } }` |
| near | `?near=0,1` | `{ geojson: { $near: { $geometry: { … } } } }` |
| near (max distance) | `?near=0,1,2` | `{ geojson: { $near: { …, $maxDistance: 2 } } }` |
| near (max & min distance) | `?near=0,1,2,3` | `{ geojson: { $near: { …, $minDistance: 3 } } }` |

* Custom query functions
  * `after` (date)
  * `before` (date)
  * `between` (date|date)

| operation | query string  | query object |
|-----------|---------------|--------------|
| after | `?after=2014-01-01` | `{ endret: { $gte: "2014-01-01T00:00:00.000Z" } }` |
| after | `?after=1388534400` | `{ endret: { $gte: "2014-01-01T00:00:00.000Z" } }` |
| before | `?before=2014-01-01` | `{ endret: { $lt: "2014-01-01T00:00:00.000Z" } }` |
| before | `?before=1388534400` | `{ endret: { $lt: "2014-01-01T00:00:00.000Z" } }` |
| between | `?between=2014-01-01|2015-01-01` | `{ endret: { $gte: "2014-01-01T00:00:00.000Z", $lt: "2015-01-01T00:00:00.000Z" } }` |
| between | `?between=1388534400|1420088400` | `{ endret: { $gte: "2014-01-01T00:00:00.000Z", $lt: "2015-01-01T00:00:00.000Z" } }` |

## Install

```
npm install mongo-querystring --save
```

## API

```javascript
var MongoQS = require('mongo-querystring');
```

### new MongoQS(`object` options)

* `Array` ops - list of supported operators (default: `['!', '^', '$', '~', '>', '<', '$in']`)
* `object` alias - query param aliases (default: `{}`)
* `object` blacklist - blacklisted query params (default: `{}`)
* `object` whitelist - whitelisted query params (default: `{}`)
* `object` custom - custom query params (default: `{}`)
* `object` string - string parsing
  * `boolean` toBoolean - parse `"true"`, `"false"` string to booleans (default: `true`)
  * `boolean` toNumber - parse string integer and float values to numbers (default: `true`)
* `regexp` keyRegex - allowed key names (default: `/^[a-zæøå0-9-_.]+$/i`)
* `regexp` arrRegex - allowed array key names (default: `/^[a-zæøå0-9-_.]+(\[\])?$/i`)

#### Bult in custom queries

* `bbox` - bounding box geostatial query
* `near` - proximity geostatial query
* `after` - modified since query

```javascript
var qs = new MongoQS({
  custom: {
    bbox: 'geojson',        // your geometry field
    near: 'geojson',        // your geometry field
    after: 'updated_on'     // your last modified field
  }
});
```

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

### Collaborators

Individuals making significant and valuable contributions are made Collaborators
and given commit-access to the project. These individuals are identified by the
existing Collaborators and their addition as Collaborators is discussed as a
pull request to this project's README.md.

Note: If you make a significant contribution and are not considered for
commit-access log an issue or contact one of the Collaborators directly.

* Andy Klimczak - @andyklimczak
* Hans Kristian Flaatten - @Starefossen
* Edward Knowles - @eknowles

## [MIT Licensed](https://raw.githubusercontent.com/Turistforeningen/node-mongo-querystring/master/LICENSE)
