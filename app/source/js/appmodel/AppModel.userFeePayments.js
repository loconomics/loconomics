/** User Fee Payments

    TODO Implement large-list logic or this will growth a lot for some users,
    now using the ListRemoteModel that loads the full list content.
**/
'use strict';

var UserFeePayment = require('../models/UserFeePayment');
var ListRemoteModel = require('../utils/ListRemoteModel');

exports.create = function create(appModel) {

    var api = new ListRemoteModel({
        listTtl: { minutes: 10 },
        itemIdField: 'userFeePaymentID',
        Model: UserFeePayment
    });

    api.addLocalforageSupport('user-fee-payments');
    api.addRestSupport(appModel.rest, 'me/fee-payments');

    appModel.on('clearLocalData', function() {
        api.clearCache();
    });

    return api;
};
