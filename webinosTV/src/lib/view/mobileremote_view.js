var _ = require('underscore');
var $ = require('jquery');
var address = require('../util/address.coffee');

function SelectTargetListView(items, selection) {
  var self = this;
  this.scroll = undefined;
  this.tappedOn = 0;

  this.htmlify = function (value) {
    var icon = 'all_devices';
    if (value.type === 'upnp') {
      icon = 'tv';
    } else if (value.device.type()) {
      icon = value.device.type();
    }
    return '<li class="device target"><div class="device-image type-' + icon + '"></div><div class="device-name">' + address.friendlyName(value.device.address()) + '</div><div class="device-type">' + icon + '</div></li>';
  };

  this.identify = function (value) {
    return {
      device: value.device.address(),
      service: value.service.id(),
      type: value.type
    };
  };
  
  items.onValue(function (items) {
    var $list = $('#mobileselecttargetlist');
    $list.empty();

    _.each(items, function (item) {
      var $item = $(self.htmlify(item));
      var id = self.identify(item);
      $item.data('id', id);
      $list.append($item);
    });
  });

  selection.apply($('#mobileselecttargetlist').asEventStream('click').map(function (event) {
    return function (selection) {
      var $item = $(event.target).closest('li');
      if (!$item.length) return selection;
      var id = $item.data('id');
      return [id];
    };
  }));
  
  selection.apply(items.map(function(items) {
    return function(selection) {
      if (items.length >= 1 && selection.length === 0) {
        return [self.identify(items[0])];
      }
      else {
        return _.ointersection(selection, _.map(items, function(item) {
          return self.identify(item);
        }));
      }
    };
  }));
  
  selection.onValue(function(selection) {
    $('li', '#mobileselecttargetlist').each(function() {
      var $item = $(this);
      var id = $item.data('id');
      var selected = (JSON.stringify(selection[0]) === JSON.stringify(id));

      $item.toggleClass('mobileselected', selected);
    });
  });
}

function NavigationView (viewModel) {

  viewModel.input().onValue(Navigate);

  function Navigate(direction) {
    switch(direction){
      case 'left':
        window.openMainmenu();
        break;
    }
  }

  function navlog(direction) {
    console.log(direction);
  }
}


function MobileRemoteView(viewModel) {
  var selectTargetListView = new SelectTargetListView(viewModel.targets(), viewModel.selectedTarget());
  var navigationView = new NavigationView(viewModel);

  viewModel.enter().plug($('.clickAreaOk').asEventStream('click'));
  viewModel.left().plug($('.clickAreaLeft').asEventStream('click'));
  viewModel.up().plug($('.clickAreaUp').asEventStream('click'));
  viewModel.right().plug($('.clickAreaRight').asEventStream('click'));
  viewModel.down().plug($('.clickAreaDown').asEventStream('click'));
}

module.exports = MobileRemoteView;
