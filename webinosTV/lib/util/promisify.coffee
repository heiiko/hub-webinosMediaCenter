Promise = require('promise')

promisify = (fun, thisArg) ->
  (argsArray...) ->
    new Promise (resolver) ->
      argsArray.push resolver.fulfill.bind(resolver)
      argsArray.push resolver.reject.bind(resolver)
      fun.apply(thisArg, argsArray)

module.exports = promisify
