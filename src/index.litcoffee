    module.exports = MongoQS = (opts) ->
      if opts?.ignore
        deprecate.property opts, 'ignore'
        opts.blacklist = opts.ignore

      @ops = opts?.ops or ['!', '^', '$', '~', '>', '<']
      @alias = opts?.alias or {}
      @blacklist = opts?.blacklist or {}
      @whitelist = opts?.whitelist or {}
      @custom = opts?.custom or {}

      for param, field of @custom
        switch param
          when 'bbox' then @custom.bbox = @customBBOX field
          when 'near' then @custom.near = @customNear field
          when 'after' then @custom.after = @customAfter field

      return @

## #customBBOX(`string` field)

    MongoQS.prototype.customBBOX = (field) ->
      (res, bbox) ->
        bbox = bbox.split ','

        if bbox.length is 4
          bbox[key] = parseFloat(val) for val, key in bbox

          res[field] = $geoWithin: $geometry:
            type: 'Polygon'
            coordinates: [[
              [bbox[0], bbox[1]]
              [bbox[2], bbox[1]]
              [bbox[2], bbox[3]]
              [bbox[0], bbox[3]]
              [bbox[0], bbox[1]]
            ]]

        return

## #customNear(`string` field)

    MongoQS.prototype.customNear = (field) ->
      (query, input) ->
        input = input.split ','

        if input.length is 2
          input[key] = parseFloat(val) for val, key in input

          query[field] = $near: $geometry:
            type: 'Point'
            coordinates: input

        return

## #customAfter(`string` field)

    MongoQS.prototype.customAfter = (field) ->
      (query, input) ->

        if not isNaN input
          input = input + '000' if (input + '').length is 10
          input = parseInt input

        input = new Date input

        if input.toString() isnt 'Invalid Date'
          query[field] = $gte: input.toISOString()

        return

## #parse(`object` query)

Main query param parser method which follows the following order of operations.

1. Ignored query param name checking
2. Invalid query param type checking
3. Invalid query param name checking
4. Aliased query param conversion
5. Custom query param parsing
6. Allowed query param ops parsing

    MongoQS.prototype.parse = (query) ->
      res = {}

      for key, val of query
        continue if Object.keys(@whitelist).length and not @whitelist[key]
        continue if @blacklist[key]
        continue if typeof val isnt 'string'
        continue if not /^[a-zæøå0-9-_.]+$/i.test key

        key = @alias[key] if @alias[key]

        if @custom[key]
          @custom[key] res, val

If the value is empty we treat the query parameter as an
[$exists](http://docs.mongodb.org/manual/reference/operator/query/exists/)
operator.

        else if not val
          res[key] = $exists: true

Check for supported operators in `@ops`. This is configured when
instanciating `MongoQS` and the defaults are `!`, `^`, `$`, `~`, `>`, and `<`.

        else if val.charAt(0) in @ops
          op = val.charAt(0)
          val = val.substr(1)

          res[key] = switch op
            when '!'
              if val
                $ne: if isNaN(val) then val else parseFloat(val, 10)
              else
                $exists: false
            when '>' then $gt: parseFloat(val, 10)
            when '<' then $lt: parseFloat(val, 10)
            else
              val = val.replace /[^a-zæøå0-9-_.* ]/i, ''
              switch op
                when '^' then $regex: '^' + val, $options: 'i'
                when '$' then $regex: val + '$', $options: 'i'
                else $regex: val, $options: 'i'

        else
          res[key] = if isNaN(val) then val else parseFloat(val, 10)

      res

    deprecate = require('depd')('mongo-querystring')

