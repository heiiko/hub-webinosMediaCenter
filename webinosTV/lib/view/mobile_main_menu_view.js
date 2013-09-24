/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
var gotoPageById = require('./pagetransition.js');
//var IScroll = require('iscroll');
//var _ = require('../util/objectscore.coffee');
//var address = require('../util/address.coffee');


function MobileMainMenuView() {
  /*Mobile browser view::left pull menu*/
  //$('#leftfadeout').unbind('click');
  $('#leftfadeout').append('<div id="leftdragbar">' +
    '<div class="verticalgrippie"></div>' +
    '</div>' +
    '<div id="leftmenu">' +
    '<div id="mmm_tomobilebrowser" class="mmm_item"><p>Browser</p></div>' +
    '<div id="mmm_torenderer" class="mmm_item"><p>Player</p></div>' +
    '<div id="mmm_tocontroller" class="mmm_item"><p>Controller</p></div>' +
    '</div>');

  function rollbackMenu() {
    //rollback
    $('#leftfadeout').animate({width: '0.5em'}, 300);
  }

  $('#leftdragbar').mousedown(function(e) {
    e.preventDefault();
    $(document).mousemove(function(e) {
      $('#leftfadeout').css("width", e.pageX + 2);
    });

    $('#leftdragbar').mouseup(function(e) {
      e.preventDefault();
      $(document).unbind('mousemove');
      $('#leftfadeout').animate({width: '100%'}, 300).one('dblclick', function() {
        rollbackMenu();
      });
    });
  });

  $('#mmm_tomobilebrowser').on('click', function() {
    $(this).toggleClass("mmm_highlight");
    gotoPageById('#mobilebrowser');
    rollbackMenu();
  });
  $('#mmm_tobrowser').on('click', function() {
    $(this).toggleClass("mmm_highlight");
    gotoPageById('#browser');
    rollbackMenu();
  });
  $('#mmm_torenderer').on('click', function() {
    $(this).toggleClass("mmm_highlight");
    gotoPageById('#renderer');
    rollbackMenu();
  });
  $('#mmm_tocontroller').on('click', function() {
    $(this).toggleClass("mmm_highlight");
    gotoPageById('#controller');
    rollbackMenu();
  });
  
  window.closeMainmenu=rollbackMenu;
}

module.exports = MobileMainMenuView;