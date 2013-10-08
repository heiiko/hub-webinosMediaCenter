var $ = require('jquery');
//require('jquery.fittext');
var _ = require('../util/objectscore.coffee'); // require('underscore');
var address = require('../util/address.coffee')
var Bacon = require('baconjs');
var IScroll = require('iscroll');
var util = require('util');

var ControlsView = require('./controls_view.js');

var buttonHeight=0, tappedOn = 0;

function ListView(items, selection, list, wrapper, fadeout) {
  var self = this;
  this.scroll = undefined;

  this.refresh = function () {
    if ($(list).children().length > 0) {
      if (typeof self.scroll === 'undefined') {
        self.scroll = new IScroll(wrapper, {snap: list +' li', momentum: false});
        // scroll.on('scrollEnd', function(){
        //   if(scroll.y >= 0){
        //     $(fadeout + 'topfadeout').hide();
        //   }else{
        //     $(fadeout + 'topfadeout').show();
        //   }
        //   if(scroll.y <= ($(wrapper).height() - $(list).height())){
        //     $(fadeout + 'bottomfadeout').hide();
        //   }else{
        //     $(fadeout + 'bottomfadeout').show();
        //   }
        // });
      }
      self.scroll.options.snap = document.querySelectorAll(list +' li');
      self.scroll.refresh();

      //Fittext, currently to expensive.
      //$("li p").fitText(0.8);
    }
  };

  items.onValue(function (items) {
    var $list = $(list);
    $list.empty();

    _.each(items, function (item) {
      var $item = $(self.htmlify(item));
      var id = self.identify(item);
      $item.data('id', id);
      if(list === '#targetlist')
        $item.data('local', item.isLocal());
      $list.append($item);
    });
    self.refresh();
  });

  selection.apply(items.map(function (items) {
    return function (selection) {
      return _.ointersection(selection, _.map(items, function (item) {
        return self.identify(item);
      }));
    };
  }));

  $(list).asEventStream('mousedown').merge($(list).asEventStream('touchstart')).onValue(function(){
    tappedOn=Date.now();
  });



  selection.apply($(list).asEventStream('click').merge($(list).asEventStream('touchend')).filter(function(){
    var justClick = (Date.now()-tappedOn<250);
    return justClick;
  }).map(function (event) {
    return function (selection) {
      var $item = $(event.target).closest('li');
      if (!$item.length) return selection;
      var id = $item.data('id');
      return (_.ocontains(selection, id) ? _.odifference : _.ounion)(selection, [id]);
    };
  }));

  selection.onValue(function (selection) {
    $('li', list).each(function () {
      var $item = $(this);
      var id = $item.data('id');

      if($item.hasClass('textContent') || $item.hasClass('imageContent')){
        if(_.ocontains(selection, id)){
          if($item.parent().is('#contentlist')){
            $item.children('.selectIcon').attr('src', 'images/add_blue.svg');
          }else{
            $item.children('.selectIcon').attr('src', 'images/remove_blue.svg');
          }
        }else{
          if($item.parent().is('#contentlist')){
            $item.children('.selectIcon').attr('src', 'images/add.svg');
          }else{
            $item.children('.selectIcon').attr('src', 'images/remove.svg');
          }
        }
      }else{
        $item.toggleClass('selected', _.ocontains(selection, id));
      }
    });
  });
}

util.inherits(SourceListView, ListView);
function SourceListView(viewModel) {
  this.htmlify = function (device) {
    return '<li class="nav_sl" style="height:'+buttonHeight+'px"><img src="images/'+(device.type()?device.type():'all_devices')+'.svg"><p>' + address.friendlyName(device.address()) + '</p></li>';
  };

  this.identify = function (device) {
    return device.address();
  };

  ListView.call(this, viewModel.sources(), viewModel.selectedSources(), '#sourcelist', '#sourcewrapper', '#source');
}

