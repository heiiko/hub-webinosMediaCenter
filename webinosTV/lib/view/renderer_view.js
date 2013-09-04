var $ = require('jquery');
var Bacon = require('baconjs');

$(window).resize(function() {
  
});

$(document).ready(function() {
  
});


function RendererView(viewModel) {
	var self = this;
  this.viewModel = viewModel;

  this.videoRenderer = $("#renderer video");
  this.audioRenderer = $("#renderer audio");
  this.rendererControlls = $(".rendererControlls");

  var isResume = false;

  return;

  //event sources
  viewModel.started().plug($(this.videoRenderer).asEventStream('play').filter(function(){ 
  	return !isResume; 
  }));
  viewModel.paused().plug($(this.videoRenderer).asEventStream('pause'));
  viewModel.resumed().plug($(this.videoRenderer).asEventStream('play').filter(function(){ 
  	return isResume; 
  }));
  viewModel.ended().plug($(this.videoRenderer).asEventStream('ended'));
  viewModel.state().plug($(this.videoRenderer).asEventStream('timeupdate')
  	.merge($(this.videoRenderer).asEventStream('seeked'))
  	.map(function(event){
  		return {relative: event.target.currentTime/event.target.duration};
  }));

  //command
  viewModel.events().onValue(function(event){
  	if(event.isPlay()){
  		isResume=false;
  		this.videoRenderer.length?this.videoRenderer[0].pause():void 0;
  		self.playItem("video",event.item().link);
  		this.videoRenderer.length?this.videoRenderer[0].play():void 0;
  	} else if(event.isPause()){
  		this.videoRenderer.length?this.videoRenderer[0].pause():void 0;
  	} else if(event.isSeek()){
  		this.videoRenderer.length?this.videoRenderer[0].currentTime=this.videoRenderer[0].duration*event.relative():void 0;
  	} else if(event.isResume()){
  		isResume=true;
  		this.videoRenderer.length?this.videoRenderer[0].play():void 0;
  	}
  })
}

RendererView.prototype.playItem = function(type, url){
	switch(type){
		case "video":
			$(this.videoRenderer).attr("src",url);
		break;
		case "audio":
			$(this.audioRenderer).attr("src",url);
		break;
		default:
			console.log("Unknown type.");
	}
}

RendererView.prototype.getControlsSelector = function(){
	return ".rendererControlls";
}

module.exports = RendererView; 
