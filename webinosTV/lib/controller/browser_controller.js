var _ = require('underscore');
var Bacon = require('baconjs');

var BrowserViewModel = require('../view/browser_view_model.js');
var BrowserView = require('../view/browser_view.js');
var ControlsView = require('../view/controls_view.js');

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
