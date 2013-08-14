webinos = require('webinos')

Bacon = require('baconjs')
Promise = require('promise')
promisify = require('../util/promisify.coffee')

Service = require('./service.coffee')

class MediaContentService extends Service
  @findServices: (options, filter) ->
    super(new ServiceType("http://webinos.org/api/mediacontent"), options, filter).map (service) ->
      new MediaContentService(service.underlying())
  getLocalFolders: ->
    return Promise.reject("Service not bound") unless @bound()
    promisify('getLocalFolders', @underlying())()
  findItem: (params) ->
    return Promise.reject("Service not bound") unless @bound()
    findItem = (params, successCallback, errorCallback) =>
      @underlying().findItem(successCallback, errorCallback, params)
    promisify(findItem)(params)
  getLink: (params) ->
    return Promise.reject("Service not bound") unless @bound()
    promisify('getLink', @underlying())(params)
  getContents: (params) ->
    return Promise.reject("Service not bound") unless @bound()
    getContents = (params, successCallback, errorCallback) =>
      @underlying().getContents(successCallback, errorCallback, params)
    promisify(getContents)(params)

module.exports = MediaContentService
