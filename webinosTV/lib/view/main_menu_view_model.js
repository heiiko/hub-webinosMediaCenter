var _ = require('underscore');

var bjq = require('bacon.jquery');

function MainMenuViewModel(manager, input) {
  input = input.filter(function () {
    return $('.pt-page-current').attr('id') === 'startscreen' || $('.menu').is(':visible');
  });

  this.input = function () {
    return input;
  };

  var targets = manager.toProperty().map(function (devices) {
    return _.filter(devices, function (device) {
      return device.isTarget() && !device.isLocal();
    });
  });

  this.targets = function () {
    return targets;
  };

  var selectedTarget = bjq.Model('<no-target>');
  this.selectedTarget = function () {
    return selectedTarget;
  };
}

module.exports = MainMenuViewModel;
