var BrowserViewModel = require('../view/browser_view_model.js');
var BrowserView = require('../view/browser_view.js');

function BrowserController(manager, input) {
  var viewModel = new BrowserViewModel(manager, input);
  var view = new BrowserView(viewModel);
}

module.exports = BrowserController;
