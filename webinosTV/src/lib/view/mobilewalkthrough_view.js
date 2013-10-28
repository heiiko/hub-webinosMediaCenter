var $ = require('jquery');

var currentpage = '#wt-welcome';
var gotoCorePageById = require('./pagetransition.js');

$(document).ready(function() {
  init();
});

function init() {
  $(currentpage).addClass('wt-page-current');

  $('#start-app-1').on('click', function() {
    gotoCorePageById("#mobilebrowser");
  });
  
  $('#start-app-2').on('click', function() {
    gotoCorePageById("#mobilebrowser");
  });
  
  $('#start-wt-1').on('click', function() {
    gotoWTPageById("#wt-1");
  });
  
  $('#start-wt-2').on('click', function() {
    gotoWTPageById("#wt-2");
  });
  
  $('#start-wt-3').on('click', function() {
    gotoWTPageById("#wt-3");
  });
  
  $('#start-wt-4').on('click', function() {
    gotoWTPageById("#wt-4");
  });
  
  $('#back-wt-1').on('click', function() {
    gotoWTPageById("#wt-1");
  });
  
  $('#back-wt-2').on('click', function() {
    gotoWTPageById("#wt-2");
  });
  
  $('#back-wt-3').on('click', function() {
    gotoWTPageById("#wt-3");
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