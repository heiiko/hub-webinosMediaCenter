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

$(window).resize(function() {
  //calcSize();
});

$(document).ready(function() {
  //$('.albumToggleIcon').click(function() {
   // if ($(this).parent("div").next('ul').is(":visible")) {
   //   $(this).attr("src", "images/arrow_big_down.svg");
   // } else {
   //   $(this).attr("src", "images/arrow_big_up.svg");
   // }
   // $(this).parent().next('ul').slideToggle(250, function() { contentScroll.refresh(); });
  //});
  //$('.albumsonglist > li > img, #contentlist > li > img').click(function() {
  //  var src = ($(this).attr('src') === 'images/add.svg')
  //          ? 'images/add_blue.svg'
  //          : 'images/add.svg';
  //       $(this).attr('src', src);
  //});
  //$('#queuelist > li > img').click(function() {
  //  var src = ($(this).attr('src') === 'images/remove.svg')
  //         ? 'images/remove_blue.svg'
  //          : 'images/remove.svg';
  //       $(this).attr('src', src);
  //});

  //calcSize();
  //$(".topfadeout").hide();
  //$("#playmodebottomfadeout").hide();
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
  $('#queuetopfadeout').css('margin-top', $('.queuecontrols').outerHeight());

  $('.searchfield input').width($('.searchfield').width() - 60);
  $('#contentwrapper').height( $('#verticalwrapper').height() - $('.searchfield').height() );

}

function loaded() {
  // sourceScroll = new IScroll('#sourcewrapper', {snap: 'li', momentum: false});
  // mediatypScroll = new IScroll('#mediatypwrapper', {snap: 'li', momentum: false});
  // contentScroll = new IScroll('#contentwrapper', {snap: '#contentlist > li', momentum: false});
  // targetScroll = new IScroll('#targetwrapper', {snap: 'li', momentum: false});
  //queueScroll = new IScroll('#queuewrapper', {snap: 'li', momentum: false});
  //queueScroll.on('scrollEnd', function() {checkScrollFadeout(this);});
  //horizontalScroll = new IScroll('#horizontalwrapper', {snap: 'ul', scrollX: true, scrollY: false, momentum: false});
}

function checkScrollFadeout(scroller) {
  if(scroller.y >= (0)){
    $('#queuetopfadeout').hide();
  }else{
    $('#queuetopfadeout').show();
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

function ListView(items, selection, list, wrapper, fadeout) {
  var self = this;
  var scroll = undefined;

  this.refresh = function () {
    if ($(list).children().length > 0) {
      if (typeof scroll === 'undefined') {
        scroll = new IScroll(wrapper, {snap: 'li', momentum: false});
        scroll.on('scrollEnd', function(){
          if(scroll.y >= 0){
            //$(fadeout + 'topfadeout').hide();
          }else{
            //$(fadeout + 'topfadeout').show();
          }
          if(scroll.y <= ($(wrapper).height() - $(list).height())){
            //$(fadeout + 'bottomfadeout').hide();
          }else{
            //$(fadeout + 'bottomfadeout').show();
          }
        });
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
function DeviceListView(items, selection, list, wrapper, fadeout) {
  this.htmlify = function (device) {
    return '<li><img class="device-image" src="images/' + device.type() + '.svg"><div class="device-name">' + device.address() + '</div><div class="device-type">' + device.type().charAt(0).toUpperCase() + device.type().slice(1) + '</div></li>';
  };

  this.identify = function (device) {
    return device.address();
  };

  ListView.call(this, items, selection, list, wrapper, fadeout);
}

util.inherits(SourceListView, DeviceListView);
function SourceListView(viewModel) {
  DeviceListView.call(this, viewModel.sources(), viewModel.selectedSources(), '#sourcelist', '#sourcewrapper', '#source');
}

util.inherits(CategoryListView, ListView);
function CategoryListView(viewModel) {
  this.htmlify = function (category) {
    return '<li><img class="category-image" src="' + category.image + '"><p>' + category.title + '</p></li>';
  };

  this.identify = function (category) {
    return category.id;
  };

  ListView.call(this, viewModel.categories(), viewModel.selectedCategories(), '#mediatyplist', '#mediatypwrapper', '#category');
}

util.inherits(ContentListView, ListView);
function ContentListView(viewModel) {
  this.htmlify = function (value) {
    return '<li><p>'+((typeof value.item.type=='string' && value.item.type.toLowerCase().indexOf("image")==0)?('<img src="' + value.item.thumbnailURIs[0] + '">'):(value.item.title)) + '</p><img src="images/add.svg"></li>';
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

util.inherits(TargetListView, DeviceListView);
function TargetListView(viewModel) {
  DeviceListView.call(this, viewModel.targets(), viewModel.selectedTargets(), '#targetlist', '#targetwrapper', '#target');
}

function BrowserView(viewModel) {
  var sourceListView = new SourceListView(viewModel);
  //var categoryListView = new CategoryListView(viewModel);
  //var contentListView = new ContentListView(viewModel);
  var targetListView = new TargetListView(viewModel);

  //viewModel.play().plug($('#play').asEventStream('click').map());

  //this.getControlsSelector = function(){
  //  return ".queuecontrols";
  //};
}

module.exports = BrowserView;
