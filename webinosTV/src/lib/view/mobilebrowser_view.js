var $ = require('jquery');
var _ = require('../util/objectscore.coffee');
var address = require('../util/address.coffee');
var Bacon = require('baconjs');
var util = require('util');

var Toast = require('./toast_view.js');
var SelectDropDown = require('./mobileselect_dropdown_menu_view.js');
var MobileControlsView = require('./mobile_controls_view.js');
var controlsView;
var controlsViewModel;
var contentSelected = false;
var targetSelected = false;

function friendlyName(info) {
  if (info.type === 'upnp') {
    return info.service.displayName();
  } else {
    return address.friendlyName(info.device.address());
  }
}

function ListView(items, selection, list, wrapper, fadeout) {
  var self = this;

  items.onValue(function(items) {
    var $list = $(list);
    var counter = 0;
    $list.empty();

    _.each(items, function(item) {
      var $item = $(self.htmlify(item));
      var id = self.identify(item);
      $item.data('id', id);
      if (list === '#mobiletargetlist')
        $item.data('local', item.device.isLocal());
      else if (list === '#mobilecategorylist')
        $item.data('index', counter);
      $list.append($item);
      counter++;
    });
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

  selection.apply($(list).asEventStream('click').map(function(event) {
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

        if (! $('#sel-arrows-style').length) {
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

	  $('#current-source-logo').removeClass();
	  $('#current-source-logo').addClass('device-image');
	  $('#current-source-logo').addClass('type-' + (device.type ? device.type : 'unknown'));
	  
	  $('#selected-source').removeClass();
	  $('#selected-source').addClass('device-image');
	  $('#selected-source').addClass('type-' + (device.type ? device.type : 'unknown'));
	  
      $('#selected-source-name').html(address.friendlyName(device.address));
      $('#selected-source-intro').html('You can select media from ');

      $('#wrapper-selected-source').addClass('header-active');

      $('#current-source-name').html(address.friendlyName(device.address));

      $('.content-searchbutton').removeClass('disabled');
      $('.content-searchbox').removeClass('disabled');
      $('#select-media-dd-wrapper').removeClass('disabled');
    }
    else if (selection.length === 0) {
      $('#current-source-logo').removeClass();
	  $('#current-source-logo').addClass('device-image');
	  $('#current-source-logo').addClass('type-none');
	  
	  $('#selected-source').removeClass();
	  $('#selected-source').addClass('device-image');
	  $('#selected-source').addClass('type-none');
	  
      $('#selected-source-name').html('');
      $('#selected-source-intro').html('No source device selected');

      $('#wrapper-selected-source').removeClass('header-active');

      $('#current-source-name').html('Source devices');

      $('.content-searchbutton').addClass('disabled');
      $('.content-searchbox').addClass('disabled');
      $('.content-queuebutton').addClass('disabled');
      $('#select-media-dd-wrapper').addClass('disabled');
    }
    else {
      $('#selected-source').removeClass();
	  $('#selected-source').addClass('device-image');
	  $('#selected-source').addClass('type-unknown');

      $('#selected-source-name').html(selection.length + ' source devices');
      $('#selected-source-intro').html('You can select media from ');

	  $('#current-source-logo').removeClass();
	  $('#current-source-logo').addClass('device-image');
	  $('#current-source-logo').addClass('type-unknown');
      $('#current-source-name').html(selection.length + ' Source devices');

      $('#wrapper-selected-source').addClass('header-active');

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
  this.htmlify = function(item) {
    var html;
    if (typeof item.type === 'string' && item.type.toLowerCase().indexOf('image') === 0)
    {
      html = '<li class="imglistitem">' +
        '<div class="imglistitem"><img class="imglistitem" src="' + item.thumbnailURIs[0] + '" /></div>' +
        '<div class="imglistitem-title">' + item.title + '</div>' +
        '</li>';
    }
    else {
      var type = item.type.toLowerCase();
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
        '<div class="itemtitle">' + item.title + '</div>' +
        '<div class="itemartists">' + item.artists + '</div>' +
        '</div>' +
        '</div></li>';
    }
    return html;
  };

  this.identify = function(item) {
    return {
      device: item.device.address(),
      service: item.service.id(),
      item: {
        id: item.id,
        title: item.title
      }
    };
  };

  viewModel.selectedContent().onValue(function(selection) {
    var file = (selection.length === 1) ? 'file' : 'files';
    $('#select-media-dd-count').text(selection.length + ' ' + file + ' ' + 'selected');

    if (selection.length >= 1) {
      contentSelected = true;
      if(targetSelected) {
        $('.content-queuebutton').removeClass('disabled');
      }
    }
    else {
      contentSelected = false;
      $('.content-queuebutton').addClass('disabled');
    }
  });

  ListView.call(this, viewModel.content(), viewModel.selectedContent(), '#mobilecontentlist', '#mobilecontentwrapper', '#mobilecontent');
}

util.inherits(TargetListView, ListView);
function TargetListView(viewModel) {
  this.htmlify = function(value) {
    var icon = 'all_devices';
    if (value.type === 'upnp') {
      icon = 'tv';
    } else if (value.device.type()) {
      icon = value.device.type();
    }
    return '<li class="device target"><div class="device-image type-' + icon + '"></div><div class="device-name">' + friendlyName(value) + '</div><div class="device-type">' + icon + '</div></li>';
  };

  this.identify = function(value) {
    return {
      device: value.device,
      service: value.service.id(),
      type: value.type
    };
  };

  viewModel.selectedTargets().onValue(function(selection) {
    if (selection.length === 1) {
      var value = selection[0];
	  var icon = 'all_devices';
      if (value.type === 'upnp') {
        icon = 'tv';
      } else if (value.device.type()) {
        icon = value.device.type();
      }
      
      $('#wrapper-selected-target').addClass('header-active');

	  $('#current-target-logo').removeClass();
	  $('#current-target-logo').addClass('device-image');
	  $('#current-target-logo').addClass('type-' + (value.device.type() ? value.device.type() : 'unknown'));
      $('#current-target-name').html(friendlyName(value));
    }
    else if (selection.length === 0) {
      $('#current-target-logo').removeClass();
	  $('#current-target-logo').addClass('device-image');
	  $('#current-target-logo').addClass('type-none');
      $('#current-target-name').html('Target devices');
      
      $('#wrapper-selected-target').removeClass('header-active');
    }
    else {
      $('#current-target-logo').removeClass();
	  $('#current-target-logo').addClass('device-image');
	  $('#current-target-logo').addClass('type-unknown');
      $('#current-target-name').html(selection.length + ' Target devices');
      
      $('#wrapper-selected-target').addClass('header-active');
    }
    
    if (selection.length >= 1) {
      targetSelected = true;
      if(contentSelected) {
        $('.content-queuebutton').removeClass('disabled');
      }
    }
    else {
      targetSelected = false;
      $('.content-queuebutton').addClass('disabled');
    }
  });
  
  viewModel.selectedQueueTargets().onValue(function(selection) {
    if(selection.length === 1) {
      var config = {'local': selection[0].device.isLocal()};
      controlsView = new MobileControlsView('.mobilequeuecontrols', config, controlsViewModel);
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
        '<div class="imglistitem" ><img class="imglistitem" src="' + value.item.thumbnailURIs[0] + '" /></div>' +
        '<div class="mediaitemcontent">' +
        '<div class="itemtitle">' + value.item.title + '</div>' +
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
  var sourceListView = new SourceListView(viewModel);
  var categoryListView = new CategoryListView(viewModel);
  var contentListView = new ContentListView(viewModel);
  var targetListView = new TargetListView(viewModel);
  var queueListView = new QueueListView(viewModel);
  var ddmenu = new SelectDropDown(viewModel.content(), viewModel.selectedContent());

  viewModel.append().plug($('#mobileappend').asEventStream('click'));

  controlsViewModel = viewModel.controls();
  controlsView = new MobileControlsView('.mobilequeuecontrols', null, controlsViewModel);

  $('.content-queuebutton').click(function() {
    if(! $(this).hasClass('disabled')) {
      // TODO: add number of files added
      var t = new Toast('Media files are added to your queue');
    }
  });
}





module.exports = MobileBrowserView;
