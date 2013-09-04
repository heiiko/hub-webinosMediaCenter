var DeviceManager = require('./model/device.coffee');

require('./view/main_view.js');

var BrowserController = require('./controller/browser_controller.js');
var RendererController = require('./controller/renderer_controller.js');
var RCController = require('./controller/rc_controller.js');

$(document).ready(function () {
  var manager = new DeviceManager(30000, 60000);
  new BrowserController(manager);
  new RendererController(manager);
  new RCController(manager);
});
