/**
 * Management of the user payment account
 * (just for service professionals,
 * is the account they will get paid for services),
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var PaymentAccount = require('../models/PaymentAccount');
var RemoteModel = require('./helpers/RemoteModel');
var session = require('./session');
var remote = require('./drivers/restClient');

var api = new RemoteModel({
    data: new PaymentAccount(),
    ttl: { minutes: 1 },
    localStorageName: 'paymentAccount',
    fetch: function fetch() {
        return remote.get('me/payment-account');
    },
    push: function push(data) {
        return remote.put('me/payment-account', data || this.data.model.toPlainObject());
    }
});
module.exports = api;

session.on.cacheCleaningRequested.subscribe(function() {
    api.clearCache();
});
