/** Customers
**/
'use strict';

var Customer = require('../models/Customer');

var ListRemoteModel = require('../utils/ListRemoteModel');

exports.create = function create(appModel) {
    
    var api = new ListRemoteModel({
        listTtl: { minutes: 1 },
        itemIdField: 'customerUserID',
        Model: Customer
    });

    api.addLocalforageSupport('customers');
    api.addRestSupport(appModel.rest, 'customers');

    return api;
};
