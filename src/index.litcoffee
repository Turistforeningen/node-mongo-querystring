    module.exports = MongoQS = (opts) ->
      @ops = opts?.ops or ['!', '^', '$', '~', '>', '<']
      @alias = opts?.alias or {}
      @ignore = opts?.ignore or {}
      @custom = opts?.custom or {}

      for param, field of @custom
        switch param
          when 'bbox' then @custom.bbox = @customBBOX field
          when 'near' then @custom.near = @customNear field
          when 'after' then @custom.after = @customAfter field

      return @

    MongoQS.prototype.customBBOX = (field) ->
      (res, bbox) ->
        bbox = bbox.split ','

        if bbox.length is 4
          val = parseFloat(val) for val in bbox

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

    MongoQS.prototype.customNear = (field) ->
      (query, input) ->
        input = input.split ','

        if input.length is 2
          val = parseFloat(val) for val in input

          query[field] = $near: $geometry:
            type: 'Point'
            coordinates: input

        return

    MongoQS.prototype.customAfter = (field) ->
      (query, input) ->

        if not isNaN input
          input = input + '000' if (input + '').length is 10
          input = parseInt input

        input = new Date input

        if input.toString() isnt 'Invalid Date'
          query[field] = $gte: input.toISOString()


    MongoQS.prototype.parse = (query) ->
      res = {}

      for key, val of query
        continue if @ignore[key]
        continue if typeof val isnt 'string'
        continue if not /^[a-zæøå0-9-_.]+$/i.test key

        key = @alias[key] if @alias[key]

If the value is empty we treat the query parameter as an
[$exists](http://docs.mongodb.org/manual/reference/operator/query/exists/)
operator.

        if not val
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

