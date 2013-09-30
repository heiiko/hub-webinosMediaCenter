var _ = require('underscore');

var Bacon = require('baconjs');

var DeviceManager = require('./model/device.coffee');

//var MainMenuViewModel = require('./view/main_menu_view_model.js');
//var MainMenuView = require('./view/main_menu_view.js');
//var BrowserViewModel = require('./view/browser_view_model.js');
//var BrowserView = require('./view/browser_view.js');
var TVBrowserViewModel = require('./view/tv_browser_view_model.js');
var TVBrowserView = require('./view/tv_browser_view.js');
var RendererViewModel = require('./view/renderer_view_model.js');
var RendererView = require('./view/renderer_view.js');
//var RemoteView = require('./view/remote_view.js');
//var RemoteViewModel = require('./view/remote_view_model.js');
require('./view/tv_main_view.js');

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

  //var mainMenuViewModel = new MainMenuViewModel(manager, input);
  //var mainMenuView = new MainMenuView(mainMenuViewModel);
  //var browserViewModel = new BrowserViewModel(manager, input);
  //var browserView = new BrowserView(browserViewModel);
  var tvbrowserViewModel = new TVBrowserViewModel(manager, input);
  var tvbrowserView = new TVBrowserView(tvbrowserViewModel);
  var rendererViewModel = new RendererViewModel(manager, input);
  var rendererView = new RendererView(rendererViewModel);
  //var remoteViewModel = new RemoteViewModel(manager, input, mainMenuViewModel);
  //var remoteView = new RemoteView(remoteViewModel);
});