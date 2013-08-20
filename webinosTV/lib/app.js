var DeviceManager = require('./model/device.coffee');

var BrowserController = require('./controller/browser_controller.js');
require('./view/main_view.js');
var RCController = require('./controller/rc_controller.js');

$(document).ready(function () {
  var manager = new DeviceManager(30000, 60000);
  new BrowserController(manager);
  new RCController(manager);
});
