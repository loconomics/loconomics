/**
 * Access to list of addresses created on behalf of clients
 * by service professional,
 * local and remote.
 * Every list of addresses is accesed by client userID.
 */
// TODO store-jsdocs
'use strict';

var Address = require('../models/Address');
var GroupListRemoteModel = require('./helpers/GroupListRemoteModel');
var session = require('./session');
var remote = require('./drivers/restClient');

var api = new GroupListRemoteModel({
    // Conservative cache, just 1 minute
    listTtl: { minutes: 1 },
    groupIdField: 'userID',
    itemIdField: 'addressID',
    Model: Address
});
module.exports = api;

api.addLocalforageSupport('addresses/clients/');
api.addRestSupport(remote, 'me/addresses/clients/');

session.on.cacheCleaningRequested.subscribe(function() {
    api.clearCache();
});
