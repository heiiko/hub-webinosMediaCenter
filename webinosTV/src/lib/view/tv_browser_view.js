var $ = require('jquery');
var _ = require('../util/objectscore.coffee');
var address = require('../util/address.coffee');
var Bacon = require('baconjs');
require('scrollToJS');
var util = require('util');

var TV_Toast = require('./tv_toast_view.js');
var Select_View = require('./tv_select_view.js');
var TVControlsView = require('./tv_controls_view.js');
var controlsView;
var controlsViewModel;
var contentSelected = false;
var targetSelected = false;

function friendlyName(info) {
  if (info.type === 'upnp') {
    return info.service.displayName();
  } else {
    return address.friendlyName(info.device.address());
  }
}

function ListView(items, selection, list, wrapper, fadeout) {
  var self = this;

  items.onValue(function(items) {
    var $list = $(list);
    var counter = 0;
    $list.empty();

    _.each(items, function(item) {
      var $item = $(self.htmlify(item));
      var id = self.identify(item);
      $item.data('id', id);
      if (list === '#mobiletargetlist')
        $item.data('local', item.device.isLocal());
      else if (list === '#mobilecategorylist')
        $item.data('index', counter);
      $list.append($item);
      counter++;
    });
  });

  selection.apply(items.map(function(items) {
    return function(selection) {
      if (list === '#mobilequeuetargetlist' && items.length >= 1 && selection.length === 0) {
        return [self.identify(items[0])];
      }
      else {
        return _.ointersection(selection, _.map(items, function(item) {
          return self.identify(item);
        }));
      }
    };
  }));

  selection.apply($(list).asEventStream('click').map(function(event) {
    return function(selection) {
      var $item = $(event.target).closest('li');
      if (!$item.length)
        return selection;
      var id = $item.data('id');
      if (list === '#mobilecategorylist' || list === '#mobilequeuetargetlist') {
        return [id];
      }
      else {
        return (_.ocontains(selection, id) ? _.odifference : _.ounion)(selection, [id]);
      }
    };
  }));

  selection.onValue(function(selection) {
    $('li', list).each(function() {
      var $item = $(this);
      var id = $item.data('id');
      var selected = _.ocontains(selection, id);

      if (selected && list === '#mobilecategorylist') {
        var index = $item.data('index');
        var num_categories = $(list).children().length;
        var position = (100 / num_categories / 2) + (index) * (100 / num_categories);

        if (! $('#sel-arrows-style').length) {
          $('head').append('<style id="sel-arrows-style" type="text/css"></style>');
        }
        $('#sel-arrows-style').html('@media screen and (min-width: 1200px){.arrow_box:after{top:' + position + '%}.arrow_box:before{top:' + position + '%}}');
      }
      $item.toggleClass('mobileselected', selected).find('input:checkbox').prop('checked', function(idx, oldAttr) {
        return selected;
      });
    });
  });
}

util.inherits(SourceListView, ListView);
function SourceListView(viewModel) {
  this.htmlify = function(device) {
    return '<li class="device source nav_sl"><div class="device-image type-' + ((device.type()) ? device.type() : 'unknown') + '"></div><div class="device-name">' + address.friendlyName(device.address()) + '</div><div class="device-type">' + device.type() + '</div></li>';
  };

  this.identify = function(device) {
    return {
      address: device.address(),
      type: device.type()
    };
  };

  viewModel.selectedSources().onValue(function(selection) {
    if (selection.length === 1) {
      var device = selection[0];

      $('#current-source-logo').removeClass();
      $('#current-source-logo').addClass('device-image');
      $('#current-source-logo').addClass('type-' + (device.type ? device.type : 'unknown'));

      $('#selected-source').removeClass();
      $('#selected-source').addClass('device-image');
      $('#selected-source').addClass('type-' + (device.type ? device.type : 'unknown'));

      $('#selected-source-name').html(address.friendlyName(device.address));
      $('#selected-source-intro').html('You can select media from ');

      $('#wrapper-selected-source').addClass('header-active');

      $('#current-source-name').html(address.friendlyName(device.address));

      $('.content-searchbutton').removeClass('disabled');
      $('.content-searchbox').removeClass('disabled');
      $('#select-media-dd-wrapper').removeClass('disabled');
    }
    else if (selection.length === 0) {
      $('#current-source-logo').removeClass();
      $('#current-source-logo').addClass('device-image');
      $('#current-source-logo').addClass('type-none');

      $('#selected-source').removeClass();
      $('#selected-source').addClass('device-image');
      $('#selected-source').addClass('type-none');

      $('#selected-source-name').html('');
      $('#selected-source-intro').html('No source device selected');

      $('#wrapper-selected-source').removeClass('header-active');

      $('#current-source-name').html('Source devices');

      $('.content-searchbutton').addClass('disabled');
      $('.content-searchbox').addClass('disabled');
      $('.content-queuebutton').addClass('disabled');
      $('#select-media-dd-wrapper').addClass('disabled');
    }
    else {
      $('#selected-source').removeClass();
      $('#selected-source').addClass('device-image');
      $('#selected-source').addClass('type-unknown');

      $('#selected-source-name').html(selection.length + ' source devices');
      $('#selected-source-intro').html('You can select media from ');

      $('#current-source-logo').removeClass();
      $('#current-source-logo').addClass('device-image');
      $('#current-source-logo').addClass('type-unknown');
      $('#current-source-name').html(selection.length + ' Source devices');

      $('#wrapper-selected-source').addClass('header-active');

      $('.content-searchbutton').removeClass('disabled');
      $('.content-searchbox').removeClass('disabled');
      $('#select-media-dd-wrapper').removeClass('disabled');
    }
  });

  ListView.call(this, viewModel.sources(), viewModel.selectedSources(), '#mobilesourcelist', '#mobilesourcewrapper', '#mobilesource');
}

