var BrowserViewModel = require('../view/browser_view_model.js');
var BrowserView = require('../view/browser_view.js');

function BrowserController(manager) {
  var viewModel = new BrowserViewModel(manager);
  var view = new BrowserView(viewModel);
}

module.exports = BrowserController;
