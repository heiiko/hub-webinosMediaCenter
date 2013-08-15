var _ = require('underscore');
var $ = require('jquery');

var Bacon = require('baconjs');

var DeviceManager = require('./model/device.coffee');
var view = require('./view/view.js');

$(document).ready(function() {
  var manager = new DeviceManager(30000, 60000);
  manager.filter('.isFound').flatMap(function (event) {
    console.log('New device found!', event.device().address());
    return event.device();
  }).filter('.isAvailable').map(function (event) {
    console.log('New service found!', event.service().address(), event.service().id());
    return event.service();
  }).flatMap(function (service) {
    return Bacon.fromPromise(service.bindService());
  }).onValue(function (service) {
    console.log('Service bound!', service.address(), service.id());
    service.unbindService();
  });
});
