var _ = require('underscore');

var Bacon = require('baconjs');

var DeviceManager = require('./model/device.coffee');

var MobileBrowserViewModel = require('./view/mobilebrowser_view_model.js');
var MobileBrowserView = require('./view/mobilebrowser_view.js');
var RendererViewModel = require('./view/renderer_view_model.js');
var RendererView = require('./view/renderer_view.js');
var MobileRemoteView = require('./view/mobileremote_view.js');
var MobileRemoteViewModel = require('./view/mobileremote_view_model.js');
require('./view/mobilemain_view.js');

$(document).ready(function() {
  var manager = new DeviceManager(30000, 60000);

  var peer = manager.toProperty().map(function(devices) {
    var local = _.find(devices, function(device) {
      return device.isLocal();
    });

    if (typeof local === 'undefined' || !local.peers().length)
      return '<no-peer>';
    return local.peers()[0];
  });

  var keyName = {13: 'enter', 37: 'left', 38: 'up', 39: 'right', 40: 'down'};
  var local = $(window).asEventStream('keydown').filter(function(event) {
    return _.has(keyName, event.keyCode);
  }).map(function(event) {
    return keyName[event.keyCode];
  });

  var remote = peer.flatMapLatest(function(peer) {
    if (peer === '<no-peer>')
      return Bacon.never();
    return peer.messages();
  }).filter(function(message) {
    return message.type === 'input';
  }).map(function(message) {
    return message.content.key;
  });

  var input = local.merge(remote);

  var mobilebrowserViewModel = new MobileBrowserViewModel(manager, input);
  var mobilebrowserView = new MobileBrowserView(mobilebrowserViewModel);
  var rendererViewModel = new RendererViewModel(manager, input);
  var rendererView = new RendererView(rendererViewModel);
  var mobileremoteViewModel = new MobileRemoteViewModel(manager, input);
  var mobileremoteView = new MobileRemoteView(mobileremoteViewModel);
});