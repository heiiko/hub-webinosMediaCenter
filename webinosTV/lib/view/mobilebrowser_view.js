var $ = require('jquery');
var _ = require('../util/objectscore.coffee'); // require('underscore');
var address = require('../util/address.coffee');
var Bacon = require('baconjs');
var util = require('util');

var Toast = require('./toast_view.js');
var SelectDropDown = require('./mobileselect_dropdown_menu_view.js');
var MobileControlsView = require('./mobile_controls_view.js');
var transparentpixel = 'data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

function ListView(items, selection, list, wrapper, fadeout) {
  var self = this;
  var tappedOn = 0, clickStartEvent = null;

  this.refresh = function() {
    //if ($(list).children().length > 0) {
    //if (typeof self.scroll === 'undefined') {
    //self.scroll = new IScroll(wrapper, {snap: list + ' li', momentum: false});
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
    //}
    //self.scroll.options.snap = document.querySelectorAll(list + ' li');
    //self.scroll.refresh();

    //Fittext, currently to expensive.
    //$("li p").fitText(0.8);
    //}
  };

  items.onValue(function(items) {
    var $list = $(list);
    var counter = 0;
    $list.empty();

    _.each(items, function(item) {
      var $item = $(self.htmlify(item));
      var id = self.identify(item);
      $item.data('id', id);
      if (list === '#mobiletargetlist')
        $item.data('local', item.isLocal());
      else if (list === '#mobilecategorylist')
        $item.data('index', counter);
      $list.append($item);
      counter++;
    });
    self.refresh();
  });

  selection.apply(items.map(function(items) {
    return function(selection) {
      if (list === '#mobilequeuetargetlist' && items.length >= 1 && selection.length === 0) {
        return [self.identify(items[0])];
      }
      else {
        return _.ointersection(selection, _.map(items, function(item) {
          return self.identify(item);
        }));
      }
    };
  }));

  $(list).asEventStream('mousedown').merge($(list).asEventStream('touchstart')).onValue(function(e) {
    tappedOn = Date.now();
    clickStartEvent = e;
  });

  selection.apply($(list).asEventStream('click').merge($(list).asEventStream('touchend')).filter(function(e) {
    var justClick = (Date.now() - tappedOn < 250);
    var movedDelta = Math.max(e.screenY, clickStartEvent.screenY) - Math.min(e.screenY, clickStartEvent.screenY) + Math.max(e.screenX, clickStartEvent.screenX) - Math.min(e.screenX, clickStartEvent.screenX);
    return justClick && movedDelta < 10;
  }).map(function(event) {
    return function(selection) {
      var $item = $(event.target).closest('li');
      if (!$item.length)
        return selection;
      var id = $item.data('id');
      if (list === '#mobilecategorylist' || list === '#mobilequeuetargetlist') {
        return [id];
      }
      else {
        return (_.ocontains(selection, id) ? _.odifference : _.ounion)(selection, [id]);
      }
    };
  }));

  selection.onValue(function(selection) {
    $('li', list).each(function() {
      var $item = $(this);
      var id = $item.data('id');
      var selected = _.ocontains(selection, id);

      if (selected && list === '#mobilecategorylist') {
        var index = $item.data('index');
        var num_categories = $(list).children().length;
        var position = (100 / num_categories / 2) + (index) * (100 / num_categories);

        if ($('#sel-arrows-style').empty()) {
          $('head').append('<style id="sel-arrows-style" type="text/css"></style>');
        }
        $('#sel-arrows-style').html('@media screen and (min-width: 1200px){.arrow_box:after{top:' + position + '%}.arrow_box:before{top:' + position + '%}}');
      }
      $item.toggleClass('mobileselected', selected).find('input:checkbox').prop('checked', function(idx, oldAttr) {
        return selected;
      });
    });
  });
}

