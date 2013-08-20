var _ = require('underscore');

var Bacon = require('baconjs')
var bjq = require('bacon.jquery');

function BrowserViewModel(manager) {
  var sources = bjq.Model({});
  sources.addSource(manager.toProperty().map(function (devices) {
    return _.filter(devices, function (device) {
      return device.isSource();
    });
  }));

  this.sources = function () {
    return sources;
  };

  var content = bjq.Model({});
  content.addSource(sources.map(function (sources) {
    return _.chain(sources).map(function (source) {
      return source.content()['media'];
    }).flatten().value();
  }));

  this.content = function () {
    return content;
  };

  var targets = bjq.Model({});
  targets.addSource(manager.toProperty().map(function (devices) {
    return _.filter(devices, function (device) {
      return device.isTarget();
    });
  }));

  this.targets = function () {
    return targets;
  };

  this.selectedSources = [];
  this.selectedCategories = [];
  this.selectedFiles = [];
  this.selectedTargets = [];
}

module.exports = BrowserViewModel;
