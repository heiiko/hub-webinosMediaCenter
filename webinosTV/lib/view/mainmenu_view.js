var gotoPageById = require('./pagetransition.js');
var IScroll = require('iscroll');

function NavigationView (viewModel) {
  var curPos = 0;
  var navVisible = false;
  var timeoutHandle;

  $(document).keydown(function(e) {
    switch (e.keyCode) {
      case 38:
        Navigate('up');
        navlog("nav_up");
        return false;
      case 39:
        Navigate('right');
        navlog("nav_right");
        return false;
      case 40:
        Navigate('down');
        navlog("nav_down");
        return false;
      case 13:
        if(navVisible)
          $(".nav_mm.focus").click();
        return false;
    }
  });

  function Navigate(direction) {
    window.clearTimeout(timeoutHandle);
    if(navVisible === false){
      navVisible = true;
    }else{
      $(".nav_mm.focus").removeClass('focus');
      switch(direction){
        case 'down':
          if(curPos < 2)
            curPos++;
          break;
        case 'up':
          if(curPos > 0)
            curPos--;
          break;
        case 'right':
          window.toggleMainmenu();
          break;
      }
    }
    $(".nav_mm").eq(curPos).addClass('focus');
    startNavVisibleTimeout();
  }

  function startNavVisibleTimeout(){
    timeoutHandle = window.setTimeout(function(){
      navVisible=false;
      $(".nav_mm").eq(curPos).removeClass('focus');
    }, 5000);
  }

  function navlog(direction) {
    console.log(direction + "  pos:" + curPos);
  }
}

function MainMenuView(viewModel){

  // var navigationView = new NavigationView(viewModel);
  var selecttargetScroll;

  function init() {
    $('#toadvancedbrowserbutton').on('click', function(){ gotoPageById('#browser'); closeMainmenu(); });
    $('#torendererbutton').on('click', function(){ gotoPageById('#renderer'); closeMainmenu(); });
    $('#tocontrollerbutton').on('click', function(){ closeMainmenu(); openSelectTarget()});
    

    // gotoPageById('#controller'); toggleMainmenu();

    calcSize();
    selecttargetScroll = new IScroll('#st_wrapper', {snap: 'li', momentum: false});
    
    closeSelectTarget();
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

    $('.mainmenulist').height(height-2*margin);
    $('.mainmenulist').css("margin", margin);
    $('.mainmenulist').width($('.menu').width()-2*margin);
  }

  function openMainmenu(){
    if(!$('#mainmenu').is(":visible")){
      toggleMainmenu();
    }
  }
  function closeMainmenu(){
    if($('#mainmenu').is(":visible")){
      toggleMainmenu();
    }
  }

  function openSelectTarget(){
    if(!$('#selecttarget').is(":visible")){
      toggleSelectTarget();
    }
  }
  function closeSelectTarget(){
    if($('#selecttarget').is(":visible")){
      toggleSelectTarget();
    }
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
    if(!$('#selecttarget').is(":visible")){
      $('#selecttargetlist').empty();
      $('#selecttargetlist').append(document.querySelectorAll('#targetlist li'));
      $('#selecttargetlist > li').filter(function() {
        if($(this).data("local") === true){
          return false;
        }else{
          $(this).removeClass('nav_tl');
          $(this).addClass( "nav_st" );
          return true;
        }
      });
      if($('#selecttargetlist li').length > 0){
        selecttargetScroll.options.snap = document.querySelectorAll('#selecttargetlist li');
        selecttargetScroll.refresh();
      }
    }
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

  $(document).ready(function() {
    init();
  });

  $(window).resize(function() {
    calcSize();
  });

  window.toggleMainmenu=toggleMainmenu;
  window.toggleSelectTarget=toggleSelectTarget;
}

module.exports = MainMenuView;
