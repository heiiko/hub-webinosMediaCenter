var $ = require('jquery');
var _ = require('../util/objectscore.coffee'); // require('underscore');
var Bacon = require('baconjs');
var IScroll = require('iscroll');

var util = require('util');


var sourceScroll;
var mediatypScroll;
var targetScroll;
var queueScroll;
var horizontalScroll;
var contentScroll;

var refreshListsCB = [], buttonHeight=0;

$(window).resize(function() {
  calcSize();
});

$(document).ready(function() {
  $('.albumToggleIcon').click(function() {
    if ($(this).parent("div").next('ul').is(":visible")) {
      $(this).attr("src", "images/arrow_big_down.svg");
      $(this).parent("div").next('ul').children('li').removeClass('nav_co');
    } else {
      $(this).attr("src", "images/arrow_big_up.svg");
      $(this).parent("div").next('ul').children('li').addClass('nav_co');
    }
    $(this).parent().next('ul').slideToggle(250, function() { contentScroll.refresh(); });
  });

  $('#queuelist > li').click(function() {
    var src = ($(this).children('.selectIcon').attr('src') === 'images/remove.svg')
            ? 'images/remove_blue.svg'
            : 'images/remove.svg';
         $(this).children('.selectIcon').attr('src', src);
  });


  $(".topfadeout").hide();
  $(".bottomfadeout").hide();
});

function calcSize() {
  var width = $(window).innerWidth();
  var height = $(window).innerHeight();
  var buttonWidth;
  if (width <= 400) {
    buttonWidth = width * 0.9 / 2;
    buttonHeight = buttonWidth / 1.6;
    $('.buttonlist li').height(buttonHeight);
    $('#horizontalscroller').width(buttonWidth * 8);
  } else if (width < 600) {
    buttonWidth = width * 0.9 / 3;
    buttonHeight = buttonWidth / 1.6;
    $('.buttonlist li').height(buttonHeight);
    $('#horizontalscroller').width(buttonWidth * 8);
  } else if (width < 960) {
    buttonWidth = width * 0.9 / 4;
    buttonHeight = buttonWidth / 1.6;
    $('.buttonlist li').height(buttonHeight);
    $('#horizontalscroller').width(buttonWidth * 8);
  } else if (width < 1200) {
    buttonWidth = width * 0.9 / 6;
    buttonHeight = buttonWidth / 1.6;
    $('.buttonlist li').height(buttonHeight);
    $('#horizontalscroller').width(buttonWidth * 8);
  } else {
    buttonWidth = width * 0.9 / 8;
    buttonHeight = buttonWidth / 1.6;
    $('.buttonlist li').height(buttonHeight);
    $('#horizontalscroller').width(buttonWidth * 8);
  }

  console.log("w:"+width + " h:"+height + " bw:"+buttonWidth + " bh:"+$('.buttonlist li').outerHeight());

  //vertikal zentrieren
  $('#horizontalwrapper').height(height * 0.9);
  $('#horizontalwrapper').css('margin-top', -(height * 0.45));

  $('#verticalwrapper').height(height * 0.9 - 20);
  $('#playmodewrapper li').outerHeight(((height-26) * 0.45));

  $('#queuewrapper').height( $('#verticalwrapper').height() - $('.queuecontrols').outerHeight() );
  $('#queuetopfadeout').css('margin-top', $('.queuecontrols').outerHeight());

  $('.searchfield').width((buttonWidth*2)-6);
  $('.searchfield input').width($('.searchfield').width() - 60);
  $('#contentwrapper').height( $('#verticalwrapper').height() - ($('.searchfield').height() + 10));
  $('#contenttopfadeout').css('margin-top', $('.searchfield').height()+10);

  $('.textContent > p').outerWidth($('#contentlist').width() - 25);

  refreshListsCB.forEach(function(listRefreshCB){
    listRefreshCB();
  });
}

function loaded() {
  // sourceScroll = new IScroll('#sourcewrapper', {snap: 'li', momentum: false});
  // mediatypScroll = new IScroll('#mediatypwrapper', {snap: 'li', momentum: false});
  // contentScroll = new IScroll('#contentwrapper', {snap: '#contentlist > li', momentum: false});
  // targetScroll = new IScroll('#targetwrapper', {snap: 'li', momentum: false});
  // queueScroll = new IScroll('#queuewrapper', {snap: 'li', momentum: false});
  // queueScroll.on('scrollEnd', function() {checkScrollFadeout(this);});
  horizontalScroll = new IScroll('#horizontalwrapper', {snap: '.listhead', scrollX: true, scrollY: false, momentum: false});
}

