var $ = require('jquery');
var activemenu = '#menu-device';
var currentpage = '#container-device';

$(document).ready(function() {
  init();
});

function init() {
  $(activemenu).addClass('mobilemenu-active');
  $(currentpage).addClass('subpage-current');

  $('#menu-device').on('click', function() {
    gotoPageById('#container-device');
    setActiveMenu('#menu-device');
  });
  $('#menu-media').on('click', function() {
    gotoPageById('#container-media');
    setActiveMenu('#menu-media');
    // setMediaSelectBehavior();
    // $(window).resize(setMediaSelectBehavior);
  });

  $('#menu-queue').on('click', function() {
    gotoPageById('#container-queue');
    setActiveMenu('#menu-queue');
    // DANGER - temp queuelist height calculation, rework
    // setMediaSelectBehavior();
    // $(window).resize(setMediaSelectBehavior);
    // END DANGER
  });

  if (window.location.hash) {
    gotoPageById(window.location.hash);
  }
}

function setMediaSelectBehavior() {
  // DANGER - temp queuelist height calculation, rework
  // var listheight = $(window).height() - 151 - 56 - 51;
  // $('#mobilequeuewrapper').css('height', listheight + 'px');
  // END DANGER

  // var selectMediaCategories = $('li.category').off('click');
}

function gotoPageById(id) {
  if (currentpage !== id) {
    var $currPage = $(currentpage);
    $(id).addClass('subpage-current');
    $currPage.removeClass('subpage-current');
    currentpage = id;
  }
}

function setActiveMenu(id) {
  if (activemenu !== id) {
    var $currMenu = $(activemenu);
    $(id).addClass('mobilemenu-active');
    $currMenu.removeClass('mobilemenu-active');
    activemenu = id;
  }
}