util.inherits(CategoryListView, ListView);
function CategoryListView(viewModel) {
  this.htmlify = function(category) {
    return '<li class="category nav_media_category category-type-' + category.id + '"><div class="category-image"></div><div class="category-name">' + category.title + '</div></li>';
  };

  this.identify = function(category) {
    return category.id;
  };

  viewModel.selectedCategories().onValue(function(selection) {
    viewModel.selectedContent().apply(viewModel.content().map(function(items) {
      return function(selection) {
        return [];
      };
    }));
  });

  ListView.call(this, viewModel.categories(), viewModel.selectedCategories(), '#mobilecategorylist', '#mobilecategorywrapper', '#mobilecategory');
}

util.inherits(ContentListView, ListView);
function ContentListView(viewModel) {
  this.htmlify = function(item) {
    var html;
    if (typeof item.type === 'string' && item.type.toLowerCase().indexOf('image') === 0) {
      html = '<li class="imglistitem nav_media_file">' +
        '<div class="imglistitem" style="background-image:url(\'' + item.thumbnailURIs[0] + '\')"></div>' +
        '<div class="imglistitem-title">' + item.title + '</div>' +
        '</li>';
    }
    else {
      var type = item.type.toLowerCase();
      var iconClass;
      switch (type) {
        case 'audio':
          iconClass = "song-icon";
          break;
        case 'video':
          iconClass = "clip-icon";
          break;
        default:
          iconClass = "default-icon";
      }
      html = '<li class="contentlistitem nav_media_file"><div class="itemcontainer">' +
        '<div class="chbx-container"><input type="checkbox" /></div>' +
        '<div class="' + iconClass + '"></div>' +
        '<div class="mediaitemcontent">' +
        '<div class="itemtitle">' + item.title + '</div>' +
        '<div class="itemartists">' + item.artists + '</div>' +
        '</div>' +
        '</div></li>';
    }
    return html;
  };

  this.identify = function(item) {
    return {
      device: item.device.address(),
      service: item.service.id(),
      item: {
        id: item.id,
        title: item.title
      }
    };
  };

  viewModel.selectedContent().onValue(function(selection) {
    var file = (selection.length === 1) ? 'file' : 'files';
    $('#select-media-dd-count').text(selection.length + ' ' + file + ' ' + 'selected');

    if (selection.length >= 1) {
      contentSelected = true;
      if(targetSelected) {
        $('.content-queuebutton').removeClass('disabled');
      }
    }
    else {
      contentSelected = false;
      $('.content-queuebutton').addClass('disabled');
    }
  });

  ListView.call(this, viewModel.content(), viewModel.selectedContent(), '#mobilecontentlist', '#mobilecontentwrapper', '#mobilecontent');
}

