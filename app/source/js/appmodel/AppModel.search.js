/** Logged user service attributes
**/
'use strict';

var SearchResults = require('../models/SearchResults');

var GroupRemoteModel = require('../utils/GroupRemoteModel');

exports.create = function create(appModel) {
    var api = new GroupRemoteModel({
        ttl: { minutes: 1 },
        itemIdField: 'jobTitleID',
        Model: SearchResults
    });
    
    api.addLocalforageSupport('service-attributes/');
    api.addRestSupport(appModel.rest, 'me/service-attributes/');    
    
    appModel.on('clearLocalData', function() {
        api.clearCache();
    });
    
    return api;
};
