_ = require('underscore')

webinos = require('webinos')

Bacon = require('baconjs')

Service = require('../service/service.coffee')

generalizeAddress = (address) ->
  index = address.indexOf('/')
  if index is -1 then address else address.substr(0, index)

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
        if channel.service().address() is generalizeAddress(webinos.session.getServiceLocation())
          unsubPoll = Bacon.once(Date.now()).concat(Bacon.fromPoll(options.interval, -> Date.now())).onValue (now) ->
            channel.send({
              type: 'hello'
              from:
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
      .filter((event) ->
        event.isMessage() and event.message().to.address is peer.address and
                              event.message().to.id is peer.id)
      .map('.message')
    @channel = -> channel
    @messages = -> messages
    @send = (type, content) ->
      channel.send({
        from:
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
        reply = newSink event
        unsub() if reply is Bacon.noMore or event.isEnd()
      unsub = =>
        sink = undefined
      if channel.disconnected()
        sink? new Bacon.End()
      unsub
    super(channel, peer)
    @filter('.isUnbind').onValue -> sink? new Bacon.End()
    apply = new Bacon.Bus()
    apply.plug @messages().filter ({type}) -> type isnt 'synchronize'
    state = apply.scan {
      playback:
        current: no
        playing: no
        relative: 0
      queue: []
    }, ({playback, queue}, {type, content}) ->
      next = (shift) ->
        queue = _.tail(queue) if shift
        sink? new Bacon.Next(new Play(queue[0])) if queue.length > 0
      switch type
        when 'playback:started'
          playback = {current: yes, playing: yes, relative: 0}
        when 'playback:paused'
          playback.playing = no
        when 'playback:resumed'
          playback.playing = yes
        when 'playback:ended'
          playback = {current: no, playing: no, relative: 0}
          next(yes)
        when 'playback:state'
          playback.relative = content.relative
        when 'playback:playOrPause'
          if playback.current
            event = if playback.playing then new Pause() else new Resume()
            sink? new Bacon.Next(event)
          else
            next(no)
        when 'playback:seek'
          sink? new Bacon.Next(new Seek(content.relative)) if playback.current
        when 'playback:next'
          next(playback.current)
        when 'queue:prepend'
          queue = content.items.concat(queue)
          next(no) if content.items.length > 0
        when 'queue:append'
          queue = queue.concat(content.items)
          next(no) if content.items.length is queue.length
        when 'queue:remove'
          queue = _.clone(queue)
          for i in _.sortBy(content.items, _.identity).reverse()
            queue.splice(i, 1)
          next(no) if 0 in content.items
      {playback, queue}
    state.onValue (state) => @send('synchronize', state)
    @apply = -> apply
    @state = -> state
    @events = -> events
  isLocal: -> yes

class Event
  isPlay: -> no
  isSeek: -> no
  isPause: -> no
  isResume: -> no

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

class RemotePeerService extends PeerService
  constructor: (channel, peer) ->
    super(channel, peer)
    state = @messages()
      .filter ({type}) -> type is 'synchronize'
      .map('.content')
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
