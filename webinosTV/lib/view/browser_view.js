var $ = require('jquery');
var _ = require('../util/objectscore.coffee'); // require('underscore');
var Bacon = require('baconjs');
var IScroll = require('iscroll');

var util = require('util');

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
});


function loaded() {
  // sourceScroll = new IScroll('#sourcewrapper', {snap: 'li', momentum: false});
  // mediatypScroll = new IScroll('#mediatypwrapper', {snap: 'li', momentum: false});
  // contentScroll = new IScroll('#contentwrapper', {snap: '#contentlist > li', momentum: false});
  // targetScroll = new IScroll('#targetwrapper', {snap: 'li', momentum: false});
  //queueScroll = new IScroll('#queuewrapper', {snap: 'li', momentum: false});
  //queueScroll.on('scrollEnd', function() {checkScrollFadeout(this);});
  //horizontalScroll = new IScroll('#horizontalwrapper', {snap: 'ul', scrollX: true, scrollY: false, momentum: false});
}

document.addEventListener('touchmove', function(e) {
  e.preventDefault();
}, false);

//document.addEventListener('DOMContentLoaded', function() {
//  setTimeout(loaded, 800);
//}, false);

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
    return '<li class="device tv-button"><div class="device-image type-' + device.type() + '"></div><div class="device-name">' + device.address() + '</div><div class="device-type">' + device.type().charAt(0).toUpperCase() + device.type().slice(1) + '</div></li>';
  };

  this.identify = function (device) {
    return {
    	address: device.address(),
    	type: device.type()
    };
  };

  ListView.call(this, items, selection, list, wrapper, fadeout);
}

util.inherits(SourceListView, DeviceListView);
function SourceListView(viewModel) {
	DeviceListView.call(this, viewModel.sources(), viewModel.selectedSources(), '#sourcelist', '#sourcewrapper', '#source');
  
	viewModel.selectedSources().onValue(function (selection) {
    	if(selection.length == 1) {
    		var device = selection[0];
    		$('#selected-source').attr('src', 'images/' + device.type + '-selected.svg');
    		$('#selected-source-name').html(device.address);
    		$('#selected-source-intro').html('You can select media from');
    		
    		$('#wrapper-selected-source').removeClass('header-active');
    		$('#wrapper-selected-target').addClass('header-active');
    		
    		$('#current-source-logo').attr('src', 'images/' + device.type + '.svg');
    		$('#current-source-name').html(device.address);
    	}
    	else if(selection.length == 0) {
    		$('#selected-source').attr('src', '');
    		$('#selected-source-name').html('');
    		$('#selected-source-intro').html('');
    		
    		$('#wrapper-selected-source').addClass('header-active');
    		$('#wrapper-selected-target').removeClass('header-active');
    		
    		$('#current-source-logo').attr('src', '');
    		$('#current-source-name').html('Source device');
    	}
    	else {
    		$('#current-source-logo').attr('src', '');
    		$('#current-source-name').html(selection.length + ' Source devices');
    	}
  	});
}

util.inherits(CategoryListView, ListView);
function CategoryListView(viewModel) {
  this.htmlify = function (category) {
    return '<li class="category"><img class="category-image" src="' + category.image + '"><div class="category-name">' + category.title + '</div></li>';
  };

  this.identify = function (category) {
    return category.id;
  };

  ListView.call(this, viewModel.categories(), viewModel.selectedCategories(), '#categorylist', '#categorywrapper', '#category');
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

  viewModel.selectedTargets().onValue(function (selection) {
    	if(selection.length == 1) {
    		var device = selection[0];
    		
    		$('#current-target-logo').attr('src', 'images/' + device.type + '.svg');
    		$('#current-target-name').html(device.address);
    	}
    	else if(selection.length == 0) {
    		$('#current-target-logo').attr('src', '');
    		$('#current-target-name').html('Target device');
    	}
    	else {
    		$('#current-target-logo').attr('src', '');
    		$('#current-target-name').html(selection.length + ' Target devices');
    	}
  	});
}

function BrowserView(viewModel) {
  var sourceListView = new SourceListView(viewModel);
  var categoryListView = new CategoryListView(viewModel);
  //var contentListView = new ContentListView(viewModel);
  var targetListView = new TargetListView(viewModel);

  //viewModel.play().plug($('#play').asEventStream('click').map());

  //this.getControlsSelector = function(){
  //  return ".queuecontrols";
  //};
}

module.exports = BrowserView;
