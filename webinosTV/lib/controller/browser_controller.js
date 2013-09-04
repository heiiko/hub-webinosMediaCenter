var _ = require('underscore');
var Bacon = require('baconjs');
var Promise = require('promise');

var BrowserViewModel = require('../view/browser_view_model.js');
var BrowserView = require('../view/browser_view.js');
var ControlsView = require('../view/controls_view.js');

function BrowserController(manager) {
  var viewModel = new BrowserViewModel(manager);

  var queue = Bacon.mergeAll(
    viewModel.prepend().map('prepend'),
    viewModel.append().map('append')
  );

  Bacon.combineTemplate({
    devices: manager.toProperty(),
    selectedContent: viewModel.selectedContent(),
    selectedTargets: viewModel.selectedTargets()
  }).sampledBy(queue, function (state, type) {
    return {type: type, state: state};
  }).onValue(function (command) {
    var type  = command.type;
    var state = command.state;

    if (!state.selectedContent.length) return;
    var items = _.map(state.selectedContent, function (selectedItem) {
      var source = state.devices[selectedItem.source];
      var item   = _.findWhere(source.content()['media'], {
        id: selectedItem.item.id,
        title: selectedItem.item.title
      });
      return {source: source, item: item};
    });

    if (!state.selectedTargets.length) return;
    var targets = _.map(state.selectedTargets, function (selectedTarget) {
      return state.devices[selectedTarget];
    });

    var promises = _.map(items, function (item) {
      return item.source.mediacontent().getLink({
        folderId: item.item.id,
        fileName: item.item.title
      }).then(function (link) {
        return {item: item.item, link: link};
      });
    });

    Promise.every.apply(Promise, promises).then(function (values) {
      _.each(targets, function (target) {
        var peer = target.peers()[0];
        (type === 'prepend' ? peer.prepend : peer.append).call(peer, values);
      });
    });
  });

  var view = new BrowserView(viewModel);

  var commands = new Bacon.Bus();
  var controlsView = new ControlsView(null,commands);
  controlsView.renderControls(view.getControlsSelector());

  Bacon.combineTemplate({
    selectedPeer: viewModel.selectedPeer(),
    queue: viewModel.queue(), selectedQueue: viewModel.selectedQueue()
  }).sampledBy(controlsView.getStream().filter(function (event) {
    return event.cmd === 'deleteRequest';
  })).onValue(function (state) {
    if (state.selectedPeer === null || !state.selectedQueue.length) return;

    var indexes = [];
    _.each(state.selectedQueue, function (link) {
      _.each(state.queue, function (item, index) {
        if (link === item.link) indexes.push(index);
      });
    });

    state.selectedPeer.remove(indexes);
  });

  var selectedPeer = viewModel.selectedPeer().flatMapLatest(function (selectedPeer) {
    if (selectedPeer === null) return Bacon.once(null);
    return selectedPeer.state().map(function (state) {
      return {peer: selectedPeer, state: state};
    });
  }).toProperty(null);

  selectedPeer.onValue(function (current) {
    if (current === null) {
      commands.push({cmd: 'setPlayPosition', value: 0});
      commands.push({cmd: 'pause'});
    } else if (current.state.playback.current) {
      if (current.state.playback.playing) {
        commands.push({cmd: 'play', value: 120000});
      } else {
        commands.push({cmd: 'pause'});
      }
      commands.push({cmd: 'setPlayPosition', value: 120000 * current.state.playback.relative});
    } else {
      commands.push({cmd: 'setPlayPosition', value: 0});
      commands.push({cmd: 'pause'});
    }
  });

  selectedPeer.sampledBy(controlsView.getStream(), function (selectedPeer, event) {
    return {selectedPeer: selectedPeer, event: event};
  }).filter(function (op) {
    return op.selectedPeer !== null;
  }).map(function (op) {
    return {peer: op.selectedPeer.peer, state: op.selectedPeer.state, event: op.event};
  }).onValue(function (op) {
    switch (op.event.cmd) {
      case 'playpauseRequest':
        op.peer.playOrPause();
        break;
      case 'previousRequest':
        op.peer.seek(0);
        break;
      case 'nextRequest':
        op.peer.next();
        break;
      case 'seekRequest':
        op.peer.seek(op.event.value);
        break;
      case 'rewindRequest':
        op.peer.seek(Math.max(0, op.state.playback.relative - 0.10));
        break;
      case 'forwardRequest':
        op.peer.seek(Math.min(1, op.state.playback.relative + 0.10));
        break;
    }
  });

  var peer = manager.toProperty().map(function (devices) {
    var local = _.find(devices, function (device) {
      return device.isLocal();
    });

    if (typeof local === 'undefined' || !local.peers().length) return null;
    return local.peers()[0];
  });

  peer.filter(function (peer) {
    return peer !== null;
  }).onValue(function (peer) {
    var length = 120000, position = 0, playing = false;
    peer.events().onValue(function (event) {
      if (event.isPlay()) {
        playing = true;
        position = 0;
        peer.apply().push({type: 'playback:started'});
        peer.apply().push({type: 'playback:state', content: {relative: 0}});
      } else if (event.isSeek()) {
        position = length * event.relative();
        peer.apply().push({type: 'playback:state', content: {relative: event.relative()}});
      } else if (event.isPause()) {
        playing = false;
        peer.apply().push({type: 'playback:paused'});
      } else if (event.isResume()) {
        playing = true;
        peer.apply().push({type: 'playback:resumed'});
      }
    });

    setInterval(function () {
      if (!playing) return;
      position += 1000;
      peer.apply().push({type: 'playback:state', content: {relative: position/length}});
      if (position >= length) {
        playing = false;
        peer.apply().push({type: 'playback:ended'});
      }
    }, 1000);
    peer.play();
  });
}

module.exports = BrowserController;
