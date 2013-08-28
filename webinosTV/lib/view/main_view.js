var $ = require('jquery');
var activemenu = '#menu-device';
var currentpage = '#container-device';

$(document).ready(function() {
	init();
});

function init() {
	$(activemenu).addClass('menu-active');
	$(currentpage).addClass('subpage-current');
	
	$('#menu-device').on('click', function(){ gotoPageById('#container-device'); setActiveMenu('#menu-device');});
    $('#menu-media').on('click', function(){ gotoPageById('#container-media'); setActiveMenu('#menu-media');});
    $('#menu-queue').on('click', function(){ gotoPageById('#container-queue'); setActiveMenu('#menu-queue');});

	if (window.location.hash){
		gotoPageById(window.location.hash);
	}
}

function gotoPageById(id) {
    if (currentpage != id) {
        var $currPage = $(currentpage);
        $(id).addClass('subpage-current');
		$currPage.removeClass('subpage-current');
        currentpage = id;
    }
}

function setActiveMenu(id) {
    if (activemenu != id) {
        var $currMenu = $(activemenu);
        $(id).addClass('menu-active');
		$currMenu.removeClass('menu-active');
        activemenu = id;
    }
}