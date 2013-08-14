module.exports = function WebinosController(model, view) {

  model.subscribe(function (event) {
    console.log('model event', event);
    console.log('all', model.devices());
    view.addSources(model.devices());
  });

};