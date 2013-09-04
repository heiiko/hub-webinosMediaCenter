var gotoPageById = require('./pagetransition.js');
var IScroll = require('iscroll');

var selecttargetScroll;

$(document).ready(function() {
	init();
    calcSize();
});

$(window).resize(function() {
  calcSize();
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

function calcSize(){
    var width = $(window).innerWidth();
    var height = $(window).innerHeight();
    var margin = 0;
    if(height < width){
        margin = height*0.03;
    }else{
        margin = width*0.03;
    }
    $('.mm_button').height((height-4*margin)/3);
    $('.mm_button').css("margin", margin);
    $('.mm_button').width($('.menu').width()-2*margin);
}


function closeMenus() {
    if($('#mainmenu').is(":visible")){
        $('#mainmenu').toggle();
    }
    if($('#selecttarget').is(":visible")){
        $('#selecttarget').toggle();
    }
    if($('.overlay').is(":visible")){
        $('.overlay').toggle();
    }
}

function toggleMainmenu(){
    $('#mainmenu').toggle();
    toggleOverlay();
}

function toggleSelectTarget(){
    $('#selecttarget').toggle();
    toggleOverlay();
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