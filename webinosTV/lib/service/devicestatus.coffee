webinos = require('webinos')

Promise = require('promise')
promisify = require('../util/promisify.coffee')

Service = require('./service.coffee')

class DeviceStatusService extends Service
  @findServices: (options, filter) ->
    super(new ServiceType("http://webinos.org/api/devicestatus"), options, filter).map (service) ->
      new DeviceStatusService(service.underlying())
  getComponents: (aspect) ->
    return Promise.reject("Service not bound") unless @bound()
    promisify('getComponents', @underlying())(aspect)
  isSupported: (aspect, property) ->
    return Promise.reject("Service not bound") unless @bound()
    promisify('isSupported', @underlying())(aspect, property)
  getPropertyValue: (property) ->
    return Promise.reject("Service not bound") unless @bound()
    getPropertyValue = (property, successCallback, errorCallback) =>
      @underlying().getPropertyValue(successCallback, errorCallback, property)
    promisify(getPropertyValue)(property)

module.exports = DeviceStatusService