util.inherits(TargetListView, ListView);
function TargetListView(viewModel) {
  this.htmlify = function(value) {
    var icon = 'all_devices';
    if (value.type === 'upnp') {
      icon = 'tv';
    } else if (value.device.type()) {
      icon = value.device.type();
    }
    return '<li class="device target nav_tl"><div class="device-image type-' + icon + '"></div><div class="device-name">' + friendlyName(value) + '</div><div class="device-type">' + icon + '</div></li>';
  };

  this.identify = function(value) {
    return {
      device: value.device,
      service: value.service.id(),
      type: value.type
    };
  };

  viewModel.selectedTargets().onValue(function(selection) {
    if (selection.length === 1) {
      var value = selection[0];
      var icon = 'all_devices';
      if (value.type === 'upnp') {
        icon = 'tv';
      } else if (value.device.type()) {
        icon = value.device.type();
      }

      $('#wrapper-selected-target').addClass('header-active');

      $('#current-target-logo').removeClass();
      $('#current-target-logo').addClass('device-image');
      $('#current-target-logo').addClass('type-' + (value.device.type() ? value.device.type() : 'unknown'));
      $('#current-target-name').html(friendlyName(value));
    }
    else if (selection.length === 0) {
      $('#current-target-logo').removeClass();
      $('#current-target-logo').addClass('device-image');
      $('#current-target-logo').addClass('type-none');
      $('#current-target-name').html('Target devices');

      $('#wrapper-selected-target').removeClass('header-active');
    }
    else {
      $('#current-target-logo').removeClass();
      $('#current-target-logo').addClass('device-image');
      $('#current-target-logo').addClass('type-unknown');
      $('#current-target-name').html(selection.length + ' Target devices');

      $('#wrapper-selected-target').addClass('header-active');
    }

    if (selection.length >= 1) {
      targetSelected = true;
      if(contentSelected) {
        $('.content-queuebutton').removeClass('disabled');
      }
    }
    else {
      targetSelected = false;
      $('.content-queuebutton').addClass('disabled');
    }
  });

  viewModel.selectedQueueTargets().onValue(function(selection) {
    if(selection.length === 1) {
      var config = {'local': selection[0].device.isLocal(), 'remote': (selection[0].device.type() === 'laptop')};
      controlsView = new TVControlsView('.mobilequeuecontrols', config, controlsViewModel,viewModel.queue(), viewModel.selectedQueue());
    }
  });

  ListView.call(this, viewModel.targets(), viewModel.selectedTargets(), '#mobiletargetlist', '#mobiletargetwrapper', '#mobiletarget');
  ListView.call(this, viewModel.targets(), viewModel.selectedQueueTargets(), '#mobilequeuetargetlist', '#mobilequeuetargetwrapper', '#mobilequeuetarget');
}

util.inherits(QueueListView, ListView);
function QueueListView(viewModel) {
  this.htmlify = function(value) {
    var html;
    if (typeof value.item.type === 'string' && value.item.type.toLowerCase().indexOf('image') === 0) {
      html = '<li class="contentlistitem nav_queue_file"><div class="itemcontainer">' +
        '<div class="chbx-container"><input type="checkbox" /></div>' +
        '<div class="imglistitem" style="background-image:url(\'' + value.item.thumbnailURIs[0] + '\')"></div>' +
        '<div class="mediaitemcontent">' +
        '<div class="itemtitle">' + value.item.title + '</div>' +
        '</div>' +
        '<div class="status"><span class="statusicon"></span><span class="statustext"></span>' +
        '</div></div></li>';
    } else {
      var type = value.item.type.toLowerCase();
      var iconClass;
      switch (type) {
        case 'audio':
          iconClass = "song-icon";
          break;
        case 'video':
          iconClass = "clip-icon";
          break;
        default:
          iconClass = "default-icon";
      }
      //html = '<li><div class="' + iconClass + '"></div><div class="mediaitemcontent"><span class="itemtitle">' + value.item.title + '</span><span class="itemartists">' + value.item.artists + '</span></div><div class="status"><span class="statusicon"></span><span class="statustext"></span></div></li>';
      html = '<li class="contentlistitem nav_queue_file"><div class="itemcontainer">' +
        '<div class="chbx-container"><input type="checkbox" /></div>' +
        '<div class="' + iconClass + '"></div>' +
        '<div class="mediaitemcontent">' +
        '<div class="itemtitle">' + value.item.title + '</div>' +
        '<div class="itemartists">' + value.item.artists + '</div>' +
        '</div>' +
        '<div class="status">' +
        '<div class="statusicon"></div>' +
        '<div class="statustext"></div>' +
        '</div>' +
        '</div></li>';
    }
    return html;
  };

  this.identify = function(value) {
    return value.link;
  };

  viewModel.selectedQueue().onValue(function(selection) {
    // var file = (selection.length === 1) ? 'file' : 'files';
    // $('#select-media-dd-count').text(selection.length + ' ' + file + ' ' + 'selected');

    if (selection.length >= 1) {
      selectedQueue = true;
      if(targetSelected) {
        $('.controlDele').removeClass('disabled');
      }
    }
    else {
      selectedQueue = false;
      $('.controlDele').addClass('disabled');
    }
  });

  ListView.call(this, viewModel.queue(), viewModel.selectedQueue(), '#mobilequeuelist', '#mobilequeuewrapper', '#mobilequeue');
}

