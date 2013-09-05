_ = require('underscore')

webinos = require('webinos')

module.exports =
  generalize: (address) ->
    index = address.indexOf('/')
    if index is -1 then address else address.substr(0, index)
  friendlyName: (address) ->
    _.chain(webinos.session.getConnectedDevices())
      .map(({id, friendlyName, pzp}) -> [{id, friendlyName}].concat(pzp ? []))
      .flatten()
      .findWhere({id: address})
      .value()?.friendlyName ? address
