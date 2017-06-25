/**
 * Management of the user payment plan (ownership subscritpion),
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var UserPaymentPlan = require('../models/UserPaymentPlan');
var RemoteModel = require('../utils/RemoteModel');
var local = require('./drivers/localforage');
var remote = require('./drivers/restClient');
var session = require('./session');

module.exports = new RemoteModel({
    data: new UserPaymentPlan(),
    ttl: { minutes: 1 },
    localStorageName: 'userPaymentPlan',
    fetch: function fetch() {
        return remote.get('me/payment-plan');
    },
    push: function push() {
        throw { name: 'Raw update of payment plan is not supported; use specialized methods' };
    }
});

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});

/**
 * @param {Object} data
 */
exports.createSubscription = function createSubscription(data) {
    exports.isSaving(true);
    return remote.post('me/payment-plan', data)
    .then(function(serverData) {
        exports.data.model.updateWith(serverData, true);
        // If success, save persistent local copy of the data
        local.setItem(exports.localStorageName, serverData);
        exports.isSaving(false);
    })
    .catch(function(err) {
        exports.isSaving(false);
        throw err;
    });
};
