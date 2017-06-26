/**
 * Management of the user service addresses (part of public listing),
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var Address = require('../models/Address');
var GroupListRemoteModel = require('../utils/GroupListRemoteModel');
var session = require('./session');
var remote = require('./drivers/restClient');

var api = new GroupListRemoteModel({
    // Conservative cache, just 1 minute
    listTtl: { minutes: 1 },
    groupIdField: 'jobTitleID',
    itemIdField: 'addressID',
    Model: Address
});
module.exports = api;

api.addLocalforageSupport('addresses/service/');
api.addRestSupport(remote, 'me/addresses/service/');

session.on.cacheCleaningRequested.subscribe(function() {
    api.clearCache();
});