util.inherits(SourceListView, ListView);
function SourceListView(viewModel) {
  this.htmlify = function(device) {
    return '<li class="device source"><div class="device-image type-' + ((device.type()) ? device.type() : 'unknown') + '"></div><div class="device-name">' + address.friendlyName(device.address()) + '</div><div class="device-type">' + device.type() + '</div></li>';
  };

  this.identify = function(device) {
    return {
      address: device.address(),
      type: device.type()
    };
  };

  viewModel.selectedSources().onValue(function(selection) {
    if (selection.length === 1) {
      var device = selection[0];

      $('#selected-source').attr('src', 'images/' + (device.type ? device.type : 'all_devices') + '-selected.svg');
      $('#selected-source-name').html(address.friendlyName(device.address));
      $('#selected-source-intro').html('You can select media from');

      $('#wrapper-selected-source').removeClass('header-active');
      $('#wrapper-selected-target').addClass('header-active');

      $('#current-source-logo').attr('src', 'images/' + (device.type ? device.type : 'all_devices') + '.svg');
      $('#current-source-name').html(address.friendlyName(device.address));

      $('.content-searchbutton').removeClass('disabled');
      $('.content-searchbox').removeClass('disabled');
      $('#select-media-dd-wrapper').removeClass('disabled');
    }
    else if (selection.length === 0) {
      $('#selected-source').attr('src', transparentpixel);
      $('#selected-source-name').html('');
      $('#selected-source-intro').html('No source device selected');

      $('#wrapper-selected-source').addClass('header-active');
      $('#wrapper-selected-target').removeClass('header-active');

      $('#current-source-logo').attr('src', transparentpixel);
      $('#current-source-name').html('Source devices');

      $('.content-searchbutton').addClass('disabled');
      $('.content-searchbox').addClass('disabled');
      $('.content-queuebutton').addClass('disabled');
      $('#select-media-dd-wrapper').addClass('disabled');
    }
    else {
      $('#selected-source').attr('src', 'images/all_devices-selected.svg');
      $('#selected-source-name').html(selection.length + ' source devices');
      $('#selected-source-intro').html('You can select media from');

      $('#current-source-logo').attr('src', 'images/all_devices.svg');
      $('#current-source-name').html(selection.length + ' Source devices');

      $('.content-searchbutton').removeClass('disabled');
      $('.content-searchbox').removeClass('disabled');
      $('#select-media-dd-wrapper').removeClass('disabled');
    }
  });

  ListView.call(this, viewModel.sources(), viewModel.selectedSources(), '#mobilesourcelist', '#mobilesourcewrapper', '#mobilesource');
}

util.inherits(CategoryListView, ListView);
function CategoryListView(viewModel) {
  this.htmlify = function(category) {
    return '<li class="category"><div class="category-image" style="background-image:url(\'' + category.image + '\')"></div><div class="category-name">' + category.title + '</div></li>';
//    return '<li class="category"><img class="category-image" src="' + category.image + '"><div class="category-name">' + category.title + '</div></li>';
  };

  this.identify = function(category) {
    return category.id;
  };

  viewModel.selectedCategories().onValue(function(selection) {
    viewModel.selectedContent().apply(viewModel.content().map(function(items) {
      return function(selection) {
        return [];
      };
    }));
  });

  ListView.call(this, viewModel.categories(), viewModel.selectedCategories(), '#mobilecategorylist', '#mobilecategorywrapper', '#mobilecategory');
}

util.inherits(ContentListView, ListView);
function ContentListView(viewModel) {
  this.htmlify = function(value) {
    var html;
    if (typeof value.item.type === 'string' && value.item.type.toLowerCase().indexOf('image') === 0)
    {
      html = '<li class="imglistitem">' +
        '<div class="imglistitem" style="background-image:url(\'' + value.item.thumbnailURIs[0] + '\')"></div>' +
        '<div class="imglistitem-title">' + value.item.title + '</div>' +
        '</li>';
    }
    else {
      var type = value.item.type.toLowerCase();
      var iconClass;
      switch (type) {
        case 'audio':
          iconClass = "song-icon";
          break;
        case 'video':
          iconClass = "clip-icon";
          break;
        default:
          iconClass = "default-icon";
      }
      html = '<li class="contentlistitem"><div class="itemcontainer">' +
        '<div class="chbx-container"><input type="checkbox" /></div>' +
        '<div class="' + iconClass + '"></div>' +
        '<div class="mediaitemcontent">' +
        '<div class="itemtitle">' + value.item.title + '</div>' +
        '<div class="itemartists">' + value.item.artists + '</div>' +
        '</div>' +
        '</div></li>';
    }
    return html;
  };

  this.identify = function(value) {
    return {
      source: value.source.address(),
      item: {
        id: value.item.id,
        title: value.item.title
      }
    };
  };

  viewModel.selectedContent().onValue(function(selection) {
    var file = (selection.length === 1) ? 'file' : 'files';
    $('#select-media-dd-count').text(selection.length + ' ' + file + ' ' + 'selected');

    if (selection.length >= 1) {
      $('.content-queuebutton').removeClass('disabled');
    }
    else {
      $('.content-queuebutton').addClass('disabled');
    }
  });

  ListView.call(this, viewModel.content(), viewModel.selectedContent(), '#mobilecontentlist', '#mobilecontentwrapper', '#mobilecontent');
}

