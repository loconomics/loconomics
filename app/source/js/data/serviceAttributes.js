/**
 * Management of the user service attributes (part of public listing),
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var UserJobTitleServiceAttributes = require('../models/UserJobTitleServiceAttributes');
var session = require('./session');
var GroupRemoteModel = require('../utils/GroupRemoteModel');
var remote = require('./drivers/restClient');

module.exports = new GroupRemoteModel({
    ttl: { minutes: 1 },
    itemIdField: 'jobTitleID',
    Model: UserJobTitleServiceAttributes
});

exports.addLocalforageSupport('service-attributes/');
exports.addRestSupport(remote, 'me/service-attributes/');

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});
