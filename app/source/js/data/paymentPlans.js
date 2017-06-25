/**
 * Access to the list of payment plans available
 * for membership subscriptions.
 *
 * It's a hardcoded list with a built-in html template
 * for each plan description.
 *
 * TODO: Implement REST SERVICE; how html-descriptions will be
 * managed?
 */
// TODO store-jsdocs
'use strict';

var PaymentPlan = require('../models/PaymentPlan');
var ListRemoteModel = require('../utils/ListRemoteModel');
var session = require('./session');

// PRESET
var data = [
    {//new PaymentPlan({
        paymentPlanID: '',
        name: 'Free',
        summary: 'Always $0',
        description: require('../../html/parts/PaymentPlanFree.html')
    },
    {//new PaymentPlan({
        paymentPlanID: 'OwnerGrowth',
        name: 'Owner Growth',
        summary: '$19 charged once a month',
        description: require('../../html/parts/PaymentPlanGrowth.html')
    },
    {//new PaymentPlan({
        paymentPlanID: 'OwnerPro',
        name: 'Owner Pro',
        summary: '$39 charged once a month',
        description: require('../../html/parts/PaymentPlanPro.html')
    },
    {//new PaymentPlan({
        paymentPlanID: 'OwnerProAnnual',
        name: 'Owner Pro Annual',
        summary: '$390 charged once a year (Save $78 with this option)',
        description: require('../../html/parts/PaymentPlanProAnnual.html')
    }
];

module.exports = new ListRemoteModel({
    // Types does not changes usually, so big ttl
    listTtl: { days: 1 },
    itemIdField: 'paymentPlanID',
    Model: PaymentPlan
});

//exports.addLocalforageSupport('cancellation-policies');
//exports.addRestSupport(remote, 'cancellation-policies');

session.on.cacheCleaningRequested.subscribe(function() {
//    exports.clearCache();
});

// Replace cached list with preset data
exports.list = data;

// Replace getList to just return the preset (avoid internal remote fetch)
exports.getList = function() {
    return Promise.resolve(exports.list());
};
