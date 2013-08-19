var util = require('util');

var Bacon = require('baconjs');

util.inherits(BrowserViewModel, Bacon.EventStream);
function BrowserViewModel(manager) {
  var sink = undefined;
  Bacon.EventStream.call(this, function (newSink) {
    var unsub;
    sink = function (event) {
      var reply;
      reply = newSink(event);
      if (reply === Bacon.noMore || event.isEnd()) {
        return unsub();
      }
    };
    return unsub = function() {
      sink = undefined;
    };
  });

  var sources = {};

  manager.flatMap(function (event) {
    return Bacon.once(event).merge(event.device());
  }).onValue(function (event) {
    device = event.device();
    if (event.isFound() || event.isAvailable()) {
      if (device.isSource()) {
        sources[device.address()] = device;
        if (typeof sink === 'function') {
          sink(new Bacon.Next(new FoundSource(device)));
        }
      }
    } else if (event.isLost() || event.isUnavailable()) {
      if (!device.isSource()) {
        delete sources[device.address()];
        if (typeof sink === 'function') {
          sink(new Bacon.Next(new LostSource(device)));
        }
      }
    }
  });

  this.sources = function () {
    return sources;
  };
}

function Event(device) {
  this.device = function () {
    return device;
  };
}

Event.prototype.isFoundSource = function () {
  return false;
};

Event.prototype.isLostSource = function () {
  return false;
};

util.inherits(FoundSource, Event)
function FoundSource(device) {
  Event.call(this, device);
}

FoundSource.prototype.isFoundSource = function() {
  return true;
};

util.inherits(LostSource, Event)
function LostSource(device) {
  Event.call(this, device);
}

LostSource.prototype.isLostSource = function() {
  return true;
};

module.exports = BrowserViewModel;