util.inherits(TargetListView, ListView);
function TargetListView(viewModel) {
  this.htmlify = function(device) {
    return '<li class="device target"><div class="device-image type-' + ((device.type()) ? device.type() : 'unknown') + '"></div><div class="device-name">' + address.friendlyName(device.address()) + '</div><div class="device-type">' + device.type() + '</div></li>';
  };

  this.identify = function(device) {
    return {
      address: device.address(),
      type: device.type()
    };
  };

  viewModel.selectedTargets().onValue(function(selection) {
    if (selection.length === 1) {
      var device = selection[0];

      $('#current-target-logo').attr('src', 'images/' + (device.type ? device.type : 'all_devices') + '.svg');
      $('#current-target-name').html(address.friendlyName(device.address));

      $('#selected-target').attr('src', 'images/' + (device.type ? device.type : 'all_devices') + '-selected.svg');
      $('#selected-target-name').html(address.friendlyName(device.address));
      $('#selected-target-intro').html('You are controlling');
    }
    else if (selection.length === 0) {
      $('#current-target-logo').attr('src', transparentpixel);
      $('#current-target-name').html('Target devices');

      $('#selected-target').attr('src', transparentpixel);
      $('#selected-target-name').html('');
      $('#selected-target-intro').html('No target device selected');
    }
    else {
      $('#current-target-logo').attr('src', 'images/all_devices.svg');
      $('#current-target-name').html(selection.length + ' Target devices');

      $('#selected-target').attr('src', 'images/all_devices-selected.svg');
      $('#selected-target-name').html(selection.length + ' source devices');
      $('#selected-target-intro').html('You are controlling');
    }
  });

  ListView.call(this, viewModel.targets(), viewModel.selectedTargets(), '#mobiletargetlist', '#mobiletargetwrapper', '#mobiletarget');
  ListView.call(this, viewModel.targets(), viewModel.selectedQueueTargets(), '#mobilequeuetargetlist', '#mobilequeuetargetwrapper', '#mobilequeuetarget');
}

util.inherits(QueueListView, ListView);
function QueueListView(viewModel) {
  this.htmlify = function(value) {
    var html;
    if (typeof value.item.type === 'string' && value.item.type.toLowerCase().indexOf('image') === 0)
    {
      html = '<li class="contentlistitem"><div class="itemcontainer">' +
        '<div class="chbx-container"><input type="checkbox" /></div>' +
        '<div class="imglistitem" style="background-image:url(\'' + value.item.thumbnailURIs[0] + '\')"></div>' +
        '<div class="mediaitemcontent">' +
        '<span class="itemtitle">' + value.item.title + '</span>' +
        '</div>' +
        '<div class="status"><span class="statusicon"></span><span class="statustext"></span>' +
        '</div></div></li>';
    }
    else {
      var type = value.item.type.toLowerCase();
      var iconClass;
      switch (type) {
        case 'audio':
          iconClass = "song-icon";
          break;
        case 'video':
          iconClass = "clip-icon";
          break;
        default:
          iconClass = "default-icon";
      }
      html = '<li class="contentlistitem"><div class="itemcontainer">' +
        '<div class="chbx-container"><input type="checkbox" /></div>' +
        '<div class="' + iconClass + '"></div>' +
        '<div class="mediaitemcontent">' +
        '<div class="itemtitle">' + value.item.title + '</div>' +
        '<div class="itemartists">' + value.item.artists + '</div>' +
        '</div>' +
        '<div class="status">' +
        '<div class="statusicon"></div>' +
        '<div class="statustext"></div>' +
        '</div>' +
        '</div></li>';
    }
    return html;
  };

  this.identify = function(value) {
    return value.link;
  };

  ListView.call(this, viewModel.queue(), viewModel.selectedQueue(), '#mobilequeuelist', '#mobilequeuewrapper', '#mobilequeue');
}




function MobileBrowserView(viewModel) {
  //var horizontalScroll = new IScroll('#horizontalwrapper', {snap: '.listhead', scrollX: true, scrollY: false, momentum: false});

  var sourceListView = new SourceListView(viewModel);
  var categoryListView = new CategoryListView(viewModel);
  var contentListView = new ContentListView(viewModel);
  var targetListView = new TargetListView(viewModel);
  var queueListView = new QueueListView(viewModel);
  var ddmenu = new SelectDropDown(viewModel.content(), viewModel.selectedContent());

  //var listViews = [sourceListView, categoryListView, contentListView, targetListView, null, queueListView];
  //var navigationView = new NavigationView(viewModel, listViews);

  //viewModel.prepend().plug($('#prepend').asEventStream('click').merge($('#prepend').asEventStream('touchend')));
  viewModel.append().plug($('#mobileappend').asEventStream('click').merge($('#mobileappend').asEventStream('touchend')));

  //viewModel.selectedPeer().onValue(function(selectedPeer) {
  //  $('#peer').text(selectedPeer === '<no-peer>' ? "Select a target" : address.friendlyName(selectedPeer.address()));
  //});

  var controlsViewModel = viewModel.controls();
  var controlsView = new MobileControlsView('.mobilequeuecontrols', null, controlsViewModel);

  $('.content-queuebutton').click(function() {
    // TODO: add number of files added
    var t = new Toast('Media files are added to your queue');
  });

  //document.addEventListener('touchmove', function(e) {
  //  e.preventDefault();
  //}, false);

  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loaded, 800);
  }, false);
}





module.exports = MobileBrowserView;
