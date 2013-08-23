var $ = require('jquery');
var _ = require('../util/objectscore.coffee'); // require('underscore');
var Bacon = require('baconjs');
var IScroll = require('iscroll');

var util = require('util');
require('./pagetransition.js');


var sourceScroll;
var mediatypScroll;
var targetScroll;
var queueScroll;
var horizontalScroll;
var contentScroll;

$(window).resize(function() {
  calcSize();
});

$(document).ready(function() {
  $('.albumhead').click(function() {
    if ($(this).next('ul').is(":visible")) {
      $(this).children('img').attr("src", "images/down_big.svg");
    } else {
      $(this).children('img').attr("src", "images/up_big.svg");
    }
    $(this).next('ul').toggle();
    contentScroll.refresh();
  });

  calcSize();
  $(".topfadeout").hide();
});

function calcSize() {
  var width = $(window).innerWidth();
  var height = $(window).innerHeight();
  var buttonWidth;
  if (width <= 400) {
    buttonWidth = width * 0.9 / 2;
    $('.buttonlist li').outerHeight(buttonWidth / 1.6);
    $('#horizontalscroller').width(buttonWidth * 8);
  } else if (width < 600) {
    buttonWidth = width * 0.9 / 3;
    $('.buttonlist li').outerHeight(buttonWidth / 1.6);
    $('#horizontalscroller').width(buttonWidth * 8);
  } else if (width < 960) {
    buttonWidth = width * 0.9 / 4;
    $('.buttonlist li').outerHeight(buttonWidth / 1.6);
    $('#horizontalscroller').width(buttonWidth * 8);
  } else if (width < 1200) {
    buttonWidth = width * 0.9 / 6;
    $('.buttonlist li').outerHeight(buttonWidth / 1.6);
    $('#horizontalscroller').width(buttonWidth * 8);
  } else {
    buttonWidth = width * 0.9 / 8;
    $('.buttonlist li').outerHeight(buttonWidth / 1.6);
    $('#horizontalscroller').width(buttonWidth * 8);
  }

  //vertikal zentrieren
  $('#horizontalwrapper').height(height * 0.9);
  $('#horizontalwrapper').css('margin-top', -(height * 0.45));
 
  $('#verticalwrapper').height(height * 0.9 - 20);
  $('#playmodewrapper li').outerHeight((height * 0.45) - 5);
  $('#queuewrapper').height( $('#verticalwrapper').height() - $('.queuecontrols').height() );
  $('#queuetopfadeout').css('margin-top', '59px');

}

function loaded() {
  //sourceScroll = new IScroll('#sourcewrapper', {snap: 'li', momentum: false});
  // mediatypScroll = new IScroll('#mediatypwrapper', {snap: 'li', momentum: false});
  //contentScroll = new IScroll('#contentwrapper', {snap: 'li', momentum: false});
  //targetScroll = new IScroll('#targetwrapper', {snap: 'li', momentum: false});
  queueScroll = new IScroll('#queuewrapper', {snap: 'li', momentum: false});
  queueScroll.on('scrollEnd', function() {checkScrollFadeout(this);});
  horizontalScroll = new IScroll('#horizontalwrapper', {snap: 'ul', scrollX: true, scrollY: false, momentum: false});
}

function checkScrollFadeout(scroller) {
  if(scroller.y >= (0)){
    $('#queuetopfadeout').hide();
    console.log(">10 = hide");
  }else{
    $('#queuetopfadeout').show();
    console.log("!>10 = show");
  }

  if(scroller.y <= ($('#queuewrapper').height() - $('#queuelist').height())){
    $('#queuebottomfadeout').hide();
  }else{
    $('#queuebottomfadeout').show();

  }
}



document.addEventListener('touchmove', function(e) {
  e.preventDefault();
}, false);

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(loaded, 800);
}, false);

function ListView(items, selection, list, wrapper) {
  var self = this;
  var scroll = undefined;

  this.refresh = function () {
    if ($(list).children().length > 0) {
      if (typeof scroll === 'undefined') {
        scroll = new IScroll(wrapper, {snap: 'li', momentum: false});
      }
      scroll.refresh();
    }
  };

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
      var id = $item.data('id');
      return (_.ocontains(selection, id) ? _.odifference : _.ounion)(selection, [id]);
    };
  }));

  selection.onValue(function (selection) {
    $('li', list).each(function () {
      var $item = $(this);
      var id = $item.data('id');
      $item.toggleClass('selected', _.ocontains(selection, id));
    });
  });
}

util.inherits(DeviceListView, ListView);
function DeviceListView(items, selection, list, wrapper) {
  this.htmlify = function (device) {
    return '<li><img src="images/tv.svg"><p>' + device.address() + '</p></li>';
  };

  this.identify = function (device) {
    return device.address();
  };

  ListView.call(this, items, selection, list, wrapper);
}

util.inherits(SourceListView, DeviceListView);
function SourceListView(viewModel) {
  DeviceListView.call(this, viewModel.sources(), viewModel.selectedSources(), '#sourcelist', '#sourcewrapper');
}

util.inherits(CategoryListView, ListView);
function CategoryListView(viewModel) {
  this.htmlify = function (category) {
    return '<li><img src="' + category.image + '"><p>' + category.title + '</p></li>';
  };

  this.identify = function (category) {
    return category.id;
  };

  ListView.call(this, viewModel.categories(), viewModel.selectedCategories(), '#mediatyplist', '#mediatypwrapper');
}

util.inherits(ContentListView, ListView);
function ContentListView(viewModel) {
  this.htmlify = function (value) {
    return '<li><p>' + value.item.title + '</p></li>';
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

  ListView.call(this, viewModel.content(), viewModel.selectedContent(), '#contentlist', '#contentwrapper');
}

util.inherits(TargetListView, DeviceListView);
function TargetListView(viewModel) {
  DeviceListView.call(this, viewModel.targets(), viewModel.selectedTargets(), '#targetlist', '#targetwrapper');
}

function BrowserView(viewModel) {
  var sourceListView = new SourceListView(viewModel);
  var categoryListView = new CategoryListView(viewModel);
  var contentListView = new ContentListView(viewModel);
  var targetListView = new TargetListView(viewModel);

  viewModel.play().plug($('#play').asEventStream('click').map());

  this.getControlsSelector = function(){
    return ".queuecontrols";
  }
}

module.exports = BrowserView;
