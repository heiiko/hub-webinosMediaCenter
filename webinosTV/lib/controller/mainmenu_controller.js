var MainmenuViewModel = require('../view/mainmenu_view_model.js');
var MainmenuView = require('../view/mainmenu_view.js');

function MainmenuController(manager) {
  var viewModel = new MainmenuViewModel(manager);
  var view = new MainmenuView(viewModel);
}

module.exports = MainmenuController;
