var _ = require('underscore');

var Bacon = require('baconjs');

var DeviceManager = require('./model/device.coffee');

var TVBrowserViewModel = require('./view/tv_browser_view_model.js');
var TVBrowserView = require('./view/tv_browser_view.js');
var RendererViewModel = require('./view/renderer_view_model.js');
var RendererView = require('./view/renderer_view.js');
require('./view/tv_main_view.js');

//Dirty workaround
function onResize(){
  var win=$(window);
  var w=win.width();
  var h=win.height();
  var aW=w/1920.0;
  var aH=h/1080.0;
  $('body').css('-webkit-transform','scale('+aW+','+aH+')');
  $('body').css('font-size',aW*16+'px');
}

$(document).ready(function() {
  $(window).on('resize',onResize);
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

  var tvbrowserViewModel = new TVBrowserViewModel(manager, input);
  var tvbrowserView = new TVBrowserView(tvbrowserViewModel);
  var rendererViewModel = new RendererViewModel(manager, input);
  var rendererView = new RendererView(rendererViewModel);
});