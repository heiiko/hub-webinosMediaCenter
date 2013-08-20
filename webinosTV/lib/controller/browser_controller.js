var _ = require('underscore');
var Bacon = require('baconjs');

var BrowserViewModel = require('../view/browser_view_model.js');
var BrowserView = require('../view/browser_view.js');

function BrowserController(manager) {
  manager = manager;

  viewModel = new BrowserViewModel(manager);

  Bacon.combineTemplate({
    devices: manager.toProperty(),
    selectedContent: viewModel.selectedContent(),
    selectedTargets: viewModel.selectedTargets()
  }).sampledBy(viewModel.play()).onValue(function (play) {
    if (!play.selectedContent.length) return;
    var selectedItem = play.selectedContent[0];

    var source = play.devices[selectedItem.source];
    var item = _.findWhere(source.content()['media'], {
      id: selectedItem.item.id,
      title: selectedItem.item.title
    });

    if (!play.selectedTargets.length) return;
    var selectedTarget = play.selectedTargets[0];
    var target = play.devices[selectedTarget];

    source.mediacontent().getLink({
      folderId: item.id,
      fileName: item.title
    }).then(function (link) {
      target.media().play(link);
    });
  });

  view = new BrowserView(viewModel);
}

module.exports = BrowserController;
