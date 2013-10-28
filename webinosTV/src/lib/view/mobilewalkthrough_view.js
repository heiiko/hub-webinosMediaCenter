var $ = require('jquery');

var currentpage = '#wt-welcome';
var gotoCorePageById = require('./pagetransition.js');

$(document).ready(function() {
  init();
});

function init() {
  $(currentpage).addClass('wt-page-current');

  $('#close-wt').on('click', function() {
    gotoCorePageById("#mobilebrowser");
  });
  
  $('#start-wt').on('click', function() {
    gotoWTPageById("#wt-1");
  });
}


function gotoWTPageById(id) {
  if (currentpage !== id) {
    var $currPage = $(currentpage);
    $(id).addClass('wt-page-current');
    $currPage.removeClass('wt-page-current');
    currentpage = id;
  }
}