webinos = require('webinos')

Bacon = require('baconjs')
Promise = require('promise')
promisify = require('../util/promisify.coffee')

Service = require('./service.coffee')

class TelevisionService extends Service
  @findServices: (options, filter) ->
    super(new ServiceType("http://webinos.org/api/tv"), options, filter).map (service) ->
      new TelevisionService(service.underlying())
  constructor: (underlying) ->
    super(underlying)
    display = new Display(this)
    tuner = new Tuner(this)
    @display = -> display
    @tuner = -> tuner

class Display
  constructor: (service) ->
    @service = -> service
    @underlying = -> service.underlying()?.display
  events: (name, capture) ->
    new Bacon.EventStream (newSink) =>
      sink = (event) ->
        reply = newSink event
        unsub() if reply is Bacon.noMore or event.isEnd()
      unsubUnbind = ->
      unsub = ->
        sink = undefined
        unsubUnbind()
      unless @service().bound()
        sink? new Bacon.End()
      else
        unsubUnbind = service.filter('.isUnbind').onValue -> sink? new Bacon.End()
        @underlying().addEventListener(name, (event) -> sink? new Bacon.Next(event), capture)
      unsub
  setChannel: (channel) ->
    return Promise.reject("Service not bound") unless @service().bound()
    promisify('setChannel', @underlying())(channel)
  getEPGPIC: (channel) ->
    return Promise.reject("Service not bound") unless @service().bound()
    promisify('getEPGPIC', @underlying())(channel)

class Tuner
  constructor: (service) ->
    @service = -> service
    @underlying = -> service.underlying()?.tuner
  getTVSources: ->
    return Promise.reject("Service not bound") unless @service().bound()
    promisify('getTVSources', @underlying())()

module.exports = TelevisionService
