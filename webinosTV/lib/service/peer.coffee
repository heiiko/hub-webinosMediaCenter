Bacon = require('baconjs')

webinos = require('webinos')

Service = require('./service.coffee')

class PeerService extends Service
  @findServices: (channel, options = {interval: 15000}) ->
    new Bacon.EventStream (newSink) ->
      sink = (event) ->
        reply = newSink event
        unsub() if reply is Bacon.noMore or event.isEnd()
      channel.onValue (event) ->
        if event.isMessage() and event.message().type is 'hello'
          sink? new Bacon.Next(new PeerService(channel, event.message().from))
        else if event.isDisconnect()
          unsubPoll()
          sink? new Bacon.End()
      unsubPoll = Bacon.once(Date.now()).concat(Bacon.fromPoll(options.interval, -> Date.now())).onValue (now) ->
        channel.send {
          type: 'hello'
          from: webinos.session.getServiceLocation()
        }
      unsub = ->
        sink = undefined
  constructor: (channel, address) ->
    queue = []
    super({
      serviceAddress: address, id: 0
      bindService: ({onBind}) -> onBind(this)
      unbindService: ->
    })
    channel.filter('.isDisconnect').onValue(=> @unbindService())
    messages = channel.filter (event) ->
      event.isMessage() and event.message().to is address
    messages.onValue (event) ->
      switch event.message().type
        when 'queue:append'
          console.log 'queue:append', event.message().content
          queue.push(event.message().content)
    @channel = -> channel
    @messages = -> messages
    @queue = -> queue
    @enqueue = (content) => @send('queue:append', content)
    @send = (type, content) ->
      channel.send {
        from: webinos.session.getServiceLocation()
        to: address
        type, content
      }

module.exports = PeerService
