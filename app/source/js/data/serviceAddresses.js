/** Service Addresses
**/
'use strict';

var Address = require('../models/Address'),
    GroupListRemoteModel = require('../utils/GroupListRemoteModel');
var session = require('../data/session');

exports.create = function create(appModel) {

    var api = new GroupListRemoteModel({
        // Conservative cache, just 1 minute
        listTtl: { minutes: 1 },
        groupIdField: 'jobTitleID',
        itemIdField: 'addressID',
        Model: Address
    });

    api.addLocalforageSupport('addresses/service/');
    api.addRestSupport(appModel.rest, 'me/addresses/service/');

    session.on.cacheCleaningRequested.subscribe(function() {
        api.clearCache();
    });

    return api;
};
