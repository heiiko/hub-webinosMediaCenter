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
        if event.isMessage()
          message = event.message()
          if message.content is 'hello'
            sink? new Bacon.Next(new PeerService(channel, message.address, message.id))
        else if event.isDisconnect()
          unsubPoll()
          sink? new Bacon.End()
      unsubPoll = Bacon.once(Date.now()).concat(Bacon.fromPoll(options.interval, -> Date.now())).onValue (now) ->
        channel.send(
          address: webinos.session.getServiceLocation(), id: channel.service().address()
          content: 'hello')
      unsub = ->
        sink = undefined
  constructor: (channel, address, id) ->
    self = address is webinos.session.getServiceLocation()
    super(
      serviceAddress: address, id: id
      bindService: ({onBind}) -> onBind(this)
      unbindService: ->
    )
    channel.filter('.isDisconnect').onValue(=> @unbindService())
    @channel = -> channel
    @messages = ->
      channel.filter (event) ->
        event.isMessage() and event.message().to is address
    @send = (content) ->
      channel.send({to: address, content: content})

module.exports = PeerService
