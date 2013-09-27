var _ = require('underscore');
var $ = require('jquery');
var address = require('../util/address.coffee');

function SelectTargetListView(items, selection) {
  var self = this;
  this.scroll = undefined;
  this.tappedOn = 0;

  this.htmlify = function (value) {
    return '<li class="device target"><div class="device-image type-' + ((value.device.type())?value.device.type():'unknown') + '"></div><div class="device-name">' + address.friendlyName(value.device.address()) + '</div><div class="device-type">' + device.type() + '</div></li>';
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

  selection.apply($('#mobileselecttargetlist').asEventStream('click').merge($('#mobileselecttargetlist').asEventStream('touchend')).map(function (event) {
    return function (selection) {
      var $item = $(event.target).closest('li');
      if (!$item.length) return selection;
      return $item.data('id');
    };
  }));
  
  selection.onValue(function(selection) {
    $('li', '#mobileselecttargetlist').each(function() {
      var $item = $(this);
      var id = $item.data('id');
      var selected = selection === id;
      
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

  viewModel.enter().plug($('.clickAreaOk').asEventStream('click').merge($('.clickAreaOk').asEventStream('touchend')));
  viewModel.left().plug($('.clickAreaLeft').asEventStream('click').merge($('.clickAreaLeft').asEventStream('touchend')));
  viewModel.up().plug($('.clickAreaUp').asEventStream('click').merge($('.clickAreaUp').asEventStream('touchend')));
  viewModel.right().plug($('.clickAreaRight').asEventStream('click').merge($('.clickAreaRight').asEventStream('touchend')));
  viewModel.down().plug($('.clickAreaDown').asEventStream('click').merge($('.clickAreaDown').asEventStream('touchend')));
}

module.exports = MobileRemoteView;
