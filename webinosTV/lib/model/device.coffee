_ = require('underscore')

Bacon = require('baconjs')

webinos = require('webinos')

DeviceStatusService = require('../service/devicestatus.coffee')
MessagingService = require('../service/messaging.coffee')
PeerService = require('./peer.coffee')
MediaContentService = require('../service/mediacontent.coffee')
MediaService = require('../service/media.coffee')

class DeviceManager extends Bacon.EventStream
  constructor: (interval = 15000, timeout = 30000) ->
    devices = {}
    compound = new Bacon.Bus()
    compound.onValue (event) ->
      device = event.device()
      if event.isAvailable()
        service = event.service()
        if service instanceof DeviceStatusService
          sink? new Bacon.Next(new Found(device))
        else
          if service instanceof MessagingService
            services.plug Bacon.fromPromise(service.createChannel(
                namespace: 'urn:webinos:hub:media'
                properties:
                  mode: 'send-receive'
                  reclaimIfExists: yes
                -> yes).then(_.identity, -> Promise.reject(service)))
              .map(Bacon.once)
              .mapError((service) -> service.searchForChannels('urn:webinos:hub:media'))
              .flatMap(_.identity)
              .flatMap((channel) -> Bacon.fromPromise(channel.connect()))
              .flatMap((channel) -> PeerService.findServices(channel, {interval}))
          if device.devicestatus()?
            sink? new Bacon.Next(new Changed(device))
      else if event.isUnavailable()
        if _.size(device.services()) is 0
          devices[device.address()].discovery.end()
          delete devices[device.address()]
        if event.service() instanceof DeviceStatusService
          sink? new Bacon.Next(new Lost(device))
        else if device.devicestatus()?
          sink? new Bacon.Next(new Changed(device))
      else if device.devicestatus()?
        sink? new Bacon.Next(event)
    services = new Bacon.Bus()
    services.plug Bacon.once(Date.now()).concat(Bacon.fromPoll(interval, -> Date.now())).flatMap (now) ->
      Bacon.mergeAll(
        DeviceStatusService.findServices(),
        MessagingService.findServices(),
        MediaContentService.findServices(),
        MediaService.findServices())
    services
      .flatMap (service) ->
        Bacon.fromPromise(service.bindService())
      .onValue (service) ->
        discovery = devices[service.address()]?.discovery
        if not discovery?
          discovery = new Bacon.Bus()
          device = new Device(service.address(), discovery, interval, timeout)
          devices[service.address()] = {ref: device, discovery: discovery}
          compound.plug(device)
        discovery.push(service)
    sink = undefined
    super (newSink) ->
      sink = (event) ->
        reply = newSink event
        unsub() if reply is Bacon.noMore or event.isEnd()
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
  constructor: (address, discovery, interval, timeout) ->
    type = undefined
    content = {}
    refresh = undefined
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
        unsub() if reply is Bacon.noMore or event.isEnd()
      unsub = ->
        sink = undefined
    @onValue (event) =>
      return if not event.isAvailable()
      service = event.service()
      if service instanceof DeviceStatusService
        event.service().getPropertyValue(
          component: '_DEFAULT'
          aspect: 'Device'
          property: 'type'
        ).then (value) =>
          type = if value is 'smartphone' then 'phone' else value
          sink? new Bacon.Next(new Changed(this))
      else if service instanceof MediaContentService
        @refresh()
    @address = -> address
    @isLocal = -> address is webinos.session.getServiceLocation() # TODO: Check.
    @isRemote = => not @isLocal()
    @type = -> type
    @content = -> content
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
    @peers = -> _.chain(services).filter(({ref}) -> ref instanceof PeerService).pluck('ref').value()
    @isSource = => @mediacontent()?
    @isTarget = => @media()? or @peers().length > 0
    @refresh = (force = no) =>
      now = Date.now()
      return if refresh? and refresh >= (now - interval) and not force
      refresh = now
      mediacontent = @mediacontent()
      return if not mediacontent?
      mediacontent.findItem({}).then (items) =>
        content['media'] = items
        sink? new Bacon.Next(new Changed(this))

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
