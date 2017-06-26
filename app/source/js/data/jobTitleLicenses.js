/**
 * Management of the user licenses by job title,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var JobTitleLicense = require('../models/JobTitleLicense');
var session = require('./session');
var GroupRemoteModel = require('../utils/GroupRemoteModel');
var remote = require('./drivers/restClient');

var api = new GroupRemoteModel({
    ttl: { minutes: 1 },
    itemIdField: 'jobTitleID',
    Model: JobTitleLicense
});
module.exports = api;

api.addLocalforageSupport('job-title-licenses/');
api.addRestSupport(remote, 'me/job-title-licenses/');

session.on.cacheCleaningRequested.subscribe(function() {
    api.clearCache();
});
