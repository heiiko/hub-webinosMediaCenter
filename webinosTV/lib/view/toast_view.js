var $ = require('jquery');


function Toast(message, duration, fadetime) {
  var t = fadetime | 400;
  var d = duration | 5000;
  $('body').append('<div id="toast" class="toast"><p>' + message + '</p></div>');
  $('#toast').fadeIn(t).delay(d).fadeOut(t, function() {
    $(this).remove();
  });
}
module.exports = Toast;
