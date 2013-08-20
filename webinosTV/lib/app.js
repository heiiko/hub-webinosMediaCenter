var DeviceManager = require('./model/device.coffee');

var BrowserController = require('./controller/browser_controller.js');
require('./view/main_view.js');

$(document).ready(function () {
  var manager = new DeviceManager(30000, 60000);
  new BrowserController(manager);
});