document.addEventListener('touchmove', function(e) {
  e.preventDefault();
}, false);

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(loaded, 800);
}, false);

function ListView(items, selection, list, wrapper, fadeout) {
  var self = this;
  var scroll = undefined;

  this.refresh = function () {
    if ($(list).children().length > 0) {
      if (typeof scroll === 'undefined') {
        scroll = new IScroll(wrapper, {snap: list +' li', momentum: false});
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
      scroll.options.snap = document.querySelectorAll(list +' li');
      scroll.refresh();
    }
  };

  refreshListsCB.push(self.refresh);

  items.onValue(function (items) {
    var $list = $(list);
    $list.empty();

    _.each(items, function (item) {
      var $item = $(self.htmlify(item));
      var id = self.identify(item);
      $item.data('id', id);
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

  selection.apply($(list).asEventStream('click').map(function (event) {
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
          $item.children('.selectIcon').attr('src', 'images/add_blue.svg');
        }else{
          $item.children('.selectIcon').attr('src', 'images/add.svg');
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
    return '<li class="nav_sl" style="height:'+buttonHeight+'px"><img src="images/tv.svg"><p>' + device.address() + '</p></li>';
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
    return '<li class="nav_tl" style="height:'+buttonHeight+'px"><img src="images/tv.svg"><p>' + device.address() + '</p></li>';
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
      html = '<li class="textContent nav_qu"><p>' + value.item.title + '</p>'
    }
    html += '<img class="selectIcon" src="images/remove.svg"></li>';
    return html;
  };

  this.identify = function (value) {
    return value.link;
  };

  ListView.call(this, viewModel.queue(), viewModel.selectedQueue(), '#queuelist', '#queuewrapper', '#queue');
}

function NavigationView (viewModel) {
  var columns = [".nav_sl", ".nav_ca", ".nav_co", ".nav_tl", ".nav_pm", ".nav_qu"];
  var curCol = 0;
  var curRow = [0, 0, 0, 0, 0, 0];
  var navVisible = false;
  var timeoutHandle;

  $(document).keydown(function(e) {
    switch (e.keyCode) {
      case 37:
        Navigate('left');
        navlog("nav_left");
        return false;
      case 38:
        Navigate('up');
        navlog("nav_up");
        return false;
      case 39:
        Navigate('right');
        navlog("nav_right");
        return false;
      case 40:
        Navigate('down');
        navlog("nav_down");
        return false;
      case 13:
        if(navVisible)
          $(columns[curCol]+".focus").click();
        return false;
    }
  });

  function navlog(direction) {
    console.log(direction + "  col:" + curCol + " row:" + curRow);
  }


  function Navigate(direction) {
    window.clearTimeout(timeoutHandle);
    if(navVisible === false){
      navVisible = true;
    }else{
      $(columns[curCol]+".focus").removeClass('focus');
      switch(direction){
        case 'down':
        if(curRow[curCol] < $(columns[curCol]).length-1)
          curRow[curCol]++;
          break;
        case 'up':
        if(curRow[curCol] > 0)
          curRow[curCol]--;
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
            window.toggleMainmenu();
          break;
      }
    }
    if($(columns[curCol]).length-1 < curRow[curCol]){
      curRow[curCol] = 0;
    }
    $(columns[curCol]).eq(curRow[curCol]).addClass('focus');
    startNavVisibleTimeout();
  }

  function startNavVisibleTimeout(){
    timeoutHandle = window.setTimeout(function(){
      navVisible=false;
      $(columns[curCol]).eq(curRow[curCol]).removeClass('focus');
    }, 5000);
  }
}

function BrowserView(viewModel) {
  var sourceListView = new SourceListView(viewModel);
  var categoryListView = new CategoryListView(viewModel);
  var contentListView = new ContentListView(viewModel);
  var targetListView = new TargetListView(viewModel);
  var queueListView = new QueueListView(viewModel);

  var navigationView = new NavigationView(viewModel);

  viewModel.prepend().plug($('#prepend').asEventStream('click'));
  viewModel.append().plug($('#append').asEventStream('click'));

  this.getControlsSelector = function(){
    return ".queuecontrols";
  };

  calcSize();
}

module.exports = BrowserView;
