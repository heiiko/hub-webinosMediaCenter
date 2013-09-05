var _ = require('underscore');

var Bacon = require('baconjs');
var bjq = require('bacon.jquery');

function MainmenuViewModel(manager, input) {
  input = input.filter(function () {
    return $('.menu').is(":visible") || $('.pt-page-current').attr('id') === 'startscreen';
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
}

module.exports = MainmenuViewModel;