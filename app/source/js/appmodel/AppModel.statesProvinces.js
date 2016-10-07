/** States Provinces
**/
'use strict';

var StateProvince = require('../models/StateProvince');

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
    
    appModel.on('clearLocalData', function() {
        api.clearCache();
    });

    return api;
};
