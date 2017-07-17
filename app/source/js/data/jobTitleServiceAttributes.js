/**
 * Access to the service attributes available by job title,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var JobTitleServiceAttributes = require('../models/JobTitleServiceAttributes');
var session = require('./session');
var GroupRemoteModel = require('./helpers/GroupRemoteModel');
var remote = require('./drivers/restClient');

var api = new GroupRemoteModel({
    ttl: { hours: 1 },
    itemIdField: 'jobTitleID',
    Model: JobTitleServiceAttributes
});
module.exports = api;

api.addLocalforageSupport('job-title-service-attributes/');
api.addRestSupport(remote, 'job-title-service-attributes/');

session.on.cacheCleaningRequested.subscribe(function() {
    api.clearCache();
});
