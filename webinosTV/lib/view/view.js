$ = require('jquery');
IScroll = require('iscroll');

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
    setTimeout(function() {
        sourceScroll = new IScroll('#sourcewrapper', {snap: 'li', momentum: true});
        mediatypScroll = new IScroll('#mediatypwrapper', {snap: 'li', momentum: true});
        contentScroll = new IScroll('#contentwrapper', {snap: 'li', momentum: true});
        targetScroll = new IScroll('#targetwrapper', {snap: 'li', momentum: false});
        queueScroll = new IScroll('#queuewrapper', {snap: 'li', momentum: false});
        horizontalScroll = new IScroll('#horizontalwrapper', {snap: 'ul', scrollX: true, scrollY: false, momentum: false});
    }, 500 );
}

document.addEventListener('touchmove', function(e) {
    e.preventDefault();
}
, false);

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loaded, 200);
}, false);
