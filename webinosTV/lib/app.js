var _ = require('underscore');

var Bacon = require('baconjs');

var DeviceManager = require('./model/device.coffee');

var BrowserController = require('./controller/browser_controller.js');
var RendererController = require('./controller/renderer_controller.js');
var RCController = require('./controller/rc_controller.js');
var MainmenuView = require('./view/mainmenu_view.js');

$(document).ready(function () {
  var manager = new DeviceManager(30000, 60000);

  var peer = manager.toProperty().map(function (devices) {
    var local = _.find(devices, function (device) {
      return device.isLocal();
    });

    if (typeof local === 'undefined' || !local.peers().length) return '<no-peer>';
    return local.peers()[0];
  });

  var keyName = {13: 'enter', 37: 'left', 38: 'up', 39: 'right', 40: 'down'};
  var local = $(window).asEventStream('keydown').filter(function (event) {
    return _.has(keyName, event.keyCode);
  }).map(function (event) {
    return keyName[event.keyCode];
  });

  var remote = peer.flatMapLatest(function (peer) {
    if (peer === '<no-peer>') return Bacon.never();
    return peer.messages();
  }).filter(function (message) {
    return message.type === 'input';
  }).map(function (message) {
    return message.contents.key;
  });

  var input = local.merge(remote);

  new BrowserController(manager, input);
  new RendererController(manager, input);
  new RCController(manager, input);
  new MainmenuView();
});
