var _ = require('underscore');

var Bacon = require('baconjs');

var ControlsViewModel = require('./controls_view_model.js');

function RendererViewModel(manager) {
  var self = this;

  var device = manager.toProperty().map(function (devices) {
    var local = _.find(devices, function (device) {
      return device.isLocal();
    });

    if (typeof local === 'undefined' ) return '<no-device>';
    return local;
  });

  var peer = device.map(function (local) {
    if (local === '<no-device>' || !local.peers().length) return '<no-peer>';
    return local.peers()[0];
  });

  var controls = new ControlsViewModel(peer);
  this.controls = function () {
    return controls;
  };

  this.renderer = "wrt";

  var events = peer.flatMapLatest(function (peer) {
    if (peer === '<no-peer>') return Bacon.never();
    return peer.events();
  }).log('event').map(function (event) {
    if (event.isPlay()) {
      if (event.item().link.indexOf("#live") !== -1) {
        self.renderer = "mediaAPI";
      }else{
        self.renderer = "wrt";
      }
    }

    return {renderer: self.renderer, event: event};
  }).log('event.map');

  this.events = function () {
    return events.filter(function (event) {
      return event.renderer === "wrt";
    }).map('.event').log('event.wrt');
  };

  //route live tv streams 
  device.sampledBy(events.filter(function (event) {
    return event.renderer === "mediaAPI";
  }).map('.event').log('event.media'), function (device, event) {
    return {device: device, event: event};
  }).log('operation').filter(function (operation) {
    console.log('services', operation.device.services())
    return operation.device !== '<no-device>' && typeof operation.device.media() !== 'undefined';
  }).log('operation.filter').onValue(function (operation) {
    if (operation.event.isPlay()) {
      var link = operation.event.item().link;
      var index = link.indexOf('#');
      if (index !== -1) link = link.substr(0, index);
      operation.device.media().play(link);
    }
  });

  var updates = new Bacon.Bus();

  peer.sampledBy(updates, function (peer, update) {
    return {peer: peer, update: update};
  }).filter(function (operation) {
    return operation.peer !== '<no-peer>';
  }).onValue(function (operation) {
    operation.peer.apply().push(operation.update);
  });

  var started = new Bacon.Bus();
  updates.plug(started.map({type: 'playback:started'}));

  this.started = function () {
    return started;
  };

  var paused = new Bacon.Bus();
  updates.plug(paused.map({type: 'playback:paused'}));

  this.paused = function () {
    return paused;
  };

  var resumed = new Bacon.Bus();
  updates.plug(resumed.map({type: 'playback:resumed'}));

  this.resumed = function () {
    return resumed;
  };

  var ended = new Bacon.Bus();
  updates.plug(ended.map({type: 'playback:ended'}));

  this.ended = function () {
    return ended;
  };

  var state = new Bacon.Bus();
  updates.plug(state.map(function (state) {
    return {type: 'playback:state', content: {relative: state.relative}};
  }));

  this.state = function () {
    return state;
  };
}

module.exports = RendererViewModel;
