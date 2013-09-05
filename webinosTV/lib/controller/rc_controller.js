var RCViewModel = require('../view/rc_view_model.js');
var RCView = require('../view/rc_view.js');

function RCController(manager, input) {
  this.manager = manager;

  this.viewModel = new RCViewModel(this.manager, input);
  this.view = new RCView(this.viewModel);
}

module.exports = RCController;
