/** States Provinces
**/
'use strict';

var StateProvince = require('../models/StateProvince');
var session = require('../data/session');
var ListRemoteModel = require('../utils/ListRemoteModel');

exports.create = function create(appModel) {

    var api = new ListRemoteModel({
        // Types does not changes usually, so very big ttl
        listTtl: { years: 1 },
        itemIdField: 'code',
        Model: StateProvince
    });

    api.addLocalforageSupport('states-provinces');
    api.addRestSupport(appModel.rest, 'states-provinces');

    session.on.cacheCleaningRequested.subscribe(function() {
        api.clearCache();
    });

    return api;
};
