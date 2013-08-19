_ = require('underscore')

Bacon = require('baconjs')

DeviceStatusService = require('../service/devicestatus.coffee')
MediaContentService = require('../service/mediacontent.coffee')
MediaService = require('../service/media.coffee')

class DeviceManager extends Bacon.EventStream
  constructor: (interval = 60000, timeout = 60000) ->
    devices = {}
    compound = new Bacon.Bus()
    compound.onValue (event) ->
      device = event.device()
      service = event.service()
      if event.isAvailable()
        if service instanceof DeviceStatusService
          sink? new Bacon.Next(new Found(device))
        else
          sink? new Bacon.Next(new Changed(device))
      else if event.isUnavailable()
        if _.size(device.services()) == 0
          devices[device.address()].discovery.end()
          delete devices[device.address()]
        if service instanceof DeviceStatusService
          sink? new Bacon.Next(new Lost(device))
        else
          sink? new Bacon.Next(new Changed(device))
    services = Bacon.once(Date.now()).concat(Bacon.fromPoll(interval, -> Date.now())).flatMap (now) ->
      Bacon.mergeAll(
        DeviceStatusService.findServices(),
        MediaContentService.findServices(),
        MediaService.findServices())
    services
      .flatMap (service) ->
        Bacon.fromPromise(service.bindService())
      .onValue (service) ->
        discovery = devices[service.address()]?.discovery
        if not discovery?
          discovery = new Bacon.Bus()
          device = new Device(service.address(), discovery, timeout)
          devices[service.address()] = {ref: device, discovery: discovery}
          compound.plug(device)
        discovery.push(service)
    sink = undefined
    super (newSink) ->
      sink = (event) ->
        reply = newSink event
        unsub() if reply == Bacon.noMore or event.isEnd()
      unsub = ->
        sink = undefined
    @devices = ->
      refs = {}
      _.each(devices, ({ref}) -> refs[ref.id()] = ref if device.devicestatus()?)
      refs
    @toProperty = =>
      @scan @devices(), (devices, event) ->
        device = event.device()
        if event.isFound()
          devices[device.address()] = device
        else if event.isLost()
          delete devices[device.address()]
        devices

class Device extends Bacon.EventStream
  constructor: (address, discovery, timeout) ->
    services = {}
    compound = new Bacon.Bus()
    compound.filter('.isUnbind').map('.service').onValue (service) =>
      delete services[service.id()]
      sink? new Bacon.Next(new Unavailable(this, service))
    discovery.onValue (service) =>
      if services[service.id()]?
        services[service.id()].seen = Date.now()
      else
        services[service.id()] = {ref: service, seen: Date.now()}
        compound.plug(service)
        sink? new Bacon.Next(new Available(this, service))
    discovery.onEnd ->
      unsubPoll()
      sink? new Bacon.End()
    unsubPoll = Bacon.fromPoll(timeout, -> Date.now()).onValue (now) =>
      for id, {ref, seen} of services
        continue if seen >= (now - timeout)
        ref.unbindService() if ref.bound()
        delete services[id]
        sink? new Bacon.Next(new Unavailable(this, ref))
    sink = undefined
    super (newSink) ->
      sink = (event) ->
        reply = newSink event
        unsub() if reply == Bacon.noMore or event.isEnd()
      unsub = ->
        sink = undefined
    @address = -> address
    @services = ->
      refs = {}
      _.each(services, ({ref}) -> refs[ref.id()] = ref)
      refs
    @toProperty = =>
      @scan @services(), (devices, event) ->
        service = event.service()
        if event.isAvailable()
          services[service.id()] = service
        else if event.isUnavailable()
          delete services[service.id()]
        services
    @devicestatus = -> _.find(services, ({ref}) -> ref instanceof DeviceStatusService)?.ref
    @mediacontent = -> _.find(services, ({ref}) -> ref instanceof MediaContentService)?.ref
    @media = -> _.find(services, ({ref}) -> ref instanceof MediaService)?.ref
    @isSource = -> @mediacontent()?
    @isTarget = -> @media()?

class Event
  constructor: (device) ->
    @device = -> device
  isFound: -> no
  isChanged: -> no
  isLost: -> no
  isAvailable: -> no
  isUnavailable: -> no

class Found extends Event
  isFound: -> yes

class Changed extends Event
  isChanged: -> yes

class Lost extends Event
  isLost: -> yes

class WithService extends Event
  constructor: (device, service) ->
    super(device)
    @service = -> service

class Available extends WithService
  isAvailable: -> yes

class Unavailable extends WithService
  isUnavailable: -> yes

module.exports = DeviceManager
