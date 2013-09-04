var $ = require('jquery');
var Bacon = require('baconjs');


function ControlsView(viewModel,commandBus) {
  var that = this;

  this.viewModel = viewModel;
  this.renderControls = function(parent, config){
  	parent = $(parent) || $("body");
  	config = config || {style:'slim', delete:true, fullscreen:false, highdef:false};

    var seekStateBus = new Bacon.Bus();
    seekStateBus.plug($(window).asEventStream('resize').map({cmd:"uiResized"}));

  	var buttonCount = 5;
  	buttonCount = (config.delete)?(++buttonCount):buttonCount;
  	buttonCount = (config.fullscreen)?(++buttonCount):buttonCount;
  	buttonCount = (config.highdef)?(++buttonCount):buttonCount;

  	var cprev = $("<div class='controlButton controlPrev nav_qu'>");
  	var crewd = $("<div class='controlButton controlRewd nav_qu'>");
  	var cplay = $("<div class='controlButton controlPlay nav_qu'>");
  	var cfwrd = $("<div class='controlButton controlFwrd nav_qu'>");
  	var cnext = $("<div class='controlButton controlNext nav_qu'>");
  	var cdele = $("<div class='controlButton controlDele nav_qu'>");
  	var cfull = $("<div class='controlButton controlFull nav_qu'>");
  	var chres = $("<div class='controlButton controlHres nav_qu'>");
  	var csbar = $("<div class='controlSbar'><div></div></div>");
  	var ctime = $("<div class='controlTime'><div class='controlTimeSchnippel'></div><span>1:00</span></div>");

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

    var controlsStream = $(cprev).asEventStream('click').map({cmd:'previousRequest'})
    .merge($(crewd).asEventStream('click').map({cmd:'rewindRequest'}))
    .merge($(cplay).asEventStream('click').map({cmd:'playpauseRequest'}))
    .merge($(cfwrd).asEventStream('click').map({cmd:'forwardRequest'}))
    .merge($(cnext).asEventStream('click').map({cmd:'nextRequest'}))
    .merge($(cdele).asEventStream('click').map({cmd:'deleteRequest'}))
    .merge($(cfull).asEventStream('click').map({cmd:'fullscreenRequest'}))
    .merge($(chres).asEventStream('click').map({cmd:'highresRequest'}))
    .merge(seekStateBus);
    if(commandBus) controlsStream = controlsStream.merge(commandBus);

    controlsStream.log("Controls&Commands:");

  	$(parent).append(controls);

    var seeker = $('.controlTime').drags({seekBar:".controlSbar",seekStateBus:seekStateBus});

    //one time adjustment to style, based on number of controls 
    $(".controlButton").css({width:(100/buttonCount)+"%"});

  	this.play = function(){
  		$(cplay).removeClass("controlPlay");
  		$(cplay).addClass("controlPaus");
  	}

  	this.pause = function(){
  		$(cplay).removeClass("controlPaus");
  		$(cplay).addClass("controlPlay");
  	}

    var lastKnownPercentage=0;

   // $('.controlSbar div').css({"transition": "width 1s linear"}); 

  	this.updatePlaytime = function(percentage){
      percentage=(percentage)?Math.round(percentage*1000)/1000:lastKnownPercentage;
		  $(".controlSbar div").css({"width": ((percentage)?percentage*parseInt($(".controlSbar").width()):$(".controlSbar").width())});
      $(".controlTime span").text(Math.round(percentage*playTimeMS/1000));
      lastKnownPercentage=percentage;
  	}

    var seekTimerHandle;
    var playTimeMS=0;
    var isSeeking=false;
    controlsStream.onValue(function(e){
        if(e.cmd){
          switch(e.cmd){
            case "uiResized":
              //$('.controlSbar div').css({"transition": "width 0.0s linear"}); 
              that.updatePlaytime();
              //$('.controlSbar div').css({"transition": "width 1s linear"});  
              break;
            case "_seekRequest"://internal ui event
              that.updatePlaytime(e.value);
              //dont flood with seek events 
              if(seekTimerHandle) clearTimeout(seekTimerHandle);
              seekTimerHandle = setTimeout(function(percentage){
                seekStateBus.push({cmd:'seekRequest',value:percentage});
              },200,e.value);
              break;
            case "play":
            console.log(e.value);
              //$('.controlSbar div').css({"transition": "width 0.0s linear"}); 
              that.updatePlaytime(0);
             // $('.controlSbar div').css({"transition": "width 1s linear"});  
              that.play();
              playTimeMS = (e.value)?e.value:0; //media length in ms
              break;
            case "pause":
              that.pause();
              break;
            case "setPlayPosition":
              if(e.value){
                if(e.value>=0 && e.value<1){//percentage case

                }
                if(e.value>1){//explicit millis case
                  if(!isSeeking){
                    var percentage = (e.value/playTimeMS<=1)?e.value/playTimeMS:1;
                    that.updatePlaytime(percentage);
                    seekStateBus.push({cmd:'_setPlayPosition',value:percentage});
                  }
                }
              }
              break;    
            case "_seekStartRequest":
              isSeeking=true;
              break;
            case "_seekEndRequest":
              isSeeking=false;
              break;          
          }
        }
    });

    this.getStream = function(){
      return controlsStream;
    };
  	that=this;
  }
}

