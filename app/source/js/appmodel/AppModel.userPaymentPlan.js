/** UserPaymentPlan
**/
'use strict';

var UserPaymentPlan = require('../models/UserPaymentPlan');
var RemoteModel = require('../utils/RemoteModel');
var localforage = require('localforage');

exports.create = function create(appModel) {
    var rem = new RemoteModel({
        data: new UserPaymentPlan(),
        ttl: { minutes: 1 },
        localStorageName: 'userPaymentPlan',
        fetch: function fetch() {
            return appModel.rest.get('me/payment-plan');
        },
        push: function push() {
            throw { name: 'Raw update of payment plan is not supported; use specialized methods' };
        }
    });

    appModel.on('clearLocalData', function() {
        rem.clearCache();
    });

    /**
     * @param {Object} data
     */
    rem.createSubscription = function createSubscription(data) {
        rem.isSaving(true);
        return appModel.rest.post('me/payment-plan', data)
        .then(function(serverData) {
            rem.data.model.updateWith(serverData, true);
            // If success, save persistent local copy of the data
            localforage.setItem(rem.localStorageName, serverData);
            rem.isSaving(false);
        })
        .catch(function(err) {
            rem.isSaving(false);
            throw err;
        });
    };

    return rem;
};