function NavigationView (viewModel) {
  var navigation = {
    "regions": [
      ".nav_menu",
      ".nav_sl",
      "#mobiletargetlist .nav_tl",
      ".nav_media_category",
      ".nav_media_action_file",
      ".nav_media_action",
      ".nav_media_file",
      ".nav_queue",
      "#mobilequeuetargetlist .nav_tl.device",
      ".nav_qu",
      ".nav_queue_file"
    ],
    "curCol": 0,
    "curEl": {
      ".nav_menu": 0,
      ".nav_sl": 0,
      "#mobiletargetlist .nav_tl": 0,
      ".nav_media_category": 0,
      ".nav_media_action_file": 1,
      ".nav_media_action": 0,
      ".nav_media_file": 0,
      ".nav_queue": 0,
      "#mobilequeuetargetlist .nav_tl.device": 0,
      ".nav_qu": 0,
      ".nav_queue_file": 0
    },
    "curScreen": 0,
  };

  // startNavWithTimeout();
  viewModel.input().onValue(Navigate);

  function Navigate(direction) {
    if (direction !== 'enter') {
      $(navigation["regions"][navigation["curCol"]]+".focus").removeClass('focus');
    }
    switch(direction){
      case 'down':
        if(navigation["curCol"] === 0 && navigation["curEl"][navigation["regions"][navigation["curCol"]]] < $(navigation["regions"][navigation["curCol"]]).length-1) {
          navigation["curEl"][navigation["regions"][navigation["curCol"]]]++;
        } else {
          if(navigation["curScreen"]===0) {
            // Device screen
            if(navigation["curCol"]==1) {
              if(navigation["curEl"][navigation["regions"][navigation["curCol"]]] < $(navigation["regions"][navigation["curCol"]]).length-1) {
                navigation["curEl"][navigation["regions"][navigation["curCol"]]]++;
              }
              $('#mobilesourcelist').scrollTo($(navigation["regions"][navigation["curCol"]]).eq(navigation["curEl"][navigation["regions"][navigation["curCol"]]]), {margin: true, over: -3});
            }

            if(navigation["curCol"]==2) {
              if(navigation["curEl"][navigation["regions"][navigation["curCol"]]] < $(navigation["regions"][navigation["curCol"]]).length-1) {
                navigation["curEl"][navigation["regions"][navigation["curCol"]]]++;
              }
              $('#mobiletargetlist').scrollTo($(navigation["regions"][navigation["curCol"]]).eq(navigation["curEl"][navigation["regions"][navigation["curCol"]]]), {margin: true, over: -3});
            }
            // if(navigation["curEl"][navigation["regions"][navigation["curCol"]]] < $(navigation["regions"][navigation["curCol"]]).length-1) {
            //   navigation["curEl"][navigation["regions"][navigation["curCol"]]]++;
            // }
          } else if(navigation["curScreen"]==1) {
            // Media screen
            if (navigation["curCol"] == 3) {
              if(navigation["curEl"][navigation["regions"][navigation["curCol"]]] < $(navigation["regions"][navigation["curCol"]]).length-1) {
                navigation["curEl"][navigation["regions"][navigation["curCol"]]]++;
              }
            } else if (navigation["curCol"] == 5) {
              if($(navigation["regions"][6]).length > 0) {
                navigation["curCol"] = 6;
                navigation["curEl"][navigation["regions"][4]]=1;
              }
            } else if (navigation["curCol"] == 6) {
              if(navigation["curEl"][navigation["regions"][navigation["curCol"]]] < $(navigation["regions"][navigation["curCol"]]).length-1) {
                navigation["curEl"][navigation["regions"][navigation["curCol"]]]++;
                $('#mobilecontentlist').scrollTo($(navigation["regions"][navigation["curCol"]]).eq(navigation["curEl"][navigation["regions"][navigation["curCol"]]]), {margin: true, over: -5});
              }
            }
          } else if(navigation["curScreen"]==2) {
            // Queue screen
            if (navigation["curCol"] == 8) {
              // In target bar going down
              navigation["curCol"] = 9;
              navigation["curEl"][navigation["regions"][7]]++;
            } else if (navigation["curCol"] == 9) {
              if($(navigation["regions"][10]).length > 0) {
                navigation["curCol"] = 10;
                navigation["curEl"][navigation["regions"][7]]++;
              }
            } else if (navigation["curCol"] == 10) {
              if(navigation["curEl"][navigation["regions"][navigation["curCol"]]] < $(navigation["regions"][navigation["curCol"]]).length-1) {
                navigation["curEl"][navigation["regions"][navigation["curCol"]]]++;
                $('#mobilequeuelist').scrollTo($(navigation["regions"][navigation["curCol"]]).eq(navigation["curEl"][navigation["regions"][navigation["curCol"]]]), {margin: true, over: -4});
              }
            }
          }
        }
        break;
      case 'up':
        if (navigation["curCol"] === 0 && navigation["curEl"][navigation["regions"][navigation["curCol"]]]>0) {
          navigation["curEl"][navigation["regions"][navigation["curCol"]]]--;
        } else {
          if(navigation["curScreen"]===0) {
            // Device screen
            if(navigation["curEl"][navigation["regions"][navigation["curCol"]]] > 0) {
              navigation["curEl"][navigation["regions"][navigation["curCol"]]]--;
            }

            if(navigation["curCol"]==1) {
              $('#mobilesourcelist').scrollTo($(navigation["regions"][navigation["curCol"]]).eq(navigation["curEl"][navigation["regions"][navigation["curCol"]]]), {margin: true, over: -3});
            }
            if(navigation["curCol"]==2) {
              $('#mobiletargetlist').scrollTo($(navigation["regions"][navigation["curCol"]]).eq(navigation["curEl"][navigation["regions"][navigation["curCol"]]]), {margin: true, over: -3});
            }
          } else if(navigation["curScreen"]==1) {
            // Media screen
            if (navigation["curCol"] == 3) {
              if(navigation["curEl"][navigation["regions"][navigation["curCol"]]] > 0) {
                navigation["curEl"][navigation["regions"][navigation["curCol"]]]--;
              }
            } else if (navigation["curCol"] == 5) {
            } else if (navigation["curCol"] == 6) {
              if(navigation["curEl"][navigation["regions"][navigation["curCol"]]] > 0) {
                navigation["curEl"][navigation["regions"][navigation["curCol"]]]--;
                $('#mobilecontentlist').scrollTo($(navigation["regions"][navigation["curCol"]]).eq(navigation["curEl"][navigation["regions"][navigation["curCol"]]]), {margin: true, over: -5});
              } else {
                navigation["curCol"] = 5;
                navigation["curEl"][navigation["regions"][4]]=0;
                if($('#select-media-dd-wrapper .nav_media_action:nth-child(1)').hasClass('disabled') &&
                  (navigation["curEl"][navigation["regions"][5]]===0)) {
                  navigation["curEl"][navigation["regions"][5]]=1;
                }
              }
            }
          } else if(navigation["curScreen"]==2) {
            // Queue screen
            if (navigation["curCol"] == 8) {
            } else if (navigation["curCol"] == 9) {
              // In action bar going up
              navigation["curCol"] = 8;
              navigation["curEl"][navigation["regions"][7]]--;
            } else if (navigation["curCol"] == 10) {
              if(navigation["curEl"][navigation["regions"][navigation["curCol"]]] > 0) {
                navigation["curEl"][navigation["regions"][navigation["curCol"]]]--;
                $('#mobilequeuelist').scrollTo($(navigation["regions"][navigation["curCol"]]).eq(navigation["curEl"][navigation["regions"][navigation["curCol"]]]), {margin: true, over: -5});
              } else {
                // In action bar going up
                navigation["curCol"] = 9;
                navigation["curEl"][navigation["regions"][7]]--;
              }
            }
          }
        }
        break;
      case 'right':
        if(navigation["curScreen"]===0) {
          // Device screen
          if (navigation["curCol"] < 2) {
            navigation["curCol"]++;
          }
        } else if(navigation["curScreen"]==1) {
          // Media screen
          if (navigation["curCol"] === 0) {
            // In left bar going right
            navigation["curCol"] = 3;
          } else if (navigation["curCol"] == 3) {
            // Going from categories to actions/files
            if (navigation["curEl"][navigation["regions"][4]]===0 || $(navigation["regions"][6]).length === 0) {
              navigation["curCol"] = 5;
              if($('#select-media-dd-wrapper .nav_media_action:nth-child(1)').hasClass('disabled') &&
                (navigation["curEl"][navigation["regions"][5]]===0)) {
                navigation["curEl"][navigation["regions"][5]]++;
              }
            } else {
              navigation["curCol"] = 6;
            }
          } else if (navigation["curCol"] == 5) {
            if(navigation["curEl"][navigation["regions"][navigation["curCol"]]] < $(navigation["regions"][navigation["curCol"]]).length-1) {
              navigation["curEl"][navigation["regions"][navigation["curCol"]]]++;
            }
          } else if (navigation["curCol"] == 6) {
            navigation["curCol"] = 5;
            if(!$('#select-media-dd-wrapper .nav_media_action:nth-child(1)').hasClass('disabled')) {
              navigation["curEl"][navigation["regions"][5]] = 0;
            }
          }
        } else if(navigation["curScreen"]==2) {
          // Queue screen
          if (navigation["curCol"] === 0) {
            // In left bar going right
            if (navigation["curEl"][navigation["regions"][7]]===0) {
              navigation["curCol"] = 8;
            } else if(navigation["curEl"][navigation["regions"][7]]==1) {
              navigation["curCol"] = 9;
            } else {
              navigation["curCol"] = 10;
            }
          } else if (navigation["curCol"] == 8) {
            if(navigation["curEl"][navigation["regions"][navigation["curCol"]]] < ($(navigation["regions"][navigation["curCol"]]).length - 1)) {
              navigation["curEl"][navigation["regions"][navigation["curCol"]]]++;
              $('#mobilequeuetargetlist').scrollTo($(navigation["regions"][navigation["curCol"]]).eq(navigation["curEl"][navigation["regions"][navigation["curCol"]]]-$(navigation["regions"][navigation["curCol"]]).length), {margin: true, axis: 'x', over: -2});
            }
          } else if (navigation["curCol"] == 9) {
            if(navigation["curEl"][navigation["regions"][navigation["curCol"]]] < $(navigation["regions"][navigation["curCol"]]).length-1) {
              if($(navigation["regions"][navigation["curCol"]]).eq(navigation["curEl"][navigation["regions"][navigation["curCol"]]]+1).hasClass('disabled')) {
                navigation["curEl"][navigation["regions"][navigation["curCol"]]]++;
              }
              navigation["curEl"][navigation["regions"][navigation["curCol"]]]++;
            }
          }
        }
        break;
      case 'left':
        if(navigation["curScreen"]===0) {
          // Device screen
          if (navigation["curCol"] > 0) {
            navigation["curCol"]--;
          }
        } else if(navigation["curScreen"]==1) {
          // Media screen
          if (navigation["curCol"] == 3) {
            // In category bar going left
            navigation["curCol"] = 0;
          } else if (navigation["curCol"] == 5) {
            // Going from actions/files to categories
            if (navigation["curEl"][navigation["regions"][5]]===0) {
              navigation["curCol"] = 3;
            } else {
              // Within actions
              elementToCheckNr = navigation["curEl"][navigation["regions"][navigation["curCol"]]]-1;
              while($('#select-media-dd-wrapper .nav_media_action:nth-child(' + (elementToCheckNr+1) + ')').hasClass('disabled') &&
                (elementToCheckNr >= 0)) {
                elementToCheckNr--;
              }
              if (elementToCheckNr < 0) {
                navigation["curCol"] = 3;
              } else {
                navigation["curEl"][navigation["regions"][navigation["curCol"]]] = elementToCheckNr;
              }
            }
          } else if (navigation["curCol"] == 6) {
            navigation["curCol"] = 3;
          }
        } else if(navigation["curScreen"]==2) {
          // Queue screen
          if (navigation["curCol"] == 8) {
            // Going from targets to menu
            if (navigation["curEl"][navigation["regions"][8]]===0) {
              navigation["curCol"] = 0;
            } else {
              navigation["curEl"][navigation["regions"][navigation["curCol"]]]--;
              $('#mobilequeuetargetlist').scrollTo($(navigation["regions"][navigation["curCol"]]).eq(navigation["curEl"][navigation["regions"][navigation["curCol"]]]-$(navigation["regions"][navigation["curCol"]]).length), {margin: true, axis: 'x', over: -2});
            }
          } else if (navigation["curCol"] == 9) {
            if(navigation["curEl"][navigation["regions"][navigation["curCol"]]] > 0) {
              if($(navigation["regions"][navigation["curCol"]]).eq(navigation["curEl"][navigation["regions"][navigation["curCol"]]]-1).hasClass('disabled')) {
                navigation["curEl"][navigation["regions"][navigation["curCol"]]]--;
              }
              navigation["curEl"][navigation["regions"][navigation["curCol"]]]--;
            } else {
              navigation["curCol"] = 0;
            }
          } else if (navigation["curCol"] == 10) {
            navigation["curCol"] = 0;
          }
        }
        break;
      case 'enter':
        tappedOn=Date.now();
        $(navigation["regions"][navigation["curCol"]]+".focus").click();
        if(navigation["curCol"] === 0) {
          // From main menu to one of the 3 main screens
          navigation["curScreen"] = navigation["curEl"][navigation["regions"][navigation["curCol"]]];
          // if(navigation["curScreen"] == 1) {
          //   navigation["curCol"] = 3;
          //   $(navigation["regions"][0]+".focus").removeClass('focus');
          // }
        } else if(navigation["curCol"] == 1) {
          if($(navigation["regions"][2]).length > 0) {
            navigation["curCol"] = 2;
            $(navigation["regions"][1]+".focus").removeClass('focus');
          }
        } else if(navigation["curCol"] == 3) {
          // From categories to file list
          if(navigation["curScreen"] == 1) {
            if($(navigation["regions"][6]).length > 0) {
              navigation["curCol"] = 6;
            } else {
              navigation["curCol"] = 5;
              if($('#select-media-dd-wrapper .nav_media_action:nth-child(1)').hasClass('disabled') &&
                (navigation["curEl"][navigation["regions"][5]]===0)) {
                navigation["curEl"][navigation["regions"][5]]++;
              }
            }
            $(navigation["regions"][3]+".focus").removeClass('focus');
          }
        }
        break;
    }
    // console.debug("col: " + navigation["curCol"]);
    // console.debug("class: " + navigation["regions"][navigation["curCol"]]);
    // console.debug("curEl: " + navigation["curEl"][navigation["regions"][navigation["curCol"]]]);
    // console.debug("curScreen: " + navigation["curScreen"]);
    $(navigation["regions"][navigation["curCol"]]).eq(navigation["curEl"][navigation["regions"][navigation["curCol"]]]).addClass('focus');
  }

  function startNavWithTimeout(){
    timeoutHandle = window.setTimeout(function(){
      if ($(navigation["regions"][1]).length > 0) {
        $(navigation["regions"][0]+".focus").removeClass('focus');
        $(navigation["regions"][navigation["curCol"]]).eq(navigation["curEl"][navigation["regions"][navigation["curCol"]]]).addClass('focus');
      } else {
        navigation["curCol"] = 0;
      }
    }, 500);
  }
}


function TVBrowserView(viewModel) {
  var sourceListView = new SourceListView(viewModel);
  var categoryListView = new CategoryListView(viewModel);
  var contentListView = new ContentListView(viewModel);
  var targetListView = new TargetListView(viewModel);
  var queueListView = new QueueListView(viewModel);
  var select_view = new Select_View(viewModel.content(), viewModel.selectedContent());

  var navigationView = new NavigationView(viewModel);

  viewModel.append().plug($('#tv-append').asEventStream('click'));

  controlsViewModel = viewModel.controls();
  controlsView = new TVControlsView('.mobilequeuecontrols', null, controlsViewModel, viewModel.queue(), viewModel.selectedQueue());

  $('.content-queuebutton').click(function() {
    if(! $(this).hasClass('disabled')) {
      // TODO: add number of files added
      var t = new TV_Toast('Media files are added to your queue');
    }
  });
}

module.exports = TVBrowserView;