module.exports = ControlsView;




//draggable seekbar plugin
(function($) {
    $.fn.drags = function(opt) {

        var z_idx_save = 0,width=0, offset=0, positionOffset=0, drg_w=0, pos_x=0 ;

        var borderWidth = parseInt($(".controlSbar").css("border-width"),10);

        opt = $.extend({handle:"",cursor:"move", seekStateBus:null}, opt);

        $(opt.seekBar).width();

        if(opt.handle === "") {
            var $el = this;
        } else {
            var $el = this.find(opt.handle);
        }

        var mouseUpHandler = function() {
            if(!$($el).hasClass('draggable')){
              return;
            }
           // $('.controlSbar div').css({"transition": "width 1s linear"}); 
            $($el).removeClass('draggable').css('z-index', z_idx_save);
            if(opt.handle === "") {
                $($el).removeClass('draggable');
            } else {
                $($el).removeClass('active-handle').parent().removeClass('draggable');
            }
            opt.seekStateBus.push({cmd:'_seekEndRequest'});
            if((width/2+positionOffset)/width){
              opt.seekStateBus.push({cmd:'_seekRequest',value:(width/2+positionOffset)/width});
            }
        };

        var mouseDownHandler = function(e) {
            if(opt.handle === "") {
                var $drag = $($el).addClass('draggable');
            } else {
                var $drag = $($el).addClass('active-handle').parent().addClass('draggable');
            }
            //$('.controlSbar div').css({"transition": "width 0s linear"}); 
            var z_idx = z_idx_save = $drag.css('z-index');
            drg_w = $drag.outerWidth(),
            pos_x = $drag.offset().left + drg_w - e.pageX;
            offset = e.pageX + pos_x - drg_w - (positionOffset),
            $drag.css('z-index', 10001);
            e.preventDefault(); // disable selection
            opt.seekStateBus.push({cmd:'_seekStartRequest'});
        };

        var mouseMoveHandler = function(e) {
                var $drag = $($el);
                if(!$drag.hasClass('draggable')){
                  return;
                }
                width = $(opt.seekBar).width()+borderWidth*2;
                newOffset = e.pageX + pos_x - drg_w;
                if( 2*(newOffset-offset)+width>0  && 2*(newOffset-offset)-width<0 ){
                  
                  positionOffset = newOffset-offset;
                  $drag.offset({
                      left:newOffset
                  });
                  //send the user's seek request to the state bus
                  opt.seekStateBus.push({cmd:'_seekRequest',value:(width/2+positionOffset)/width});
                }
                e.stopPropagation(); //prevent page movement
            };

        opt.seekStateBus.onValue(function(e){
        if(e.cmd){
          switch(e.cmd){
            case "uiResized":
              positionOffset = positionOffset * $(opt.seekBar).width()/width;
              width=$(opt.seekBar).width();
            //  $('.controlSbar div').css({"transition": "width 0s linear"}); 
              $($el).css({
                      left:positionOffset
                  });
            //  $('.controlSbar div').css({"transition": "width 1s linear"}); 
              break;
            case "_setPlayPosition":
              if(e.value){
                if(e.value>=0 && e.value<1){//percentage case
                  width=$(opt.seekBar).width();
                  positionOffset = e.value * width - width/2;
                  $($el).css({
                      left:positionOffset
                  });
                }
              }
              break;  
          }
        }
        });

        $el.css('cursor', opt.cursor).on("mousedown", mouseDownHandler).parents("html").on("mouseup", mouseUpHandler).on("mousemove", mouseMoveHandler);
        return $el;

    }
})($);