var $ = require('jquery');
var _ = require('../util/objectscore.coffee'); // require('underscore');
var address = require('../util/address.coffee');
var Bacon = require('baconjs');
var util = require('util');

var ControlsView = require('./controls_view.js');

function ListView(items, selection, list, wrapper, fadeout) {
  var self = this;

  this.refresh = function() {
    if ($(list).children().length > 0) {
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
    }
  };

  items.onValue(function(items) {
    var $list = $(list);
    $list.empty();

    _.each(items, function(item) {
      var $item = $(self.htmlify(item));
      var id = self.identify(item);
      $item.data('id', id);
      if (list === '#mobiletargetlist')
        $item.data('local', item.isLocal());
      $list.append($item);
    });
    self.refresh();
  });

  selection.apply(items.map(function(items) {
    return function(selection) {
      return _.ointersection(selection, _.map(items, function(item) {
        return self.identify(item);
      }));
    };
  }));

  $(list).asEventStream('mousedown').merge($(list).asEventStream('touchstart')).onValue(function() {
    tappedOn = Date.now();
  });

  selection.apply($(list).asEventStream('click').merge($(list).asEventStream('touchend')).filter(function() {
    var justClick = (Date.now() - tappedOn < 250);
    return justClick;
  }).map(function(event) {
    return function(selection) {
      var $item = $(event.target).closest('li');
      if (!$item.length)
        return selection;
      var id = $item.data('id');
      return (_.ocontains(selection, id) ? _.odifference : _.ounion)(selection, [id]);
    };
  }));

  selection.onValue(function(selection) {
    $('li', list).each(function() {
      var $item = $(this);
      var id = $item.data('id');
      var selected = _.ocontains(selection, id);
      $item.toggleClass('mobileselected', selected).find('input:checkbox').prop('checked', function(idx, oldAttr) {
        return selected;
      });

    });
  });
}

util.inherits(SourceListView, ListView);
function SourceListView(viewModel) {
  this.htmlify = function(device) {
    return '<li class="device source"><div class="device-image type-' + device.type() + '"></div><div class="device-name">' + address.friendlyName(device.address()) + '</div><div class="device-type">' + device.type().charAt(0).toUpperCase() + device.type().slice(1) + '</div></li>';
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

      $('#selected-source').attr('src', 'images/' + device.type + '-selected.svg');
      $('#selected-source-name').html(address.friendlyName(device.address));
      $('#selected-source-intro').html('You can select media from');

      $('#wrapper-selected-source').removeClass('header-active');
      $('#wrapper-selected-target').addClass('header-active');

      $('#current-source-logo').attr('src', 'images/' + device.type + '.svg');
      $('#current-source-name').html(address.friendlyName(device.address));
    }
    else if (selection.length === 0) {
      $('#selected-source').attr('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==');
      $('#selected-source-name').html('');
      $('#selected-source-intro').html('');

      $('#wrapper-selected-source').addClass('header-active');
      $('#wrapper-selected-target').removeClass('header-active');

      $('#current-source-logo').attr('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==');
      $('#current-source-name').html('Source device');
    }
    else {
      $('#current-source-logo').attr('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==');
      $('#current-source-name').html(selection.length + ' source devices');
    }
  });

  ListView.call(this, viewModel.sources(), viewModel.selectedSources(), '#mobilesourcelist', '#mobilesourcewrapper', '#mobilesource');
}

util.inherits(CategoryListView, ListView);
function CategoryListView(viewModel) {
  this.htmlify = function(category) {
    return '<li class="category"><img class="category-image" src="' + category.image + '"><div class="category-name">' + category.title + '</div></li>';
  };

  this.identify = function(category) {
    return category.id;
  };

  ListView.call(this, viewModel.categories(), viewModel.selectedCategories(), '#mobilecategorylist', '#mobilecategorywrapper', '#mobilecategory');
}

util.inherits(ContentListView, ListView);
function ContentListView(viewModel) {
  this.htmlify = function(value) {
    var html;
    if (typeof value.item.type === 'string' && value.item.type.toLowerCase().indexOf('image') === 0) {
      html = '<li><div><input type="checkbox" /></div><div class="image-icon"><img src="' + value.item.thumbnailURIs[0] + '"></div><div class="mediaitemcontent"><span class="imagetitle">' + value.item.title + '</span></div>';
    } else {
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
      html = '<li><div><input type="checkbox" /></div><div class="' + iconClass + '"></div><div class="mediaitemcontent"><span class="itemtitle">' + value.item.title + '</span><span class="itemartists">' + value.item.artists + '</span></div>';
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

  ListView.call(this, viewModel.content(), viewModel.selectedContent(), '#mobilecontentlist', '#mobilecontentwrapper', '#mobilecontent');
}

util.inherits(TargetListView, ListView);
function TargetListView(viewModel) {
  this.htmlify = function(device) {
    return '<li class="device target"><div class="device-image type-' + device.type() + '"></div><div class="device-name">' + address.friendlyName(device.address()) + '</div><div class="device-type">' + device.type().charAt(0).toUpperCase() + device.type().slice(1) + '</div></li>';
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

      $('#current-target-logo').attr('src', 'images/' + device.type + '.svg');
      $('#current-target-name').html(address.friendlyName(device));
    }
    else if (selection.length === 0) {
      $('#current-target-logo').attr('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==');
      $('#current-target-name').html('Target device');
    }
    else {
      $('#current-target-logo').attr('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==');
      $('#current-target-name').html(selection.length + ' target devices');
    }
  });

  ListView.call(this, viewModel.targets(), viewModel.selectedTargets(), '#mobiletargetlist', '#mobiletargetwrapper', '#mobiletarget');
}

util.inherits(QueueListView, ListView);
function QueueListView(viewModel) {
  this.htmlify = function(value) {
    var html;
    if (typeof value.item.type === 'string' && value.item.type.toLowerCase().indexOf('image') === 0) {
      html = '<li class="mediaitemcontent nav_qu"><img src="' + value.item.thumbnailURIs[0] + '">';
    } else {
      html = '<li class="textContent nav_qu"><p>' + value.item.title + '</p>';
    }
    html += '<img class="selectIcon" src="images/remove.svg"></li>';
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

  //var listViews = [sourceListView, categoryListView, contentListView, targetListView, null, queueListView];
  //var navigationView = new NavigationView(viewModel, listViews);

  viewModel.prepend().plug($('#prepend').asEventStream('click').merge($('#prepend').asEventStream('touchend')));
  viewModel.append().plug($('#append').asEventStream('click').merge($('#append').asEventStream('touchend')));

  viewModel.selectedPeer().onValue(function(selectedPeer) {
    $('#peer').text(selectedPeer === '<no-peer>' ? "Select a target" : address.friendlyName(selectedPeer.address()));
  });

  var controlsViewModel = viewModel.controls();
  var controlsView = new ControlsView('#mobilequeuecontrols', null, controlsViewModel);

  document.addEventListener('touchmove', function(e) {
    e.preventDefault();
  }, false);

  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loaded, 800);
  }, false);
}





module.exports = MobileBrowserView;
