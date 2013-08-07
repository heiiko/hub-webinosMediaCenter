webinos = require('webinos')

Bacon = require('baconjs')
Promise = require('promise')
promisify = require('../util/promisify.coffee')

Service = require('./service.coffee')

class MediaService extends Service
  constructor: (underlying) ->
    sink = undefined
    events = new Bacon.EventStream (newSink) =>
      sink = (event) =>
        reply = newSink event
        unsub() if reply == Bacon.noMore or event.isEnd()
      unless @bound()
        sink? new Bacon.End()
      else
        promisify(underlying.registerListeners, underlying)(
          onPlay: ({currentMedia, volume}) => sink? new Bacon.Next(new Play(this, currentMedia, volume))
          onPause: => sink? new Bacon.Next(new Pause(this))
          onStop: => sink? new Bacon.Next(new Stop(this))
          onEnd: (currentMedia) => sink? new Bacon.Next(new End(this, currentMedia))
          onVolumeUP: (volume) => sink? new Bacon.Next(new Volume(this, volume))
          onVolumeDOWN: (volume) => sink? new Bacon.Next(new Volume(this, volume))
          onVolumeSet: (volume) => sink? new Bacon.Next(new Volume(this, volume)))
        .catch((error) =>
          sink? new Bacon.Error(error)
          sink? new Bacon.End())
        .then(=> @isPlaying())
        .then(({isPlaying, currentMedia, volume}) =>
          sink? new Bacon.Next(new Playing(this, currentMedia, volume)) if isPlaying)
      unsub = =>
        sink = undefined
        underlying.unregisterListenersOnExit()
    super(underlying)
    @filter('.isUnbind').onValue(=> sink? new Bacon.End())
    @events = -> events
    @play = (path) =>
      return Promise.reject("Service not bound") unless @bound()
      promisify(underlying.play, underlying)(path)
    @playPause = =>
      return Promise.reject("Service not bound") unless @bound()
      promisify(underlying.playPause, underlying)()
    @isPlaying = =>
      return Promise.reject("Service not bound") unless @bound()
      promisify(underlying.isPlaying, underlying)()
    @stepForward = =>
      return Promise.reject("Service not bound") unless @bound()
      promisify(underlying.stepforward, underlying)()
    @bigStepForward = =>
      return Promise.reject("Service not bound") unless @bound()
      promisify(underlying.bigStepforward, underlying)()
    @stepBackward = =>
      return Promise.reject("Service not bound") unless @bound()
      promisify(underlying.stepback, underlying)()
    @bigStepBackward = =>
      return Promise.reject("Service not bound") unless @bound()
      promisify(underlying.bigStepback, underlying)()
    @stop = =>
      return Promise.reject("Service not bound") unless @bound()
      promisify(underlying.stop, underlying)()
    @volumeUp = =>
      return Promise.reject("Service not bound") unless @bound()
      promisify(underlying.volumeUP, underlying)()
    @volumeDown = =>
      return Promise.reject("Service not bound") unless @bound()
      promisify(underlying.volumeDOWN, underlying)()
    @volume = (volume) =>
      return Promise.reject("Service not bound") unless @bound()
      promisify(underlying.setVolume, underlying)(volume)
    @increasePlaybackSpeed = =>
      return Promise.reject("Service not bound") unless @bound()
      promisify(underlying.increasePlaybackSpeed, underlying)()
    @decreasePlaybackSpeed = =>
      return Promise.reject("Service not bound") unless @bound()
      promisify(underlying.decreasePlaybackSpeed, underlying)()
    @showInfo = =>
      return Promise.reject("Service not bound") unless @bound()
      promisify(underlying.showInfo, underlying)()
    @toggleSubtitle = =>
      return Promise.reject("Service not bound") unless @bound()
      promisify(underlying.toggleSubtitle, underlying)()

MediaService.findServices = (options, filter) ->
  Service.findServices(new ServiceType("http://webinos.org/api/media"), options, filter).map (service) ->
    new MediaService(service.underlying())

class Event
  constructor: (service) ->
    @service = -> service
  isPlay: -> no
  isPlaying: -> no
  isPause: -> no
  isStop: -> no
  isEnd: -> no
  isVolume: -> no

class Play extends Event
  constructor: (service, media, volume) ->
    super(service)
    @media = -> media
    @volume = -> volume
  isPlay: -> yes

class Playing extends Play
  isPlay: -> no
  isPlaying: -> yes

class Pause extends Event
  isPause: -> yes

class Stop extends Event
  isStop: -> yes

class End extends Event
  constructor: (service, media) ->
    super(service)
    @media = -> media
  isEnd: -> yes

class Volume extends Event
  constructor: (service, volume) ->
    super(service)
    @volume = -> volume
  isVolume: -> yes

module.exports = MediaService
