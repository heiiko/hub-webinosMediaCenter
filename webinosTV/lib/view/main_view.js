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
    $('.overlay').on('click', function(){ closeMenus(); });

	if (window.location.hash){
		gotoPageById(window.location.hash);
		toggleMainmenu();
	}
}

function closeMenus() {
    $('#mainmenu').finish();
    $('#selecttarget').finish();
    $('.overlay').finish();
    if($('#mainmenu').is(":visible")){
        $('#mainmenu').animate({'width': 'toggle'});
    }
    if($('#selecttarget').is(":visible")){
        $('#selecttarget').animate({'width': 'toggle'});
    }
    if($('.overlay').is(":visible")){
        $('.overlay').toggle();
    }
}

function toggleMainmenu(){
    $('#mainmenu').finish();
    $('#mainmenu').animate({'width': 'toggle'}, function() {toggleOverlay(); });
}

function toggleSelectTarget(){
    $('#selecttarget').finish();
    $('#selecttarget').animate({'width': 'toggle'}, function() {toggleOverlay(); selecttargetScroll.refresh();});
}

function toggleOverlay(){
        if(($('#mainmenu').is(":visible") || $('#selecttarget').is(":visible"))){
            if($('.overlay').is(":hidden")){
                $('.overlay').toggle();
            }
        }else if($('#mainmenu').is(":hidden") && $('#selecttarget').is(":hidden")){
            if($('.overlay').is(":visible")){
                $('.overlay').toggle();
            }
        }
}

window.toggleMainmenu=toggleMainmenu;