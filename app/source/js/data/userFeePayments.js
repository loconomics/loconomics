/**
 * Management of the user fee payments (part of
 * ownership subscriptions),
 * local and remote.
 */
// TODO store-jsdocs
// TODO Implement large-list logic or this will growth a lot for some users,
// now using the ListRemoteModel that loads the full list content.
'use strict';

var UserFeePayment = require('../models/UserFeePayment');
var ListRemoteModel = require('../utils/ListRemoteModel');
var session = require('./session');
var remote = require('./drivers/restClient');

var api = new ListRemoteModel({
    listTtl: { minutes: 10 },
    itemIdField: 'userFeePaymentID',
    Model: UserFeePayment
});
module.exports = api;

api.addLocalforageSupport('user-fee-payments');
api.addRestSupport(remote, 'me/fee-payments');

session.on.cacheCleaningRequested.subscribe(function() {
    api.clearCache();
});
