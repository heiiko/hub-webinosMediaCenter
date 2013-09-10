var $ = require('jquery');

function selectAllItems() {
  console.warn("select all");
  $('#mobilecontentlist').children().addClass('mobileselected');
  var count = $('#mobilecontentlist input:checkbox').prop("checked", true).length;
  updateSelectedCount(count);
}

function deselectAllItems() {
  console.warn("deselect all");
  $('#mobilecontentlist').children().removeClass('mobileselected');
  $('#mobilecontentlist input:checkbox').prop("checked", false);
  updateSelectedCount(0);
}

function updateSelectedCount(count) {
  $('#select-media-dd-count').text(count + ' files selected');
}

function SelectDropDown() {
  $('#select-media-dd-count').click(function() {
    $('#select-media-dd-menu li').removeClass('dd-selected');
    $('#select-media-dd-menu').toggle();
  });

  $('#select-media-dd-menu li').click(function() {
    $(this).addClass('dd-selected');
    switch (this.id) {
      case 'select-media-dd-all':
        selectAllItems();
        break;
      case 'select-media-dd-none':
        deselectAllItems();
        break;
      default:
        break;
    }
    $('#select-media-dd-menu').slideUp(500);
  });

}

module.exports = SelectDropDown;

