var _ = require('underscore');
var $ = require('jquery');

var Bacon = require('baconjs');

var DeviceManager = require('./model/devices.coffee');
var view = require('./view/view.js');
var WebinosController = require('./controller/app_controller.js');

$(document).ready(function() {
  var manager = new DeviceManager(30000, 60000);
  manager.filter('.isFound').onValue(function (event) {
    console.log('New device found!', event.device().address());
    return event.device();
  });

  new WebinosController(manager, view);
});
