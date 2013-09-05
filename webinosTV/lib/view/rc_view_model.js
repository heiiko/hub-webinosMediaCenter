var _ = require('underscore');

var Bacon = require('baconjs');
var bjq = require('bacon.jquery');

function RCViewModel(manager, input) {
  input = input.filter(function () {
    return $('.pt-page-current').attr('id') === 'controller' && !$('.menu').is(":visible");
  });

  this.input = function () {
    return input;
  };
}

module.exports = RCViewModel;
