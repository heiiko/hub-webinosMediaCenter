var $ = require('jquery');
var _ = require('underscore');
var IScroll = require('iscroll');
require('./pagetransition.js');

var sourceScroll;
var mediatypScroll;
var targetScroll;
var queueScroll;
var horizontalScroll;
var contentScroll;

$(window).resize(function() {
  calcSize();
});

$(document).ready(function() {
  $('.albumhead').click(function() {
    if ($(this).next('ul').is(":visible")) {
      $(this).children('img').attr("src", "images/arrow_big_down.svg");
    } else {
      $(this).children('img').attr("src", "images/arrow_big_up.svg");
    }
    $(this).next('ul').toggle();
    contentScroll.refresh();
  });

  calcSize();
});

function calcSize() {
  var width = $(window).innerWidth();
  var height = $(window).innerHeight();
  var buttonWidth;
  if (width <= 400) {
    buttonWidth = width * 0.9 / 2;
    $('.buttonlist li').outerHeight(buttonWidth / 1.6);
    $('#horizontalscroller').width(buttonWidth * 8);
  } else if (width < 600) {
    buttonWidth = width * 0.9 / 3;
    $('.buttonlist li').outerHeight(buttonWidth / 1.6);
    $('#horizontalscroller').width(buttonWidth * 8);
  } else if (width < 960) {
    buttonWidth = width * 0.9 / 4;
    $('.buttonlist li').outerHeight(buttonWidth / 1.6);
    $('#horizontalscroller').width(buttonWidth * 8);
  } else if (width < 1200) {
    buttonWidth = width * 0.9 / 6;
    $('.buttonlist li').outerHeight(buttonWidth / 1.6);
    $('#horizontalscroller').width(buttonWidth * 8);
  } else {
    buttonWidth = width * 0.9 / 8;
    $('.buttonlist li').outerHeight(buttonWidth / 1.6);
    $('#horizontalscroller').width(buttonWidth * 8);
  }

    //vertikal zentrieren
    $('#horizontalwrapper').height(height * 0.9);
    $('#horizontalwrapper').css('margin-top', -(height * 0.45));

    $('#verticalwrapper').height(height * 0.9 - 20);
    $('#playmodewrapper li').outerHeight((height * 0.45) - 5);
  }

  function loaded() {
    //sourceScroll = new IScroll('#sourcewrapper', {snap: 'li', momentum: false});
    mediatypScroll = new IScroll('#mediatypwrapper', {snap: 'li', momentum: false});
    //contentScroll = new IScroll('#contentwrapper', {snap: 'li', momentum: false});
    //targetScroll = new IScroll('#targetwrapper', {snap: 'li', momentum: false});
    queueScroll = new IScroll('#queuewrapper', {snap: 'li', momentum: false});
    horizontalScroll = new IScroll('#horizontalwrapper', {snap: 'ul', scrollX: true, scrollY: false, momentum: false});
  }

  document.addEventListener('touchmove', function(e) {
    e.preventDefault();
  }, false);

  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loaded, 800);
  }, false);

  function BrowserView(viewModel) {
    this.viewModel = viewModel;

    this.viewModel.sources().onValue(function (sources) {
      var $sourceList = $('#sourcelist');
      $sourceList.empty();

      _.each(sources, function (source) {
        $sourceList.append($('<li><img src="images/tv.svg"><p>' + source.address() + '</p></li>'));
      });

      if (sources.length > 0) {
        if (!sourceScroll) {
          sourceScroll = new IScroll('#sourcewrapper', {snap: 'li', momentum: false});
        }
        sourceScroll.refresh();
      }
    });

    this.viewModel.content().onValue(function (content) {
      var $contentList = $('#contentlist');
      $contentList.empty();

      _.each(content, function (item) {
        $contentList.append($('<li><p>' + item.title + '</p></li>'));
      });

      if (content.length > 0) {
        if (!contentScroll) {
          contentScroll = new IScroll('#contentwrapper', {snap: 'li', momentum: false});
        }
        contentScroll.refresh();
      }
    });

    this.viewModel.targets().onValue(function (targets) {
      var $targetList = $('#targetlist');
      $targetList.empty();

      _.each(targets, function (target) {
        $targetList.append($('<li><img src="images/tv.svg"><p>' + target.address() + '</p></li>'));
      });

      if (targets.length > 0) {
        if (!targetScroll) {
          targetScroll = new IScroll('#targetwrapper', {snap: 'li', momentum: false});
        }
        targetScroll.refresh();
      }
    });
  }

  module.exports = BrowserView;
