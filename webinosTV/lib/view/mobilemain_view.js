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
    setMediaSelectBehavior();
    $(window).resize(setMediaSelectBehavior);
  });

  $('#menu-queue').on('click', function() {
    gotoPageById('#container-queue');
    setActiveMenu('#menu-queue');
  });

  if (window.location.hash) {
    gotoPageById(window.location.hash);
  }
}

function setMediaSelectBehavior() {
  var selectMediaCategories = $('li.category').off('click');
  if ($(window).width() > 1199) { //wide screen
    $('#mobilecategorylist').show();
    $('#mobilecontentlist').show();
    $('#topmenu').show();
    $('#mobilecontentwrapper').addClass('arrow_box');
  }
  else //small screen
  {
    $('#mobilecategorylist').show(250);
    $('#mobilecontentlist').hide(250);
    $('#mobilecontentwrapper').removeClass('show');
    var selectMediaCategories = $('li.category').on('click', function() {
      //push
      $('#mobilecategorylist').hide(250);
      $('#mobilecontentwrapper').addClass('show');
      $('#mobilecontentlist').show(250);
      //$('#topmenu').hide();
      //$('#selected-source-intro').html('< ');
      //pop
      $($('#container-media .header-item-media')[0]).one('click', function() {
        //$('#selected-source-intro').html('You can select media from');
        $('#mobilecategorylist').show(250);
        //$('#topmenu').show(250);
        $('#mobilecontentlist').hide(250);
        $('#mobilecontentwrapper').removeClass('show');
      });
    });
  }
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