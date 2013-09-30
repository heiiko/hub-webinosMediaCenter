var _ = require('underscore');
var $ = require('jquery');

function SelectDropDown(items, selection) {
  
  function selectAllItems() {
    
    selection.apply(items.map(function(items) {
    	return function(selection) {
      		return _.ounion(_.map(items, function(value) {
        		return {
      				device: value.device.address(),
      				service: value.service.id(),
      				item: {
        				id: value.id,
        				title: value.title
      				}
      			};
      		}));
		};
	}));
  }

  function deselectAllItems() {
  	selection.apply(items.map(function(items) {
    	return function(selection) {
      		return [];
 	   };
	}));
  }
  
  $('#select-media-dd-count').click(function() {
    $('#select-media-dd-menu li').removeClass('dd-selected');
    $('#select-media-dd-menu').toggle();
  });

  $('#select-media-dd-menu li').click(function() {
    $(this).addClass('dd-selected');
    switch (this.id) {
      case 'select-media-dd-all':
        selectAllItems();
        break;
      case 'select-media-dd-none':
        deselectAllItems();
        break;
      default:
        break;
    }
    $('#select-media-dd-menu').slideUp(500);
  });

}

module.exports = SelectDropDown;

