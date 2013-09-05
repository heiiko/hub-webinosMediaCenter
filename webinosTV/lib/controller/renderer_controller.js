var RendererViewModel = require('../view/renderer_view_model.js');
var RendererView = require('../view/renderer_view.js');

function RendererController(manager) {
  var viewModel = new RendererViewModel(manager);
  var view = new RendererView(viewModel);
}

module.exports = RendererController;
