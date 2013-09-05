var MainmenuViewModel = require('../view/mainmenu_view_model.js');
var MainmenuView = require('../view/mainmenu_view.js');

function MainmenuController(manager, input) {
  var viewModel = new MainmenuViewModel(manager, input);
  var view = new MainmenuView(viewModel);
}

module.exports = MainmenuController;
