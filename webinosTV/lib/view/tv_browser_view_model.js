var _ = require('underscore');

var Bacon = require('baconjs');
var bjq = require('bacon.jquery');

var ControlsViewModel = require('./controls_view_model.js');

function TVBrowserViewModel(manager, input) {

  input = input.filter(function() {
    return $('.pt-page-current').attr('id') === 'mobilebrowser' && !$('.menu').is(":visible");
  });

  this.input = function() {
    return input;
  };

  var sources = manager.toProperty().map(function(devices) {
    return _.filter(devices, function(device) {
      return device.isSource();
    });
  });

  this.sources = function() {
    return sources;
  };

  var selectedSources = bjq.Model([]);
  this.selectedSources = function() {
    return selectedSources;
  };

  var categories = Bacon.constant([
    {id: 'movies', type: 'Video', title: 'Movies', image: 'images/media-movies.svg'},
    {id: 'music', type: 'Audio', title: 'Music', image: 'images/media-music.svg'},
    {id: 'images', type: 'Image', title: 'Images', image: 'images/media-images.svg'},
    {id: 'channels', type: 'Channel', title: 'Channels', image: 'images/media-channels.svg'}
  ]);

  this.categories = function() {
    return categories;
  };

  var selectedCategories = bjq.Model([]);
  this.selectedCategories = function() {
    return selectedCategories;
  };
  
  var contentquery = bjq.textFieldValue($("#content-search"));

  var content = Bacon.combineTemplate({
    sources: sources, 
    selectedSources: selectedSources,
    categories: categories, 
    selectedCategories: selectedCategories,
    query: contentquery
  }).map(function(state) {
    var types = _.map(state.selectedCategories, function(id) {
      return id ? _.findWhere(state.categories, {id: id}).type : id;
    });
	var querystring = _.chain(state.query).value();
	
    return _.chain(state.sources).filter(function(source) {
      return _.contains(_.map(state.selectedSources, function(selectedsource) {
        return selectedsource.address;
      }), source.address());
    }).map(function(source) {
      return _.chain(source.content()).values().flatten().filter(function(item) {
        return _.find(types, function(type) {
          var typematch = item.type.toLowerCase().indexOf(type.toLowerCase()) !== -1;
          if(typematch) {
          	var titlematch = (item.title !== 'undefined') ? (item.title.toLowerCase().indexOf(querystring.toLowerCase()) !== -1) : false;
          	return titlematch;
          }
          return false;
        });
      }).value();
    }).flatten().value();
  });

  this.content = function() {
    return content;
  };

  var selectedContent = bjq.Model([]);
  this.selectedContent = function() {
    return selectedContent;
  };

  var targets = manager.toProperty().map(function(devices) {
    return _.chain(devices).filter(function(device) {
      return device.isTarget();
    }).map(function (device) {
      return _.map(device.upnp(), function (service) {
        return {device: device, service: service, type: 'upnp'};
      }).concat(_.map(device.peers(), function (service) {
        return {device: device, service: service, type: 'peer'};
      }));
    }).flatten().value();
  });

  this.targets = function() {
    return targets;
  };

  var selectedTargets = bjq.Model([]);
  this.selectedTargets = function() {
    return selectedTargets;
  };

  var queuing = new Bacon.Bus();

  Bacon.combineTemplate({
    devices: manager.toProperty(),
    selectedContent: selectedContent,
    selectedTargets: selectedTargets
  }).sampledBy(queuing, function(current, command) {
    return {
      devices: current.devices,
      selectedContent: current.selectedContent,
      selectedTargets: current.selectedTargets,
      command: command
    };
  }).filter(function(operation) {
    return operation.selectedContent.length && operation.selectedTargets.length;
  }).doAction(function () {
    selectedContent.set([]);
  }).onValue(function(operation) {
    var items = _.map(operation.selectedContent, function(selectedItem) {
      var device = operation.devices[selectedItem.device];
      var item   = _.chain(device.content()).values().flatten().findWhere({
        id: selectedItem.item.id,
        title: selectedItem.item.title
      }).value();
      return _.extend(item, {device: device, service: device.services()[selectedItem.service]});
    });

    var targets = _.map(operation.selectedTargets, function(selectedTarget) {
      var device = operation.devices[selectedTarget.device.address()];
      return {
        device: device,
        service: device.services()[selectedTarget.service],
        type: selectedTarget.type
      };
    });

    var promises = _.map(items, function(item) {
      if (item.type === 'Channel') {
        return Promise.fulfill({item: item, link: item.link})
      }

      return item.service.getLink({
        folderId: item.id,
        fileName: item.title
      }).then(function(link) {
        return {item: item, link: link};
      });
    });

    Promise.every.apply(Promise, promises).then(function(values) {
      _.each(targets, function(target) {
        if (target.type === 'upnp') {
          target.service.play(values[0].link);
        } else if (target.type === 'peer') {
          switch (operation.command.type) {
            case 'prepend':
              target.service.prepend(values);
              break;
            case 'append':
              target.service.append(values);
              break;
          }
        }
      });
    });
  });

  var prepend = new Bacon.Bus();
  queuing.plug(prepend.map({type: 'prepend'}));

  this.prepend = function() {
    return prepend;
  };

  var append = new Bacon.Bus();
  queuing.plug(append.map({type: 'append'}));

  this.append = function() {
    return append;
  };

  var selectedQueueTargets = bjq.Model([]);
  this.selectedQueueTargets = function() {
    return selectedQueueTargets;
  };

  var selectedPeer = manager.toProperty().sampledBy(selectedQueueTargets, function(devices, selectedTargets) {
    if (!selectedTargets.length || selectedTargets.length > 1)
      return '<no-peer>';
    var device = devices[selectedTargets[0].device.address()];
    return {
      device: device,
      service: device.services()[selectedTargets[0].service],
      type: selectedTargets[0].type
    };
  });

  this.selectedPeer = function() {
    return selectedPeer;
  };

  var controls = new ControlsViewModel(selectedPeer);
  this.controls = function() {
    return controls;
  };

  var queue = selectedPeer.flatMapLatest(function(selectedPeer) {
    if (selectedPeer === '<no-peer>' || selectedPeer.type !== 'peer')
      return Bacon.once([]);
    return selectedPeer.service.state().map('.queue').skipDuplicates(_.isEqual);
  }).toProperty([]);

  this.queue = function() {
    return queue;
  };

  var selectedQueue = bjq.Model([]);
  this.selectedQueue = function() {
    return selectedQueue;
  };

  Bacon.combineTemplate({
    selectedPeer: selectedPeer,
    queue: queue, selectedQueue: selectedQueue
  }).sampledBy(controls.remove()).filter(function(state) {
    return state.selectedPeer !== '<no-peer>' && state.selectedPeer.type === 'peer' && state.selectedQueue.length;
  }).onValue(function(state) {
    var indexes = [];

    _.each(state.selectedQueue, function(link) {
      _.each(state.queue, function(item, index) {
        if (link === item.link)
          indexes.push(index);
      });
    });

    state.selectedPeer.service.remove(indexes);
  });
}

module.exports = TVBrowserViewModel;
