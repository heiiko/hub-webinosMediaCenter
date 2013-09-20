var _ = require('underscore');

var Bacon = require('baconjs');

var gotoPageById = require('./pagetransition.js');

function RemoteViewModel(manager, input, mainMenuViewModel) {
  input = input.filter(function () {
    return $('.pt-page-current').attr('id') === 'controller' && !$('.menu').is(':visible');
  });

  this.input = function () {
    return input;
  };

  var peer = manager.toProperty().sampledBy(mainMenuViewModel.selectedTarget(), function (devices, selectedTarget) {
    if (selectedTarget === '<no-target>') return '<no-peer>';

    gotoPageById('#controller');
    window.closeSelectTarget();

    // Assumption: Only devices with a peer service are recognized as targets.
    return devices[selectedTarget].peers()[0];
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

module.exports = RemoteViewModel;
