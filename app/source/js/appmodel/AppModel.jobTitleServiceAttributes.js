/** Logged user service attributes
**/
'use strict';

var JobTitleServiceAttributes = require('../models/JobTitleServiceAttributes');
var session = require('../data/session');
var GroupRemoteModel = require('../utils/GroupRemoteModel');

exports.create = function create(appModel) {
    var api = new GroupRemoteModel({
        ttl: { hours: 1 },
        itemIdField: 'jobTitleID',
        Model: JobTitleServiceAttributes
    });

    api.addLocalforageSupport('job-title-service-attributes/');
    api.addRestSupport(appModel.rest, 'job-title-service-attributes/');

    session.on.cacheCleaningRequested.subscribe(function() {
        api.clearCache();
    });

    return api;
};
