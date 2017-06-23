/** Logged user service attributes
**/
'use strict';

var UserJobTitleServiceAttributes = require('../models/UserJobTitleServiceAttributes');
var session = require('../data/session');
var GroupRemoteModel = require('../utils/GroupRemoteModel');

exports.create = function create(appModel) {
    var api = new GroupRemoteModel({
        ttl: { minutes: 1 },
        itemIdField: 'jobTitleID',
        Model: UserJobTitleServiceAttributes
    });

    api.addLocalforageSupport('service-attributes/');
    api.addRestSupport(appModel.rest, 'me/service-attributes/');

    session.on.cacheCleaningRequested.subscribe(function() {
        api.clearCache();
    });

    return api;
};
