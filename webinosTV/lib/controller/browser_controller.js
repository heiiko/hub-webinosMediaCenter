var BrowserViewModel = require('../view/browser_view_model.js');
var BrowserView = require('../view/browser_view.js');

function BrowserController(manager) {
  this.manager = manager;

  this.viewModel = new BrowserViewModel(manager);
  this.view = new BrowserView(this.viewModel);
}

module.exports = BrowserController;
