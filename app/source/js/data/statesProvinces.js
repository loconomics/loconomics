/**
 * Access to the list of states/provinces,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var StateProvince = require('../models/StateProvince');
var session = require('./session');
var ListRemoteModel = require('./helpers/ListRemoteModel');
var remote = require('./drivers/restClient');

var api = new ListRemoteModel({
    // The data does not changes usually, so very big ttl
    listTtl: { years: 1 },
    itemIdField: 'code',
    Model: StateProvince
});
module.exports= api;

api.addLocalforageSupport('states-provinces');
api.addRestSupport(remote, 'states-provinces');

session.on.cacheCleaningRequested.subscribe(function() {
    api.clearCache();
});
