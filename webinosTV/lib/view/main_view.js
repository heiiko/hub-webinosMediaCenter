var $ = require('jquery');
var activemenu = '#menu-device';
var currentpage = '#container-device';

$(document).ready(function() {
  init();
});

function init() {
  $(activemenu).addClass('menu-active');
  $(currentpage).addClass('subpage-current');

  $('#menu-device').on('click', function() {
    gotoPageById('#container-device');
    setActiveMenu('#menu-device');
  });
  $('#menu-media').on('click', function() {
    gotoPageById('#container-media');
    setActiveMenu('#menu-media');

    $(window).resize(function() {
      console.warn("RESIZE ", $(window).width());
      var selectMediaCategories = $('li.category').off('click');
      if ($(window).width() > 1199) { //wide screen
        $('#categorylist').show();
        $('#contentlist').show();
        $('#topmenu').show();
        //Selection Arrow logic
        function getClassStyles(parentElem, selector, stylePropertyName) {
          var elemstr = '<div ' + selector + '></div>';
          var $elem = $(elemstr).hide().appendTo(parentElem);
          var val = $elem.css(stylePropertyName);
          $elem.remove();
          return val;
        }

        var moveCategorySelectionArrow = function(yposition) {
          if ($('#sel-arrows-style').empty()) {
            $('head').append('<style id="sel-arrows-style" type="text/css"></style>');
          }
          $('#sel-arrows-style').html('@media screen and (min-width: 1200px){.arrow_box:after{top:' + yposition + 'px}.arrow_box:before{top:' + yposition + 'px}.yposition-reminder{top:' + yposition + 'px;display:none}}');
        };

        var selectMediaCategories = $('li.category');
        var clheight = $('li.category')[0].clientHeight;
        var clpadding = parseInt($($('li.category')[0]).css('padding'));
        var imgHeight = $('img.category-image')[0].clientHeight;

        for (var i = 0; i < selectMediaCategories.length; i++) {
          (function(i) {
            $(selectMediaCategories[i]).on('click', function() {
              var ypos = parseFloat(getClassStyles('body', 'class="yposition-reminder"', 'top'));
              var newYpos = i * clheight + imgHeight / 2 + clpadding;
              moveCategorySelectionArrow(newYpos);
              if (ypos === newYpos && $('#contentlist').hasClass('arrow_box')) {
                $('#contentlist').removeClass('arrow_box');
              }
              else {
                $('#contentlist').addClass('arrow_box');
              }
            });
          })(i);
        }
      }
      else //small screen
      {
        $('#contentlist').hide(250);
        var selectMediaCategories = $('li.category').on('click', function() {
          //push
          $('#categorylist').hide(250);
          $('#contentlist').show(250);
          $('#topmenu').hide();
          $('#selected-source-intro').html('< ');
          //pop
          $('#container-media .header').one('click', function() {
            $('#selected-source-intro').html('You can select media from');
            $('#categorylist').show(250);
            $('#topmenu').show(250);
            $('#contentlist').hide(250);
          });
        });
      }
    });
  });

  $('#menu-queue').on('click', function() {
    gotoPageById('#container-queue');
    setActiveMenu('#menu-queue');
  });

  if (window.location.hash) {
    gotoPageById(window.location.hash);
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
    $(id).addClass('menu-active');
    $currMenu.removeClass('menu-active');
    activemenu = id;
  }
}