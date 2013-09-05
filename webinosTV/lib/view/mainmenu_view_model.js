var _ = require('underscore');

var Bacon = require('baconjs');
var bjq = require('bacon.jquery');

function MainmenuViewModel(manager) {
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