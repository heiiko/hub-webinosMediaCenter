_ = require('underscore')

ArrayProto = Array.prototype

slice = ArrayProto.slice
concat = ArrayProto.concat

_.mixin
  ocontains: (obj, target) ->
    if obj? then _.some(obj, _.partial(_.isEqual, target)) else false
  ouniq: (array, isSorted, iterator, context) ->
    if _.isFunction(isSorted)
      context = iterator
      iterator = isSorted
      isSorted = false
    initial = if iterator then _.map(array, iterator, context) else array
    results = []
    seen = []
    _.each(initial, (value, index) ->
      if (if isSorted then (!index || !_.isEqual(seen[seen.length - 1], value)) else !_.ocontains(seen, value))
        seen.push(value)
        results.push(array[index]))
    results
  ounion: ->
    _.ouniq(_.flatten(arguments, true))
  ointersection: (array) ->
    rest = slice.call(arguments, 1)
    _.filter(_.ouniq(array), (item) ->
      _.every(rest, (other) ->
        _.ocontains(other, item)))
  odifference: (array) ->
    rest = concat.apply(ArrayProto, slice.call(arguments, 1))
    _.filter(array, (value) ->
      !_.ocontains(rest, value))

module.exports = _
