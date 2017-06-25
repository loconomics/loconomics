/**
 * Management of the user payment account
 * (just for service professionals,
 * is the account they will get paid for services),
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var PaymentAccount = require('../models/PaymentAccount');
var RemoteModel = require('../utils/RemoteModel');
var session = require('./session');
var remote = require('./drivers/restClient');

module.exports = new RemoteModel({
    data: new PaymentAccount(),
    ttl: { minutes: 1 },
    localStorageName: 'paymentAccount',
    fetch: function fetch() {
        return remote.get('me/payment-account');
    },
    push: function push() {
        return remote.put('me/payment-account', this.data.model.toPlainObject());
    }
});

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});
