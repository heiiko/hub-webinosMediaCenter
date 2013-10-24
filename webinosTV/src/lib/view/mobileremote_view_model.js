var _ = require('underscore');

var Bacon = require('baconjs');
var bjq = require('bacon.jquery');

function MobileRemoteViewModel(manager, input) {
  input = input.filter(function () {
    return $('.pt-page-current').attr('id') === 'mobilecontroller';
  });

  this.input = function () {
    return input;
  };
  
  var targets = manager.toProperty().map(function (devices) {
    return _.chain(devices).filter(function (device) {
      console.warn('DEBUG MODE! ', 'mobileremote_view_model.js');
      return device.isTarget();
      //return device.isTarget() && !device.isLocal() && device.type() === 'tv';
    }).map(function (device) {
      return _.map(device.peers(), function (service) {
        return {device: device, service: service, type: 'peer'};
      });
    }).flatten().value();
  });

  this.targets = function () {
    return targets;
  };

  var selectedTarget = bjq.Model([]);
  this.selectedTarget = function () {
    return selectedTarget;
  };

  var peer = manager.toProperty().sampledBy(selectedTarget, function (devices, selectedTarget) {
    if (typeof selectedTarget[0] === 'undefined') 
      return '<no-peer>';

    // Assumption: Only devices with a peer service are recognized as targets.
    return devices[selectedTarget[0].device].services()[selectedTarget[0].service];
  });

  var keys = new Bacon.Bus();
  peer.sampledBy(keys, function (peer, key) {
    return {peer: peer, key: key};
  }).filter(function (operation) {
    return operation.peer !== '<no-peer>';
  }).onValue(function (operation) {
    operation.peer.send('input', {key: operation.key});
  });

  peer.onValue();

  var enter = new Bacon.Bus();
  keys.plug(enter.map('enter'));

  this.enter = function () {
    return enter;
  };

  var left = new Bacon.Bus();
  keys.plug(left.map('left'));

  this.left = function () {
    return left;
  };

  var up = new Bacon.Bus();
  keys.plug(up.map('up'));

  this.up = function () {
    return up;
  };

  var right = new Bacon.Bus();
  keys.plug(right.map('right'));

  this.right = function () {
    return right;
  };

  var down = new Bacon.Bus();
  keys.plug(down.map('down'));

  this.down = function () {
    return down;
  };
}

module.exports = MobileRemoteViewModel;
