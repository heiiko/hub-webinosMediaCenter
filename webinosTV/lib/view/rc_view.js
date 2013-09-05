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
  $(document).keydown(function(e) {
    switch (e.keyCode) {
      case 37:
        Navigate('left');
        navlog("nav_left");
        return false;
    }
  });

  function Navigate(direction) {
    switch(direction){
      case 'left':
        window.toggleMainmenu();
        break;
    }
  }

  function navlog(direction) {
    console.log(direction);
  }
}


function RCView(viewModel) {
  this.viewModel = viewModel;
  // var navigationView = new NavigationView(viewModel);
}

module.exports = RCView;