util.inherits(CategoryListView, ListView);
function CategoryListView(viewModel) {
  this.htmlify = function (category) {
    return '<li class="nav_ca" style="height:'+buttonHeight+'px"><img src="' + category.image + '"><p>' + category.title + '</p></li>';
  };

  this.identify = function (category) {
    return category.id;
  };

  ListView.call(this, viewModel.categories(), viewModel.selectedCategories(), '#mediatyplist', '#mediatypwrapper', '#category');
}

util.inherits(ContentListView, ListView);
function ContentListView(viewModel) {
  this.htmlify = function (value) {
    var html;
    if (typeof value.item.type === 'string' && value.item.type.toLowerCase().indexOf('image') === 0) {
      html = '<li class="imageContent nav_co"><img src="' + value.item.thumbnailURIs[0] + '">';
    } else {
      html = '<li class="textContent nav_co"><p>' + value.item.title + '</p>'
    }
    html += '<img class="selectIcon" src="images/add.svg"></li>';
    return html;
  };

  this.identify = function (value) {
    return {
      source: value.source.address(),
      item: {
        id: value.item.id,
        title: value.item.title
      }
    };
  };

  ListView.call(this, viewModel.content(), viewModel.selectedContent(), '#contentlist', '#contentwrapper', '#content');
}

util.inherits(TargetListView, ListView);
function TargetListView(viewModel) {
  this.htmlify = function (device) {
    return '<li class="nav_tl" style="height:'+buttonHeight+'px"><img src="images/'+(device.type()?device.type():'all_devices')+'.svg"><p>' + address.friendlyName(device.address()) + '</p></li>';
  };

  this.identify = function (device) {
    return device.address();
  };

  ListView.call(this, viewModel.targets(), viewModel.selectedTargets(), '#targetlist', '#targetwrapper', '#target');
}

util.inherits(QueueListView, ListView);
function QueueListView(viewModel) {
  this.htmlify = function (value) {
    var html;
    if (typeof value.item.type === 'string' && value.item.type.toLowerCase().indexOf('image') === 0) {
      html = '<li class="imageContent nav_qu"><img src="' + value.item.thumbnailURIs[0] + '">';
    } else {
      html = '<li class="textContent nav_qu"><p>' + value.item.title + '</p>';
    }
    html += '<img class="selectIcon" src="images/remove.svg"></li>';
    return html;
  };

  this.identify = function (value) {
    return value.link;
  };

  ListView.call(this, viewModel.queue(), viewModel.selectedQueue(), '#queuelist', '#queuewrapper', '#queue');
}

function NavigationView (viewModel, listViews) {
  var columns = [".nav_sl", ".nav_ca", ".nav_co", ".nav_tl", ".nav_pm", ".nav_qu"];
  var curCol = 0;
  var curRow = [0, 0, 0, 0, 0, 0];
  var navVisible = false;
  var timeoutHandle;

  viewModel.input().onValue(Navigate);

  function Navigate(direction) {
    window.clearTimeout(timeoutHandle);
    if(navVisible === false){
      navVisible = true;
    }else{
      if (direction !== 'enter') $(columns[curCol]+".focus").removeClass('focus');
      switch(direction){
        case 'down':
        if(curRow[curCol] < $(columns[curCol]).length-1)
          curRow[curCol]++;
          centerFocusedElement();
          break;
        case 'up':
        if(curRow[curCol] > 0)
          curRow[curCol]--;
          centerFocusedElement();
          break;
        case 'right':
          if(curCol < 5)
            curCol++;
          else if(curCol == 5 && curRow[5] < 5)
            curRow[5]++;
          break;
        case 'left':
          if(curCol == 5 && curRow[5] < 6 && curRow[5] > 0)
            curRow[5]--;
          else if(curCol > 0)
            curCol--;
          else if(curCol === 0)
            window.openMainmenu();
          break;
        case 'enter':
          if (navVisible) {
            tappedOn=Date.now();
            $(columns[curCol]+".focus").click();
          }
          break;
      }
    }
    if($(columns[curCol]).length-1 < curRow[curCol]){
      curRow[curCol] = 0;
    }
    $(columns[curCol]).eq(curRow[curCol]).addClass('focus');
    startNavVisibleTimeout();
  }

  function centerFocusedElement(){
    if(curCol != 4 && listViews[curCol].scroll.hasVerticalScroll){
      listViews[curCol].scroll.scrollToElement($(columns[curCol]).eq(curRow[curCol]).get(0), null, null, true);
    }
  }

  function startNavVisibleTimeout(){
    timeoutHandle = window.setTimeout(function(){
      navVisible=false;
      $(columns[curCol]).eq(curRow[curCol]).removeClass('focus');
    }, 5000);
  }

  function navlog(direction) {
    console.log(direction + "  col:" + curCol + " row:" + curRow);
  }
}

