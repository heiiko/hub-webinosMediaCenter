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

  //test
  var mediaLen = 60000, mediaPos=0, isPlaying=false;
  var mediaRunHandle = setInterval(function(commands){
    if(!isPlaying){
      return;
    }
    if(mediaPos==0){
      commands.push({cmd:"play",value:mediaLen});
    }
    if(mediaPos>=mediaLen){
      commands.push({cmd:"pause"});
      isPlaying=false;
      return;
    }
    
    
    mediaPos+=1000;
    commands.push({cmd:"setPlayPosition",value:mediaPos});
    

  },1000,commands);

  controlsView.getStream().onValue(function(e){if(e.cmd==="seekRequest"){
    mediaPos=mediaLen*e.value;
  } });

  controlsView.getStream().onValue(function(e){if(e.cmd==="playpauseRequest"){
    isPlaying=!isPlaying;
    if(isPlaying){
      if(mediaPos>=mediaLen){
        mediaPos=0;
        commands.push({cmd:"setPlayPosition",value:mediaPos});
      }
      commands.push({cmd:"play",value:mediaLen});
    }else{
      commands.push({cmd:"pause"});
    }
  } });
  
}

module.exports = BrowserController;
