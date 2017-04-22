/** Payment Plans available for membership subscriptions

    TODO: Implement REST SERVICE, right now it uses preset data
**/
'use strict';

var PaymentPlan = require('../models/PaymentPlan');
var ListRemoteModel = require('../utils/ListRemoteModel');

// PRESET
var data = [
    new PaymentPlan({
        paymentPlanID: 'MonthlyLite',
        name: 'Monthly Lite',
        description: 'Includes: ...'
    }),
    new PaymentPlan({
        paymentPlanID: 'MonthlyFull',
        name: 'Monthly Full',
        description: 'Includes: ...'
    }),
    new PaymentPlan({
        paymentPlanID: 'AnnualFull',
        name: 'Annual Full',
        description: 'Includes: ...'
    })
];

exports.create = function create(appModel) {

    var api = new ListRemoteModel({
        // Types does not changes usually, so big ttl
        listTtl: { days: 1 },
        itemIdField: 'paymentPlanID',
        Model: PaymentPlan
    });

    //api.addLocalforageSupport('cancellation-policies');
    //api.addRestSupport(appModel.rest, 'cancellation-policies');

    appModel.on('clearLocalData', function() {
    //    api.clearCache();
    });

    // Replace cached list with preset data
    api.list(data);

    // Replace getList to just return the preset
    api.getList = function() {
        return Promise.resolve(data);
    };

    return api;
};
