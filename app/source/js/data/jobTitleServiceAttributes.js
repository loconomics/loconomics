/**
 * Access to the service attributes available by job title,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var JobTitleServiceAttributes = require('../models/JobTitleServiceAttributes');
var session = require('./session');
var GroupRemoteModel = require('../utils/GroupRemoteModel');
var remote = require('./drivers/restClient');

module.exports = new GroupRemoteModel({
    ttl: { hours: 1 },
    itemIdField: 'jobTitleID',
    Model: JobTitleServiceAttributes
});

exports.addLocalforageSupport('job-title-service-attributes/');
exports.addRestSupport(remote, 'job-title-service-attributes/');

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});
