var $ = require('jquery');

var resizeHandler;
var that;

$(window).resize(function() {
  if(resizeHandler){
  	resizeHandler();
  }
});

$(document).ready(function() {
  
});


function ControlsView(viewModel) {
  this.viewModel = viewModel;
  this.renderControls = function(parent, config){
  	parent = $(parent) || $("body");
  	config = config || {style:'slim', delete:true, fullscreen:false, highdef:false};

  	var buttonCount = 5;
  	buttonCount = (config.delete)?(++buttonCount):buttonCount;
  	buttonCount = (config.fullscreen)?(++buttonCount):buttonCount;
  	buttonCount = (config.highdef)?(++buttonCount):buttonCount;

  	var cprev = $("<div class='controlButton controlPrev'>");
  	var crewd = $("<div class='controlButton controlRewd'>");
  	var cplay = $("<div class='controlButton controlPlay'>");
  	var cfwrd = $("<div class='controlButton controlFwrd'>");
  	var cnext = $("<div class='controlButton controlNext'>");
  	var cdele = $("<div class='controlButton controlDele'>");
  	var cfull = $("<div class='controlButton controlFull'>");
  	var chres = $("<div class='controlButton controlHres'>");
  	var csbar = $("<div class='controlSbar'><div></div></div>");
  	var ctime = $("<div class='controlTime'>1:00</div>");

	var controls = $("<div class='"+((config.style)?config.style:'slim')+" controlContainer'>");
  	var container = $("<div class='controlButtons'>");
  	container.append(cprev);
  	container.append(crewd);
  	container.append(cplay);
  	container.append(cfwrd);
  	container.append(cnext);
  	container.append(cdele);
  	(config.fullscreen)?container.append(cfull):0;
  	(config.highdef)?container.append(chres):0;
  	controls.append(container);
  	controls.append(csbar);
  	controls.append(ctime);

  	
  	$(parent).append(controls);
	$(".controlButton").css({width:(100/buttonCount)+"%"});
	
  	resizeHandler = function(){
  		$('.controlSbar').css({"transition": "none important!"}); 
  		that.updatePlaytime();
  	}

  	this.play = function(){
  		$(cplay).removeClass("controlPlay");
  		$(cplay).addClass("controlPaus");
  		that.updatePlaytime();
  	}

  	this.pause = function(){
  		$(cplay).removeClass("controlPaus");
  		$(cplay).addClass("controlPlay");
  		that.updatePlaytime(-1);
  	}

  	//todo: add taps
  	$(cplay).on("click",function(){
  		if($(cplay).hasClass("controlPlay")){

  			//todo: do not change directly but send to controller
  			that.play();
  		}else{
  			that.pause();
  		}
  	});


  	this.updatePlaytime = function(px){
  		if(px===-1){
  			$('.controlSbar div').css({"transition": "none important!"});
  			return;
  		}
  		var sbarWidth = $(".controlSbar").width();
  		$('.controlSbar div').css({"transition": "width 1s"}); 
		$(".controlSbar div").css({"width": ((px)?px:sbarWidth)+"px"});
  	}
  	
  	//todo: enable multiple instances of this view 
  	that=this;
  }
}

module.exports = ControlsView;
