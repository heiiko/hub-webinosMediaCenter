var $ = require('jquery');
var _ = require('underscore');

var Bacon = require('baconjs');

function ControlsView(parent, config, viewModel) {
  parent = $(parent) || $('body');
  config = _.extend(config || {}, {
    style: 'slim',
    remove: true,
    fullscreen: false,
    highdef: false
  });

  var buttonCount = 5;
  if (config.remove) buttonCount++;
  if (config.fullscreen) buttonCount++;
  if (config.highdef) buttonCount++;

  var cprev = $('<div class="controlButton controlPrev nav_qu">');
  var crewd = $('<div class="controlButton controlRewd nav_qu">');
  var cplay = $('<div class="controlButton controlPlay nav_qu">');
  var cfwrd = $('<div class="controlButton controlFwrd nav_qu">');
  var cnext = $('<div class="controlButton controlNext nav_qu">');
  var cdele = $('<div class="controlButton controlDele nav_qu">');
  var cfull = $('<div class="controlButton controlFull nav_qu">');
  var chres = $('<div class="controlButton controlHres nav_qu">');
  var csbar = $('<div class="controlSbar"><div></div></div>');
  var ctime = $('<div class="controlTime"><div class="controlTimeSchnippel"></div><span>1:00</span></div>');

  var controls = $('<div class="' + (config.style || 'slim') + ' controlContainer">');
  var container = $('<div class="controlButtons">');

  container.append([cprev, crewd, cplay, cfwrd, cnext]);
  if (config.remove) container.append(cdele)
  if (config.fullscreen) container.append(cfull);
  if (config.highdef) container.append(chres);
  controls.append([container, csbar, ctime]);

  viewModel.playOrPause().plug(cplay.asEventStream('click'));
  viewModel.previous().plug(cprev.asEventStream('click'));
  viewModel.next().plug(cnext.asEventStream('click'));
  viewModel.rewind().plug(crewd.asEventStream('click').map(undefined));
  viewModel.forward().plug(cfwrd.asEventStream('click').map(undefined));
  viewModel.remove().plug(cdele.asEventStream('click'));

  $(parent).append(controls);

  // $('.controlSbar div').css({transition: 'width 1s linear'});
  $('.controlButton', controls).css({width: (100 / buttonCount) + '%'});

  var length = 0, last = 0;

  function play() {
    $(cplay).removeClass('controlPlay');
    $(cplay).addClass('controlPaus');
  }

  function pause() {
    $(cplay).removeClass('controlPaus');
    $(cplay).addClass('controlPlay');
  }

  function update(relative) {
    if (typeof relative !== 'undefined') {
      relative = Math.round(relative * 1000) / 1000;
    } else {
      relative = last;
    }

    $('.controlSbar div').css({width: relative * $('.controlSbar').width()});
    $('.controlTime span').text(Math.round(relative * length / 1000));

    last = relative;
  }

  var seeking = false;
  function seek(value) {
    if (seeking) return;

    var relative = 0;

    if (value >= 0 && value < 1) {
      relative = value;
    } else if (value > 1) {
      relative = Math.min(1, (value / length));
    }

    update(relative);
    bus.push({type: 'set', content: {relative: relative}});
  }

  var bus = new Bacon.Bus(), timer;
  bus.plug($(window).asEventStream('resize').map({type: 'resize'}));
  bus.onValue(function (event) {
    switch (event.type) {
      case 'resize':
        // $('.controlSbar div').css({transition: 'width 0.0s linear'});
        update();
        // $('.controlSbar div').css({transition: 'width 1s linear'});
        break;
      case 'start':
        seeking = true;
        break;
      case 'seek':
        update(event.content.relative);
        // dont flood with seek events
        if (timer) clearTimeout(timer);
        timer = setTimeout(function (relative) {
          viewModel.seek().push(relative);
        }, 200, event.content.relative);
        break;
      case 'end':
        seeking = false;
        break;
    }
  });

  var seeker = $('.controlTime').drags({
    seekBar: '.controlSbar',
    seekStateBus: bus
  });

  viewModel.state().onValue(function (state) {
    if (state === null) {
      seek(0); pause();
    } else if (state.playback.current) {
      if (state.playback.playing) {
        play();
        length = 120000; // TODO: Get length from `state.queue[0].item`.
      } else {
        pause();
      }

      seek(length * state.playback.relative);
    } else {
      seek(0); pause();
    }
  });
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
            opt.seekStateBus.push({type: 'end'});
            if((width/2+positionOffset)/width){
              opt.seekStateBus.push({type: 'seek', content: {relative: (width / 2 + positionOffset) / width}});
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
            opt.seekStateBus.push({type: 'start'});
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
                  opt.seekStateBus.push({type: 'seek', content: {relative: (width / 2 + positionOffset) / width}});
                }
                e.stopPropagation(); //prevent page movement
            };

        opt.seekStateBus.onValue(function(e){
        if(e.type){
          switch(e.type){
            case "resize":
              positionOffset = positionOffset * $(opt.seekBar).width()/width;
              width=$(opt.seekBar).width();
            //  $('.controlSbar div').css({"transition": "width 0s linear"});
              $($el).css({
                      left:positionOffset
                  });
            //  $('.controlSbar div').css({"transition": "width 1s linear"});
              break;
            case "set":
              if(e.content.relative){
                if(e.content.relative>=0 && e.content.relative<1){//percentage case
                  width=$(opt.seekBar).width();
                  positionOffset = e.content.relative * width - width/2;
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
