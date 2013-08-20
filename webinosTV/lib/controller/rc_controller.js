var RCViewModel = require('../view/rc_view_model.js');
var RCView = require('../view/rc_view.js');

function RCController(manager) {
  this.manager = manager;

  this.viewModel = new RCViewModel(this.manager);
  this.view = new RCView(this.viewModel);
}

module.exports = RCController;
