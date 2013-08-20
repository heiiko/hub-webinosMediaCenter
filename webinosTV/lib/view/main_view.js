var gotoPageById = require('./pagetransition.js');
var IScroll = require('iscroll');

var selecttargetScroll;

$(document).ready(function() {
	init();
});

function init() {
	$('#tosimplebrowserbutton').on('click', function(){ gotoPageById('#browser'); toggleMainmenu(); });
    $('#toadvancedbrowserbutton').on('click', function(){ gotoPageById('#browser'); toggleMainmenu(); });
    $('#torendererbutton').on('click', function(){ gotoPageById('#renderer'); toggleMainmenu(); });
    $('#tocontrollerbutton').on('click', function(){ gotoPageById('#controller'); toggleMainmenu(); });

	selecttargetScroll = new IScroll('#st_wrapper', {snap: 'li', momentum: false});
    $('#selecttarget').toggle();

    $('#leftfadeout').on('click', function(){ toggleMainmenu(); });
    $('#rightfadeout').on('click', function(){ toggleSelectTarget(); });
    $('#closeselecttarget').on('click', function(){ toggleSelectTarget(); });

	if (window.location.hash) {
		gotoPageById(window.location.hash);
		toggleMainmenu();
	}
}

function toggleMainmenu(){
    $('#mainmenu').animate({'width': 'toggle'});
    $('.overlay').animate({'opacity': 'toggle'}, 1000);
}

function toggleSelectTarget(){
    $('#selecttarget').animate({'width': 'toggle'}, scrollrefresh());
    $('.overlay').animate({'opacity': 'toggle'}, 1000);
}

function scrollrefresh(){
	setTimeout(function(){
		electtargetScroll.refresh();
	}, 0);
}