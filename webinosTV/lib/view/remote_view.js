var $ = require('jquery');

$(window).resize(function() {
  calcSize();
});

$(document).ready(function() {
  calcSize();
});

function calcSize() {
    var backButtonheight = $(".backButton").height();
    var tapButtonheight = $(".tapButton").height();
    $(".tapButton").css({left: backButtonheight*0.26});
    $(".clickAreaBack").css({width: backButtonheight*0.26});
    $(".clickAreaUp").css({width: tapButtonheight*0.35, height: tapButtonheight*0.35, left: tapButtonheight*0.325, top:0});
    $(".clickAreaDown").css({width: tapButtonheight*0.35, height: tapButtonheight*0.35, left: tapButtonheight*0.325, top:(tapButtonheight*0.325+tapButtonheight*0.325)});
    $(".clickAreaLeft").css({width: tapButtonheight*0.35, height: tapButtonheight*0.35, top: tapButtonheight*0.325, left:0});
    $(".clickAreaRight").css({width: tapButtonheight*0.35, height: tapButtonheight*0.35, top: tapButtonheight*0.325, left:(tapButtonheight*0.325+tapButtonheight*0.325)});
    $(".clickAreaOk").css({width: tapButtonheight*0.25, height: tapButtonheight*0.25, left: tapButtonheight*0.375, top:tapButtonheight*0.375});
}

function NavigationView (viewModel) {

  viewModel.input().onValue(Navigate);

  function Navigate(direction) {
    switch(direction){
      case 'left':
        window.openMainmenu();
        break;
    }
  }

  function navlog(direction) {
    console.log(direction);
  }
}


function RemoteView(viewModel) {
  var navigationView = new NavigationView(viewModel);

  viewModel.enter().plug($('.clickAreaOk').asEventStream('click').merge($('.clickAreaOk').asEventStream('touchend')));
  viewModel.left().plug($('.clickAreaLeft').asEventStream('click').merge($('.clickAreaLeft').asEventStream('touchend')));
  viewModel.up().plug($('.clickAreaUp').asEventStream('click').merge($('.clickAreaUp').asEventStream('touchend')));
  viewModel.right().plug($('.clickAreaRight').asEventStream('click').merge($('.clickAreaRight').asEventStream('touchend')));
  viewModel.down().plug($('.clickAreaDown').asEventStream('click').merge($('.clickAreaDown').asEventStream('touchend')));
}

module.exports = RemoteView;
