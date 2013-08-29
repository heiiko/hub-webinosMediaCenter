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
            sink? new Bacon.Next(new PeerService(channel, event.message().from))
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
  constructor: (channel, peer) ->
    queue = []
    super({
      serviceAddress: peer.address, id: peer.id,
      bindService: ({onBind}) -> onBind(this)
      unbindService: -> undefined
    })
    channel.filter('.isDisconnect').onValue => @unbindService()
    messages = channel.filter (event) ->
      event.isMessage() and event.message().to is peer
    messages.onValue (event) =>
      if channel.service().address() is webinos.session.getServiceLocation() # TODO: Check.
        switch event.message().type
          when 'queue:prepend' then queue.unshift(event.message().content)
          when 'queue:append' then queue.push(event.message().content)
        @send('synchronize', {queue})
      else
        switch event.message().type
          when 'synchronize' then {queue} = event.message().content
    @channel = -> channel
    @send = (type, content) ->
      channel.send({
        from: # TODO: Check.
          address: webinos.session.getServiceLocation()
          id: webinos.session.getSessionId()
        to: peer
        type, content
      })
    @messages = -> messages
    @queue = -> queue
  @prepend: (content) ->
    @send('queue:prepend', content)
  @append: (content) ->
    @send('queue:append', content)

module.exports = PeerService
