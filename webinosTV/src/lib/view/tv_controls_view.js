var $ = require('jquery');
var _ = require('underscore');

var Bacon = require('baconjs');
var gotoPageById = require('./pagetransition.js');

function TVControlsView(parent, config, viewModel, queue, selectedQueue) {
  var self = this;
  parent = $(parent) || $('body');
  config = _.extend({
    style: 'slim',
    remove: true,
    remote: false,
    fullscreen: false,
    local: false,
    highdef: false,
    select: true,
    navclass: 'nav_qu'
  }, config || {});

  var buttonCount = 5;
  // if (config.remove)
  //   buttonCount++;
  if (config.fullscreen)
    buttonCount++;
  if (config.remote)
    buttonCount++;
  if (config.highdef)
    buttonCount++;

  var cprev = $('<div id="tv_previous" class="controlButton controlPrev ' + config.navclass + '">');
  var crewd = $('<div id="tv_rewind" class="controlButton controlRewd ' + config.navclass + '">');
  var cplay = $('<div id="tv_play" class="controlButton controlPlay ' + config.navclass + '">');
  var cfwrd = $('<div id="tv_forward" class="controlButton controlFwrd ' + config.navclass + '">');
  var cnext = $('<div id="tv_next" class="controlButton controlNext ' + config.navclass + '">');
  var cfull = $('<div id="tv_fullscreen" class="controlButton controlFull ' + config.navclass + '">');
  var cremote = $('<div id="tv_fullscreen" class="controlButton controlFull ' + config.navclass + '">');
  var chres = $('<div id="tv_highress" class="controlButton controlHres ' + config.navclass + '">');
  var csbar = $('<div id="tv_controlbar" class="controlSbar"><span id="tv_elapsed" class="elapsed"></span><div></div><span id="tv_remaining" class="remaining"></span></div>');
//  var ctime = $('<div class="controlTime"><div class="controlTimeSchnippel"></div><span>1:00</span></div>');
  var ctime = $('<div id="tv_controltime" class="controlTime"><div class="controlTimeSchnippel"></div></div>');

  var cselall = $('<div id="tv_selectAll" class="textButton ' + config.navclass + '">Select All</div>');
  var cdeselall = $('<div id="tv_deselectAll" class="textButton ' + config.navclass + '">Deselect All</div>');
  var cdele = $('<div id="tv_delete" class="textButton controlDele disabled ' + config.navclass + '">Delete</div>');

  var controls = $('#mobileControlContainer');
  var container = $('<div id="mobileControlButtons" class="controlButtons">');
  var container2 = $('<div id="mobileControlButtons2" class="controlButtons">');
  var nowPlayingItem = $('<div class="controlItemInfo"><div class="itemtitle"></div><div class="itemartist"></div></div>');

  controls.empty();
  container.append([cprev, crewd, cplay, cfwrd, cnext]);

  if (config.fullscreen || config.local) {
    container.append(cfull);

    cfull.click( function() {
      gotoPageById('#renderer');
    });
  }
  if (config.remote && ! config.local) {
    container.append(cremote);

    cremote.click( function() {
      gotoPageById('#mobilecontroller');
    });
  }
  if (config.highdef)
    container.append(chres);

  if (config.select) {
    container2.append(cselall);
    container2.append(cdeselall);
    cselall.click(function() {
      selectedQueue.apply(queue.map(function(queue) {
        return function(selectedQueue) {
          return _.ounion(_.map(queue, function(value) {
            return value.link;
          }));
        };
      }));
    });
    cdeselall.click(function() {
      selectedQueue.apply(queue.map(function(queue) {
        return function(selectedQueue) {
          return [];
        };
     }));
    });
  }
  if (config.remove) {
    container2.append(cdele);
    viewModel.remove().plug(cdele.asEventStream('click'));
  }

  controls.append([nowPlayingItem, container2, container, csbar, ctime]);

  viewModel.playOrPause().plug(cplay.asEventStream('click'));
  viewModel.previous().plug(cprev.asEventStream('click'));
  viewModel.next().plug(cnext.asEventStream('click'));
  viewModel.rewind().plug(crewd.asEventStream('click').map(undefined));
  viewModel.forward().plug(cfwrd.asEventStream('click').map(undefined));

  // $('.controlSbar div', controls).css({transition: 'width 1s linear'});
  //$('.controlButton', controls).css({width: (100 / buttonCount) + '%'});

  var length = 0, last = 0;
  var artists = '', title = '';

  function play() {
    $(cplay).removeClass('controlPlay');
    $(cplay).addClass('controlPaus');
    $('#mobilequeuelist li.nowplaying .status').addClass('playingitem').show();
    $('#mobilequeuelist li.nowplaying .status').removeClass('pauseditem').show();
    nowPlayingItem.children('.itemtitle').text(title);
    nowPlayingItem.children('.itemartist').text(artists);
  }

  function pause() {
    $(cplay).removeClass('controlPaus');
    $(cplay).addClass('controlPlay');
    $('#mobilequeuelist li.nowplaying .status').removeClass('playingitem').show();
    $('#mobilequeuelist li.nowplaying .status').addClass('pauseditem').show();
    nowPlayingItem.children('.itemtitle').text(title);
    nowPlayingItem.children('.itemartist').text(artists);
  }

  function getFormatedTime(ms) {
    var totalSec = ms / 1000;
    var hours = parseInt(totalSec / 3600) % 24;
    var minutes = parseInt(totalSec / 60) % 60;
    var seconds = Math.round(totalSec % 60);

    return hours ? ((hours < 10 ? "0" + hours : hours) + ":") : "" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
  }

  function update(relative) {
    if (typeof relative !== 'undefined') {
      relative = Math.round(relative * 1000) / 1000;
    } else {
      relative = last;
    }

    $('#tv_controlbar div', controls).css({width: relative * $('.controlSbar', controls).width()});
    //$('.controlTime span', controls).text((length) ? getFormatedTime(Math.round(relative * length)) : "-");
    $('#tv_elapsed', controls).text((length) ? getFormatedTime(Math.round(relative * length)) : "");
    $('#tv_remaining', controls).text((length) ? getFormatedTime(length - Math.round(relative * length)) : "");

    last = relative;
  }

  var seeking = false;
  function seek(value) {
    if (seeking)
      return;

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
  bus.onValue(function(event) {
    switch (event.type) {
      case 'resize':
        // $('.controlSbar div', controls).css({transition: 'width 0.0s linear'});
        update();
        // $('.controlSbar div', controls).css({transition: 'width 1s linear'});
        break;
      case 'start':
        seeking = true;
        break;
      case 'seek':
        update(event.content.relative);
        // dont flood with seek events
        if (timer)
          clearTimeout(timer);
        timer = setTimeout(function(relative) {
          viewModel.seek().push(relative);
        }, 200, event.content.relative);
        break;
      case 'end':
        seeking = false;
        break;
    }
  });

  var seeker = $('#mobilecontroltime', controls).drags({
    seekBar: $('#mobilecontrolbar', controls),
    seekStateBus: bus
  });

  viewModel.state().onValue(function(state) {
    if (state === '<no-state>') {
      seek(0);
      pause();
    } else if (state.playback.current && !state.playback.stopping) {
      //TODO perhaps there are more efficient ways of doing this
      $('#mobilequeuelist div.status').hide();
      $('#mobilequeuelist').children('.contentlistitem').removeClass('nowplaying');
      $($('#mobilequeuelist').children('.contentlistitem')[state.index]).addClass('nowplaying');

      //TODO: move this nasty stuff away from view
      if (typeof state.queue !== 'undefined' && (state.queue[state.index].item.type.toLowerCase().indexOf("audio") !== -1 || state.queue[state.index].item.type.toLowerCase().indexOf("video") !== -1)) {
        self.setControlsForMediaType('video');
        if (typeof state.queue[state.index].item.duration === "number") {
            length = state.queue[state.index].item.duration;
            artists = state.queue[state.index].item.artists;
            title = state.queue[state.index].item.title;
        }
        else if (state.queue[state.index].item.duration && state.queue[state.index].item.duration.length) {
            var itemlengthParsed = 0, itemlength = (state.queue[state.index].item.duration instanceof Array) ? state.queue[state.index].item.duration[0] : state.queue[state.index].item.duration;
            itemlength = itemlength.split(" ");
            for (var i = 0; itemlength.length > i; i++) {
              if (itemlength[i].indexOf("h") !== -1) {
                itemlengthParsed += 60 * 60 * parseInt(itemlength[i]);
              }
              if (itemlength[i].indexOf("mn") !== -1) {
                itemlengthParsed += 60 * parseInt(itemlength[i]);
              }
              if (itemlength[i].indexOf("s") !== -1 && itemlength[i].indexOf("ms") === -1) {
                itemlengthParsed += parseInt(itemlength[i]);
              }
              if (itemlength[i].indexOf("ms") !== -1) {
                itemlengthParsed += parseInt(itemlength[i]) / 1000;
              }
            }
            ;
            length = itemlengthParsed * 1000;
            state.queue[state.index].item.duration = length;
        }
      }
      else if (typeof state.queue !== 'undefined' && (state.queue[state.index].item.type.toLowerCase().indexOf("image") !== -1)) {
        self.setControlsForMediaType('image');
        artists = '';
        title = state.queue[state.index].item.title;
      }

      if (state.playback.playing) {
        play();
      } else {
        pause();
      }

      seek(length * state.playback.relative);
    } else {
      seek(0);
      pause();
    }
  });
}

TVControlsView.prototype.setControlsForMediaType = function(type) {
  switch (type) {
    case 'image':
      $('#mobileControlButtons').addClass('controlsForImage');
      $('#mobilecontrolbar').addClass('controlsForImage');
      $('#mobilecontroltime').addClass('controlsForImage');
      break;
    case 'channels':
    case 'audio':
    case 'video':
      $('#mobileControlButtons').removeClass('controlsForImage');
      $('#mobilecontrolbar').removeClass('controlsForImage');
      $('#mobilecontroltime').removeClass('controlsForImage');
      break;
    default:
      console.warn("Unknown type");
      break;
  }
};


module.exports = TVControlsView;

//draggable seekbar plugin
(function($) {
  $.fn.drags = function(opt) {

    opt = $.extend({handle: "", cursor: "move", seekStateBus: null}, opt);

    var z_idx_save = 0, width = 0, offset = 0, positionOffset = 0, drg_w = 0, pos_x = 0;

    var borderWidth = parseInt($(opt.seekBar).css("border-width"), 10);

    $(opt.seekBar).width();

    if (opt.handle === "") {
      var $el = this;
    } else {
      var $el = this.find(opt.handle);
    }

    var mouseUpHandler = function() {
      if (!$($el).hasClass('draggable')) {
        return;
      }
      // $(opt.seekBar).css({"transition": "width 1s linear"});
      $($el).removeClass('draggable').css('z-index', z_idx_save);
      if (opt.handle === "") {
        $($el).removeClass('draggable');
      } else {
        $($el).removeClass('active-handle').parent().removeClass('draggable');
      }
      opt.seekStateBus.push({type: 'end'});
      if ((width / 2 + positionOffset) / width) {
        opt.seekStateBus.push({type: 'seek', content: {relative: (width / 2 + positionOffset) / width}});
      }
    };

    var mouseDownHandler = function(e) {
      if (opt.handle === "") {
        var $drag = $($el).addClass('draggable');
      } else {
        var $drag = $($el).addClass('active-handle').parent().addClass('draggable');
      }
      // $(opt.seekBar).css({"transition": "width 0s linear"});
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
      if (!$drag.hasClass('draggable')) {
        return;
      }
      width = $(opt.seekBar).width() + borderWidth * 2;
      newOffset = e.pageX + pos_x - drg_w;
      if (2 * (newOffset - offset) + width > 0 && 2 * (newOffset - offset) - width < 0) {

        positionOffset = newOffset - offset;
        $drag.offset({
          left: newOffset
        });
        //send the user's seek request to the state bus
        opt.seekStateBus.push({type: 'seek', content: {relative: (width / 2 + positionOffset) / width}});
      }
      e.stopPropagation(); //prevent page movement
    };

    opt.seekStateBus.onValue(function(e) {
      if (e.type) {
        switch (e.type) {
          case "resize":
            positionOffset = positionOffset * $(opt.seekBar).width() / width;
            width = $(opt.seekBar).width();
            // $(opt.seekBar).css({"transition": "width 0s linear"});
            $($el).css({
              left: positionOffset
            });
            // $(opt.seekBar).css({"transition": "width 1s linear"});
            break;
          case "set":
            if (e.content.relative) {
              if (e.content.relative >= 0 && e.content.relative < 1) {//percentage case
                width = $(opt.seekBar).width();
                positionOffset = e.content.relative * width - width / 2;
                $($el).css({
                  left: positionOffset
                });
              }
            }
            break;
        }
      }
    });

    $el.css('cursor', opt.cursor).on("mousedown", mouseDownHandler).parents("html").on("mouseup", mouseUpHandler).on("mousemove", mouseMoveHandler);
    return $el;

  };
})($);
