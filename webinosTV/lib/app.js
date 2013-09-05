var DeviceManager = require('./model/device.coffee');

var BrowserController = require('./controller/browser_controller.js');
var RendererController = require('./controller/renderer_controller.js');
var RCController = require('./controller/rc_controller.js');
var MainmenuView = require('./view/mainmenu_view.js');

$(document).ready(function () {
  var manager = new DeviceManager(30000, 60000);
  new BrowserController(manager);
  new RendererController(manager);
  new RCController(manager);
  new MainmenuView();
});
