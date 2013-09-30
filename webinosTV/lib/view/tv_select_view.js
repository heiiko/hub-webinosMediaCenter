var _ = require('underscore');
var $ = require('jquery');

function Select_View(items, selection) {
  
  function selectAllItems() {
    
    selection.apply(items.map(function(items) {
    	return function(selection) {
    		return _.ounion(_.map(items, function(value) {
      		return {
  				source: value.source.address(),
    				item: {
      				id: value.item.id,
      				title: value.item.title
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

  $('#select-media-dd-all').click(function() {
    selectAllItems();
  });

  $('#select-media-dd-none').click(function() {
    deselectAllItems();
  });

}

module.exports = Select_View;

