var _ = require('underscore');
var $ = require('jquery');

var Bacon = require('baconjs');
var bjq = require('bacon-jquery-bindings');

var MessagingService = require('./service/messaging.coffee');
var MediaContentService = require('./service/mediacontent.coffee');
var MediaService = require('./service/media.coffee');

var view = require('./view/view.js');

$(document).ready(function() {
  new Controller();

  var configuration = {
    namespace: 'urn:webinos:hub:media',
    properties: {
      mode: 'send-receive',
      reclaimIfExists: true
    }
  };

  var clock = Bacon.once(Date.now()).merge(Bacon.fromPoll(60000, function () { return Date.now(); }));
  mediacontent = clock.flatMap(function (now) {
    return MediaContentService.findServices().flatMap(function (service) {
      service.log('mediacontent');
      return Bacon.fromPromise(service.bindService());
    });
  });

  // var mediacontent = MediaContentService.findServices().flatMap(function (service) {
  //   return Bacon.fromPromise(service.bindService());
  // });
  // mediacontent.log('mediacontents');

  mediacontent.onValue(function (service) {
    service.getLocalFolders().then(function (folders) {
      console.log('folders', folders);
    }).then(function () {
      service.unbindService();
    });
  });

  // var media = MediaService.findServices().flatMap(function (service) {
  //   return Bacon.fromPromise(service.bindService());
  // });
  // media.log('medias');

  // media.onValue(function (service) {
  //   service.events().log('media')

  //   Bacon.later(10000, null).onValue(function () {
  //     service.unbindService();
  //   });
  // });

  // var messaging = MessagingService.findServices().flatMap(function (service) {
  //   return Bacon.fromPromise(service.bindService());
  // });
  // messaging.log('messagings');

  // var channels = messaging.flatMap(function (service) {
  //   return Bacon.fromPromise(service.createChannel(configuration, function () {
  //     return true;
  //   })).map(function (channel) {
  //     return Bacon.once(channel);
  //   }).mapError(function(error) {
  //     return service.searchForChannels(configuration.namespace);
  //   }).flatMap(_.identity);
  // });
  // channels.log('channels');

  // return channels.onValue(function (channel) {
  //   channel.log('channel');
  //   channel.filter('.isMessage').map('.message').map('.contents').log('message');

  //   var dispose = Bacon.interval(1000, 'hi').onValue(function (contents) {
  //     return channel.send(contents);
  //   });

  //   Bacon.later(10000, null).onValue(function () {
  //     dispose();
  //     channel.service().unbindService();
  //   });
  // });
});

var Source = (function () {
  function Source(id, name) {
    this.id = id;
    this.name = name;
  }

  return Source;
})();

var Controller = (function () {
  function Controller() {
    var model, view;
    model = new SourceListViewModel();
    model.sources.addSource(Bacon.later(2500, [new Source(1, 'Thomas'), new Source(2, 'Felix'), new Source(3, 'Martin')]));
    model.sources.log('sources');
    model.current.log('current');
    model.selected.log('selected');
    view = new SourceListView($('#sourceList'), model);
  }

  return Controller;
})();

var SourceListViewModel = (function () {
  function SourceListViewModel() {
    this.sources = bjq.Model([new Source(1, 'Thomas'), new Source(2, 'Felix')]);
    this.current = bjq.Model(null);
    this.selected = bjq.Model([]);
  }

  return SourceListViewModel;
})();

var SourceListView = (function () {
  function SourceListView(element, model) {
    this.element = element;
    this.model = model;
  }

  SourceListView.prototype.current = function (id) {
    return this.model.current.set(id);
  };

  SourceListView.prototype.select = function (id) {
    return this.model.selected.modify(function (selected) {
      return _.union(selected, [id]);
    });
  };

  SourceListView.prototype.deselect = function (id) {
    return this.model.selected.modify(function (selected) {
      return _.difference(selected, [id]);
    });
  };

  return SourceListView;
})();
