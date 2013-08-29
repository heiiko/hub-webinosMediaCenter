_ = require('underscore')

webinos = require('webinos')

Bacon = require('baconjs')

Service = require('../service/service.coffee')

class PeerService extends Service
  @findServices: (channel, options = {interval: 15000}) ->
    new Bacon.EventStream (newSink) ->
      sink = (event) ->
        reply = newSink event
        unsub() if reply is Bacon.noMore or event.isEnd()
      unsubPoll = ->
      unsub = ->
        sink = undefined
        unsubPoll()
      if channel.connected()
        channel.onValue (event) ->
          if event.isMessage() and event.message().type is 'hello'
            sink? new Bacon.Next(PeerService.create(channel, event.message().from))
          else if event.isDisconnect()
            sink? new Bacon.End()
        if channel.service().address() is webinos.session.getServiceLocation() # TODO: Check.
          unsubPoll = Bacon.once(Date.now()).concat(Bacon.fromPoll(options.interval, -> Date.now())).onValue (now) ->
            channel.send({
              type: 'hello'
              from: # TODO: Check.
                address: webinos.session.getServiceLocation()
                id: webinos.session.getSessionId()
            })
      else if channel.disconnected()
        sink? new Bacon.End()
      unsub
  @create: (channel, peer) ->
    if peer.address is webinos.session.getServiceLocation() and
       peer.id is webinos.session.getSessionId()
      new LocalPeerService(channel, peer)
    else
      new RemotePeerService(channel, peer)
  constructor: (channel, peer) ->
    super({
      serviceAddress: peer.address, id: peer.id,
      bindService: ({onBind}) -> onBind(this)
      unbindService: -> undefined
    })
    channel.filter('.isDisconnect').onValue => @unbindService()
    messages = channel
      .filter (event) ->
        event.isMessage() and event.message().to is peer
      .map (event) ->
        event.message()
    @channel = -> channel
    @messages = -> messages
    @send = (type, content) ->
      channel.send({
        from: # TODO: Check.
          address: webinos.session.getServiceLocation()
          id: webinos.session.getSessionId()
        to: peer
        type, content
      })
  isLocal: -> no
  isRemote: -> no
  playOrPause: ->
    @send('playback:playOrPause')
  seek: (relative) ->
    @send('playback:seek', {relative})
  next: ->
    @send('playback:next')
  prepend: (items) ->
    @send('queue:prepend', {items})
  append: (items) ->
    @send('queue:append', {items})
  remove: (items) ->
    @send('queue:remove', {items})

class LocalPeerService extends PeerService
  constructor: (channel, peer) ->
    sink = undefined
    events = new Bacon.EventStream (newSink) ->
      sink = (event) ->
        try reply = newSink event catch e then console.log('exception', e)
        unsub() if reply is Bacon.noMore or event.isEnd()
      unsub = =>
        sink = undefined
    super(channel, peer)
    apply = new Bacon.Bus()
    apply.plug @messages()
      .filter ({type}) ->
        type isnt 'synchronize'
    state = apply.scan {
      playback:
        current: no
        playing: no
        relative: 0
      queue: []
    }, ({playback, queue}, {type, content}) ->
      switch type
        when 'playback:started'
          playback = {current: yes, playing: yes, relative: 0}
        when 'playback:paused'
          playback.playing = no
        when 'playback:ended'
          playback = {current: no, playing: no, relative: 0}
          queue.shift()
          sink? new Bacon.Next(new Play(queue[0])) if queue.length > 0
        when 'playback:state'
          playback.relative = content.relative
        when 'playback:playOrPause'
          if playback.current
            sink? new Bacon.Next(if playback.playing then new Pause() else new Resume())
          else if queue.length > 0
            sink? new Bacon.Next(new Play(queue[0]))
        when 'playback:seek'
          sink? new Bacon.Next(new Seek(content.relative)) if playback.current
        when 'playback:next'
          sink? new Bacon.Next(new Stop())
        when 'queue:prepend'
          queue = queue[0..0].concat(content.items, queue[1..])
          sink? new Bacon.Next(new Stop())
        when 'queue:append'
          queue = queue.concat(content.items)
          sink? new Bacon.Next(new Play(queue[0])) if queue.length is content.items.length
        when 'queue:remove'
          for i in _.sortBy(content.items, _.identity).reverse()
            queue.splice(i, 1)
          sink? new Bacon.Next(new Stop()) if 0 in content.items
      {playback, queue}
    state.onValue (state) =>
      @send('synchronize', state)
    @apply = -> apply
    @state = -> state
    @events = -> events
  isLocal: -> yes

class Event
  isPlay: -> no
  isSeek: -> no
  isPause: -> no
  isResume: -> no
  isStop: -> no

class Play extends Event
  constructor: (item) ->
    @item = -> item
  isPlay: -> yes

class Seek extends Event
  constructor: (relative) ->
    @relative = -> relative
  isSeek: -> yes

class Pause extends Event
  isPause: -> yes

class Resume extends Event
  isResume: -> yes

class Stop extends Event
  isStop: -> yes

class RemotePeerService extends PeerService
  constructor: (channel, peer) ->
    super(channel, peer)
    state = @messages()
      .filter ({type}) ->
        type is 'synchronize'
      .map ({content}) ->
        content
      .toProperty {
        playback:
          current: no
          playing: no
          relative: 0
        queue: []
      }
    state.onValue -> undefined
    @state = -> state
  isRemote: -> yes

module.exports = PeerService
