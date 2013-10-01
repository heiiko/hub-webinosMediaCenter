var $ = require('jquery');
var _ = require('../util/objectscore.coffee'); // require('underscore');
var address = require('../util/address.coffee');
var Bacon = require('baconjs');
var util = require('util');

var TV_Toast = require('./tv_toast_view.js');
var Select_View = require('./tv_select_view.js');
var TVControlsView = require('./tv_controls_view.js');

function ListView(items, selection, list, wrapper, fadeout) {
  var self = this;

  this.refresh = function() {
    if ($(list).children().length > 0) {
      //if (typeof self.scroll === 'undefined') {
      //self.scroll = new IScroll(wrapper, {snap: list + ' li', momentum: false});
      // scroll.on('scrollEnd', function(){
      //   if(scroll.y >= 0){
      //     $(fadeout + 'topfadeout').hide();
      //   }else{
      //     $(fadeout + 'topfadeout').show();
      //   }
      //   if(scroll.y <= ($(wrapper).height() - $(list).height())){
      //     $(fadeout + 'bottomfadeout').hide();
      //   }else{
      //     $(fadeout + 'bottomfadeout').show();
      //   }
      // });
      //}
      //self.scroll.options.snap = document.querySelectorAll(list + ' li');
      //self.scroll.refresh();

      //Fittext, currently to expensive.
      //$("li p").fitText(0.8);
    }
  };

  items.onValue(function(items) {
    var $list = $(list);
    $list.empty();

    _.each(items, function(item) {
      var $item = $(self.htmlify(item));
      var id = self.identify(item);
      $item.data('id', id);
      if (list === '#mobiletargetlist')
        $item.data('local', item.isLocal());
      $list.append($item);
    });
    self.refresh();
  });

  selection.apply(items.map(function(items) {
    return function(selection) {
      return _.ointersection(selection, _.map(items, function(item) {
        return self.identify(item);
      }));
    };
  }));

  $(list).asEventStream('mousedown').merge($(list).asEventStream('touchstart')).onValue(function() {
    tappedOn = Date.now();
  });

  selection.apply($(list).asEventStream('click').merge($(list).asEventStream('touchend')).filter(function() {
    var justClick = (Date.now() - tappedOn < 250);
    return justClick;
  }).map(function(event) {
    return function(selection) {
      var $item = $(event.target).closest('li');
      if (!$item.length)
        return selection;
      var id = $item.data('id');
      if (list === '#mobilecategorylist' || list === '#mobilequeuetargetlist') {
        return [id];
      }
      else if (list === '#mobiletargetlist') {
        return (_.ocontains(selection, id)) ? [] : [id];
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
      $item.toggleClass('mobileselected', selected).find('input:checkbox').prop('checked', function(idx, oldAttr) {
        return selected;
      });
    });
  });
}

util.inherits(SourceListView, ListView);
function SourceListView(viewModel) {
  this.htmlify = function(device) {
    return '<li class="device source nav_sl"><div class="device-image type-' + device.type() + '"></div><div class="device-name">' + address.friendlyName(device.address()) + '</div><div class="device-type">' + device.type().charAt(0).toUpperCase() + device.type().slice(1) + '</div></li>';
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

      $('#selected-source').attr('src', 'images/' + device.type + '-selected.svg');
      $('#selected-source-name').html(address.friendlyName(device.address));
      $('#selected-source-intro').html('You can select media from');

      $('#wrapper-selected-source').removeClass('header-active');
      $('#wrapper-selected-target').addClass('header-active');

      $('#current-source-logo').attr('src', 'images/' + device.type + '.svg');
      $('#current-source-name').html(address.friendlyName(device.address));

      $('.content-searchbutton').removeClass('disabled');
      $('.content-searchbox').removeClass('disabled');
      $('#select-media-dd-wrapper').removeClass('disabled');
    }
    else if (selection.length === 0) {
      $('#selected-source').attr('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==');
      $('#selected-source-name').html('');
      $('#selected-source-intro').html('No source device selected');

      $('#wrapper-selected-source').addClass('header-active');
      $('#wrapper-selected-target').removeClass('header-active');

      $('#current-source-logo').attr('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==');
      $('#current-source-name').html('Source devices');

      $('.content-searchbutton').addClass('disabled');
      $('.content-searchbox').addClass('disabled');
      $('.content-queuebutton').addClass('disabled');
      $('#select-media-dd-wrapper').addClass('disabled');
    }
    else {
      $('#selected-source').attr('src', 'images/all_devices-selected.svg');
      $('#selected-source-name').html(selection.length + ' source devices');
      $('#selected-source-intro').html('You can select media from');

      $('#current-source-logo').attr('src', 'images/all_devices.svg');
      $('#current-source-name').html(selection.length + ' Source devices');

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
  this.htmlify = function(value) {
    var html;
    if (typeof value.item.type === 'string' && value.item.type.toLowerCase().indexOf('image') === 0)
    {
      html = '<li class="imglistitem nav_media_file">' +
        '<div class="imglistitem" style="background-image:url(\'' + value.item.thumbnailURIs[0] + '\')"></div>' +
        '<div class="imglistitem-title">' + value.item.title + '</div>' +
        '</li>';
    }
    else {
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
      html = '<li class="contentlistitem nav_media_file"><div class="itemcontainer">' +
        '<div class="chbx-container"><input type="checkbox" /></div>' +
        '<div class="' + iconClass + '"></div>' +
        '<div class="mediaitemcontent">' +
        '<div class="itemtitle">' + value.item.title + '</div>' +
        '<div class="itemartists">' + value.item.artists + '</div>' +
        '</div>' +
        '</div>';
    }
    return html;
  };

  this.identify = function(value) {
    return {
      source: value.source.address(),
      item: {
        id: value.item.id,
        title: value.item.title
      }
    };
  };

  viewModel.selectedContent().onValue(function(selection) {
    var file = (selection.length === 1) ? 'file' : 'files';
    $('#select-media-dd-count').text(selection.length + ' ' + file + ' ' + 'selected');

    if (selection.length >= 1) {
      $('.content-queuebutton').removeClass('disabled');
    }
    else {
      $('.content-queuebutton').addClass('disabled');
    }
  });

  ListView.call(this, viewModel.content(), viewModel.selectedContent(), '#mobilecontentlist', '#mobilecontentwrapper', '#mobilecontent');
}

util.inherits(TargetListView, ListView);
function TargetListView(viewModel) {
  this.htmlify = function(device) {
    return '<li class="device target nav_tl"><div class="device-image type-' + device.type() + '"></div><div class="device-name">' + address.friendlyName(device.address()) + '</div><div class="device-type">' + device.type().charAt(0).toUpperCase() + device.type().slice(1) + '</div></li>';
  };

  this.identify = function(device) {
    return {
      address: device.address(),
      type: device.type()
    };
  };

  viewModel.selectedTargets().onValue(function(selection) {
    if (selection.length === 1) {
      var device = selection[0];

      $('#current-target-logo').attr('src', 'images/' + device.type + '.svg');
      $('#current-target-name').html(address.friendlyName(device.address));

      $('#selected-target').attr('src', 'images/' + device.type + '-selected.svg');
      $('#selected-target-name').html(address.friendlyName(device.address));
      $('#selected-target-intro').html('You are controlling');
    }
    else if (selection.length === 0) {
      $('#current-target-logo').attr('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==');
      $('#current-target-name').html('Target devices');

      $('#selected-target').attr('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==');
      $('#selected-target-name').html('');
      $('#selected-target-intro').html('No target device selected');
    }
    else {
      $('#current-target-logo').attr('src', 'images/all_devices.svg');
      $('#current-target-name').html(selection.length + ' Target devices');

      $('#selected-target').attr('src', 'images/all_devices-selected.svg');
      $('#selected-target-name').html(selection.length + ' source devices');
      $('#selected-target-intro').html('You are controlling');
    }
  });

  ListView.call(this, viewModel.targets(), viewModel.selectedTargets(), '#mobiletargetlist', '#mobiletargetwrapper', '#mobiletarget');
  ListView.call(this, viewModel.targets(), viewModel.selectedTargets(), '#mobilequeuetargetlist', '#mobilequeuetargetwrapper', '#mobilequeuetarget');
}

util.inherits(QueueListView, ListView);
function QueueListView(viewModel) {
  this.htmlify = function(value) {
    var html;
    if (typeof value.item.type === 'string' && value.item.type.toLowerCase().indexOf('image') === 0) {
      html = '<li><div class="image-icon"><img src="' + value.item.thumbnailURIs[0] + '"></div><div class="mediaitemcontent"><span class="imagetitle">' + value.item.title + '</span></div><div class="status"></div></li>';
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
      html = '<li class="contentlistitem"><div class="itemcontainer">' +
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
        '</div>';
    }
    return html;
  };

  this.identify = function(value) {
    return value.link;
  };

  ListView.call(this, viewModel.queue(), viewModel.selectedQueue(), '#mobilequeuelist', '#mobilequeuewrapper', '#mobilequeue');
}

function NavigationView (viewModel, listViews) {
  var navigation = {
    "regions": [
      ".nav_menu",
      ".nav_sl",
      ".nav_tl",
      ".nav_media_category",
      ".nav_media_action_file",
      ".nav_media_action",
      ".nav_media_file",
      ".nav_queue",
      ".nav_queue_target",
      ".nav_queue_action",
      ".nav_queue_file"
    ],
    "curCol": 1,
    "curEl": {
      ".nav_menu": 0,
      ".nav_sl": 0,
      ".nav_tl": 0,
      ".nav_media_category": 0,
      ".nav_media_action_file": 1,
      ".nav_media_action": 0,
      ".nav_media_file": 0,
      ".nav_queue": 0,
      ".nav_queue_target": 0,
      ".nav_queue_action": 0,
      ".nav_queue_file": 0
    },
    "curScreen": 0,
  };

  startNavWithTimeout();
  viewModel.input().onValue(Navigate);

  function Navigate(direction) {
    if (direction !== 'enter') {
      $(navigation["regions"][navigation["curCol"]]+".focus").removeClass('focus');
    }
    switch(direction){
      case 'down':
        if(navigation["curCol"] == 0 && navigation["curEl"][navigation["regions"][navigation["curCol"]]] < $(navigation["regions"][navigation["curCol"]]).length-1) {
          navigation["curEl"][navigation["regions"][navigation["curCol"]]]++;
        } else {
          if(navigation["curScreen"]==0) {
            // Device screen
            if(navigation["curCol"]==2) {
              if(navigation["curEl"][navigation["regions"][navigation["curCol"]]] < $(navigation["regions"][navigation["curCol"]]).length/2-1) {
                navigation["curEl"][navigation["regions"][navigation["curCol"]]]++;
              }
            } else if(navigation["curEl"][navigation["regions"][navigation["curCol"]]] < $(navigation["regions"][navigation["curCol"]]).length-1) {
              navigation["curEl"][navigation["regions"][navigation["curCol"]]]++;
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
              }
            }
          }
        }
        break;
      case 'up':
        if (navigation["curCol"] == 0 && navigation["curEl"][navigation["regions"][navigation["curCol"]]]>0) {
          navigation["curEl"][navigation["regions"][navigation["curCol"]]]--;
        } else {
          if(navigation["curScreen"]==0) {
            // Device screen
            if(navigation["curEl"][navigation["regions"][navigation["curCol"]]] > 0) {
              navigation["curEl"][navigation["regions"][navigation["curCol"]]]--;
            }
          } else if(navigation["curScreen"]==1) {
            // Media screen
            if (navigation["curCol"] == 3) {
              if(navigation["curEl"][navigation["regions"][navigation["curCol"]]] > 0) {
                navigation["curEl"][navigation["regions"][navigation["curCol"]]]--;
              }
            } else if (navigation["curCol"] == 5) {
            } else if (navigation["curCol"] == 6) {
                console.debug("test1");
              if(navigation["curEl"][navigation["regions"][navigation["curCol"]]] > 0) {
                navigation["curEl"][navigation["regions"][navigation["curCol"]]]--;
              } else {
                navigation["curCol"] = 5;
                navigation["curEl"][navigation["regions"][4]]=0;
              }
            }
          }
        }
        break;
      case 'right':
        if(navigation["curScreen"]==0) {
          // Device screen
          if (navigation["curCol"] < 2) {
            navigation["curCol"]++;
          }
        } else if(navigation["curScreen"]==1) {
          // Media screen
          if (navigation["curCol"] == 0) {
            // In left bar going right
            navigation["curCol"] = 3;
          } else if (navigation["curCol"] == 3) {
            // Going from categories to actions/files
            if (navigation["curEl"][navigation["regions"][4]]==0 || $(navigation["regions"][6]).length == 0) {
              navigation["curCol"] = 5;
              if($('#select-media-dd-wrapper .nav_media_action:nth-child(1)').hasClass('disabled') 
                && (navigation["curEl"][navigation["regions"][5]]==0)) {
                navigation["curEl"][navigation["regions"][5]]++;
              }
            } else {
              navigation["curCol"] = 6;
            }
          } else if (navigation["curCol"] == 5) {
            if(navigation["curEl"][navigation["regions"][navigation["curCol"]]] < $(navigation["regions"][navigation["curCol"]]).length-1) {
              navigation["curEl"][navigation["regions"][navigation["curCol"]]]++;
            }
          }
        }
        break;
      case 'left':
        if(navigation["curScreen"]==0) {
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
            if (navigation["curEl"][navigation["regions"][5]]==0) {
              navigation["curCol"] = 3;
            } else {
              // Within actions
              elementToCheckNr = navigation["curEl"][navigation["regions"][navigation["curCol"]]]-1;
              while($('#select-media-dd-wrapper .nav_media_action:nth-child(' + (elementToCheckNr+1) + ')').hasClass('disabled') 
                && (elementToCheckNr >= 0)) {
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
        }
        break;
      case 'enter':
        tappedOn=Date.now();
        $(navigation["regions"][navigation["curCol"]]+".focus").click();
        if(navigation["curCol"] == 0) {
          // From main menu to one of the 3 main screens
          navigation["curScreen"] = navigation["curEl"][navigation["regions"][navigation["curCol"]]];
          if(navigation["curScreen"] == 1) {
            navigation["curCol"] = 3;
            $(navigation["regions"][0]+".focus").removeClass('focus');
          }
        } else if(navigation["curCol"] == 1) {
          if($(navigation["regions"][2]).length > 0) {
            navigation["curCol"] = 2;
          }
        } else if(navigation["curCol"] == 3) {
          // From categories to file list
          if(navigation["curScreen"] == 1) {
            if($(navigation["regions"][6]).length > 0) {
              navigation["curCol"] = 6;
            } else {
              navigation["curCol"] = 5;
              if($('#select-media-dd-wrapper .nav_media_action:nth-child(1)').hasClass('disabled') 
                && (navigation["curEl"][navigation["regions"][5]]==0)) {
                navigation["curEl"][navigation["regions"][5]]++;
              }
            }
            $(navigation["regions"][3]+".focus").removeClass('focus');
          }
        }
        break;
    }
    console.debug("col: " + navigation["curCol"]);
    console.debug("class: " + navigation["regions"][navigation["curCol"]]);
    console.debug("curEl: " + navigation["curEl"][navigation["regions"][navigation["curCol"]]]);
    console.debug("curScreen: " + navigation["curScreen"]);
    $(navigation["regions"][navigation["curCol"]]).eq(navigation["curEl"][navigation["regions"][navigation["curCol"]]]).addClass('focus');
  }

  function centerFocusedElement(){
    $(columns[navigation["curCol"]]).eq(curRow[navigation["curCol"]]).addClass("focus");
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

  function navlog(direction) {
    console.log(direction + "  col:" + navigation["curCol"] + " row:" + curRow);
  }
}


function TVBrowserView(viewModel) {
  //var horizontalScroll = new IScroll('#horizontalwrapper', {snap: '.listhead', scrollX: true, scrollY: false, momentum: false});

  var sourceListView = new SourceListView(viewModel);
  var categoryListView = new CategoryListView(viewModel);
  var contentListView = new ContentListView(viewModel);
  var targetListView = new TargetListView(viewModel);
  var queueListView = new QueueListView(viewModel);
  var select_view = new Select_View(viewModel.content(), viewModel.selectedContent());

  var listViews = [sourceListView, categoryListView, contentListView, targetListView, null, queueListView];
  var navigationView = new NavigationView(viewModel, listViews);

  //viewModel.prepend().plug($('#prepend').asEventStream('click').merge($('#prepend').asEventStream('touchend')));
  viewModel.append().plug($('#mobileappend').asEventStream('click').merge($('#mobileappend').asEventStream('touchend')));

  //viewModel.selectedPeer().onValue(function(selectedPeer) {
  //  $('#peer').text(selectedPeer === '<no-peer>' ? "Select a target" : address.friendlyName(selectedPeer.address()));
  //});

  var controlsViewModel = viewModel.controls();
  var controlsView = new TVControlsView('.mobilequeuecontrols', null, controlsViewModel);

  $('.content-queuebutton').click(function() {
    // TODO: add number of files added
    var t = new TV_Toast('Media files are added to your queue');
  });

  document.addEventListener('touchmove', function(e) {
    e.preventDefault();
  }, false);

  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loaded, 800);
  }, false);
}

module.exports = TVBrowserView;