function BrowserView(viewModel) {
  var horizontalScroll = new IScroll('#horizontalwrapper', {snap: '.listhead', scrollX: true, scrollY: false, momentum: false});

  var sourceListView = new SourceListView(viewModel);
  var categoryListView = new CategoryListView(viewModel);
  var contentListView = new ContentListView(viewModel);
  var targetListView = new TargetListView(viewModel);
  var queueListView = new QueueListView(viewModel);

  var listViews = [sourceListView, categoryListView, contentListView, targetListView, null, queueListView];
  var navigationView = new NavigationView(viewModel, listViews);

  viewModel.prepend().plug($('#prepend').asEventStream('click').merge($('#prepend').asEventStream('touchend')));
  viewModel.append().plug($('#append').asEventStream('click').merge($('#append').asEventStream('touchend')));

  viewModel.selectedPeer().onValue(function (selectedPeer) {
    $('#peer').text(selectedPeer === '<no-peer>' ? "Select a target" : address.friendlyName(selectedPeer.address()));
  });

  var controlsViewModel = viewModel.controls();
  var controlsView = new ControlsView('.queuecontrols', null, controlsViewModel);

  function calcSize() {
    var width = $(window).innerWidth();
    var height = $(window).innerHeight();
    var buttonWidth;
    if (width <= 400) {
      buttonWidth = width * 0.9 / 2;
      buttonHeight = buttonWidth / 1.6;
    } else if (width < 600) {
      buttonWidth = width * 0.9 / 3;
      buttonHeight = buttonWidth / 1.6;
    } else if (width < 960) {
      buttonWidth = width * 0.9 / 4;
      buttonHeight = buttonWidth / 1.6;
    } else if (width < 1200) {
      buttonWidth = width * 0.9 / 6;
      buttonHeight = buttonWidth / 1.6;
    } else {
      buttonWidth = width * 0.9 / 8;
      buttonHeight = buttonWidth / 1.6;
    }

    $('.buttonlist li').height(buttonHeight);
    $('#horizontalscroller').width(buttonWidth * 8);

    $('#horizontalwrapper').height(height * 0.9);
    $('#horizontalwrapper').css('margin-top', -(height * 0.45));

    $('#verticalwrapper').height(height * 0.9 - 20);
    $('#playmodewrapper li').height(((height-26) * 0.45));

    $('#queuewrapper').height( $('#verticalwrapper').height() - $('.queuecontrols').outerHeight());
    $('#queuetopfadeout').css('margin-top', $('.queuecontrols').outerHeight());

    $('.searchfield').width((buttonWidth*2)-6);
    $('.searchfield input').width($('.searchfield').width() - 60);
    $('#contentwrapper').height( $('#verticalwrapper').height() - ($('.searchfield').height() + 10));
    $('#contenttopfadeout').css('margin-top', $('.searchfield').height()+10);

    $('.textContent > p').outerWidth($('#contentlist').width() - 25);

    sourceListView.refresh();
    categoryListView.refresh();
    contentListView.refresh();
    targetListView.refresh();
    queueListView.refresh();
    horizontalScroll.refresh();
  }

  calcSize();

  $(window).resize(function() {
    calcSize();
  });

  document.addEventListener('touchmove', function(e) {
    e.preventDefault();
  }, false);

  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loaded, 800);
  }, false);
}


module.exports = BrowserView;
