var $ = require('jquery');
var Bacon = require('baconjs');

var ControlsView = require('./controls_view.js');

$(window).resize(function() {

});

$(document).ready(function() {

});

var IMAGE_SLIDESHOW_INTERVAL = 5000;

function RendererView(viewModel) {
	var self = this;
  self.viewModel = viewModel;
  self.imageTimer =null;

  var controlsViewModel = viewModel.controls();
  var controlsView = new ControlsView('.rendererControlls', {
    remove: false,
    fullscreen: true,
    highdef: true,
    style: 'full',
    navclass: 'nav_rd'
  }, controlsViewModel);

  self.videoRenderer = $("#renderer video");
  self.audioRenderer = $("#renderer audio");
  self.imageRenderer = $("#renderer .imageContainer");

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
  		self.playItem(event.item().item.type,event.item().link);
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
	var self = this;

	if(self.imageTimer){
		clearTimeout(self.imageTimer);
		self.imageTimer=null;
	}

	type = type.split(" ")[0].toLowerCase();
	switch(type){
		case "video":
		case "audio":
		case "channel":
			$(self.videoRenderer).show();
			$(self.imageRenderer).hide();
			self.videoRenderer[0].src = url;
		break;
		case "image":
			$(self.videoRenderer).hide();
			$(self.imageRenderer).show();
			$(self.imageRenderer).css("background-image", "url("+url+")");
			self.imageTimer = setTimeout(function(){
				self.viewModel.ended().push();
			},IMAGE_SLIDESHOW_INTERVAL);
		break;
		default:
			console.log("Unknown type.");
	}
}

module.exports = RendererView;
