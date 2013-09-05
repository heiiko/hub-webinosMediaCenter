var $ = require('jquery');
var Bacon = require('baconjs');

var ControlsView = require('./controls_view.js');

$(window).resize(function() {

});

$(document).ready(function() {

});


function RendererView(viewModel) {
	var self = this;
  self.viewModel = viewModel;

  var controlsViewModel = viewModel.controls();
  var controlsView = new ControlsView('.rendererControlls', {
    remove: false,
    fullscreen: true,
    highdef: true,
    style: 'full'
  }, controlsViewModel);

  self.videoRenderer = $("#renderer video");
  self.audioRenderer = $("#renderer audio");

  var isResume = false;

  //event sources
  viewModel.started().plug($(self.videoRenderer).asEventStream('play').filter(function(){
  	return !isResume;
  }));
  viewModel.paused().plug($(self.videoRenderer).asEventStream('pause'));
  viewModel.resumed().plug($(self.videoRenderer).asEventStream('play').filter(function(){
  	return isResume;
  }));
  viewModel.ended().plug($(self.videoRenderer).asEventStream('ended'));
  viewModel.state().plug($(self.videoRenderer).asEventStream('timeupdate')
  	.merge($(self.videoRenderer).asEventStream('seeked'))
  	.throttle(1000)
  	.map(function(event){
  		return {relative: event.target.currentTime/event.target.duration};
  }));

  //command
  viewModel.events().onValue(function(event){
  	if(event.isPlay()){
  		isResume=false;
  		self.videoRenderer.length?self.videoRenderer[0].pause():void 0;
  		self.playItem("video",event.item().link);
  		self.videoRenderer.length?self.videoRenderer[0].play():void 0;
  	} else if(event.isPause()){
  		self.videoRenderer.length?self.videoRenderer[0].pause():void 0;
  	} else if(event.isSeek()){
  		self.videoRenderer.length?self.videoRenderer[0].currentTime=self.videoRenderer[0].duration*event.relative():void 0;
  	} else if(event.isResume()){
  		isResume=true;
  		self.videoRenderer.length?self.videoRenderer[0].play():void 0;
  	}
  })
}

RendererView.prototype.playItem = function(type, url){
	switch(type){
		case "video":
			this.videoRenderer[0].src = url;
		break;
		case "audio":
			this.audioRenderer[0].src = url;
		break;
		default:
			console.log("Unknown type.");
	}
}

module.exports = RendererView;
