/** Payment Plans available for membership subscriptions

    TODO: Implement REST SERVICE, right now it uses preset data
**/
'use strict';

var PaymentPlan = require('../models/PaymentPlan');
var ListRemoteModel = require('../utils/ListRemoteModel');

// PRESET
var data = [
    {//new PaymentPlan({
        paymentPlanID: 'MonthlyLite',
        name: 'Monthly Lite',
        summary: '$14.95 charged once a month',
        description: 'Includes: ...'
    },
    {//new PaymentPlan({
        paymentPlanID: 'MonthlyFull',
        name: 'Monthly Full',
        summary: '$29.95 charged once a month',
        description: 'Includes: ...'
    },
    {//new PaymentPlan({
        paymentPlanID: 'AnnualFull',
        name: 'Annual Full',
        summary: '$299.95 charged once a year (Save $59.90 with this option)',
        description: 'Includes: ...'
    }
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
    api.list = data;

    // Replace getList to just return the preset (avoid internal remote fetch)
    api.getList = function() {
        return Promise.resolve(api.list());
    };

    return api;
};
