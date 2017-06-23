/** Client Addresses: let a service professional
    to get the list of addresses created on behalf of
    clients.
    Every list of addresses is accesed by client userID.
**/
'use strict';

var Address = require('../models/Address'),
    GroupListRemoteModel = require('../utils/GroupListRemoteModel');
var session = require('../data/session');

exports.create = function create(appModel) {

    var api = new GroupListRemoteModel({
        // Conservative cache, just 1 minute
        listTtl: { minutes: 1 },
        groupIdField: 'userID',
        itemIdField: 'addressID',
        Model: Address
    });

    api.addLocalforageSupport('addresses/clients/');
    api.addRestSupport(appModel.rest, 'me/addresses/clients/');

    session.on.cacheCleaningRequested.subscribe(function() {
        api.clearCache();
    });

    return api;
};
