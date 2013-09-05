var _ = require('underscore');

var Bacon = require('baconjs');

var ControlsViewModel = require('./controls_view_model.js');

function RendererViewModel(manager, input) {
  input = input.filter(function () {
    return $('.pt-page-current').attr('id') === 'renderer';
  });

  this.input = function () {
    return input;
  };

  var peer = manager.toProperty().map(function (devices) {
    var local = _.find(devices, function (device) {
      return device.isLocal();
    });

    if (typeof local === 'undefined' || !local.peers().length) return '<no-peer>';
    return local.peers()[0];
  });

  var controls = new ControlsViewModel(peer);
  this.controls = function () {
    return controls;
  };

  var events = peer.flatMapLatest(function (peer) {
    if (peer === '<no-peer>') return Bacon.never();
    return peer.events();
  });

  this.events = function () {
    return events;
  };

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
