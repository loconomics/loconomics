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

import ListRemoteModel from './helpers/ListRemoteModel';
import PaymentPlan from '../models/PaymentPlan';
import ko from 'knockout';
import session from './session';

// PRESET
var data = [
    {//new PaymentPlan({
        paymentPlanID: '',
        name: 'Free',
        summary: '$0',
        partnership: false,
        description: require('../../html/parts/PaymentPlanFree.html')
    },
    {//new PaymentPlan({
        paymentPlanID: 'OwnerGrowth',
        name: 'Owner Growth',
        summary: '$19 charged once a month',
        partnership: false,
        description: require('../../html/parts/PaymentPlanGrowth.html')
    },
    {//new PaymentPlan({
        paymentPlanID: 'OwnerPro',
        name: 'Owner Pro',
        summary: '$39 charged once a month',
        partnership: false,
        description: require('../../html/parts/PaymentPlanPro.html')
    },
    {//new PaymentPlan({
        paymentPlanID: 'OwnerProAnnual',
        name: 'Owner Pro Annual',
        summary: '$390 charged once a year (Save $78 with this option)',
        partnership: false,
        description: require('../../html/parts/PaymentPlanProAnnual.html')
    },
    {//new PaymentPlan({
        paymentPlanID: 'CccPlan',
        name: 'CCC Plan',
        summary: 'Free for California Community Colleges students and professors',
        partnership: true,
        description: require('../../html/parts/PaymentPlanCccPlan.html')
    }
];

var api = new ListRemoteModel({
    // Types does not changes usually, so big ttl
    listTtl: { days: 1 },
    itemIdField: 'paymentPlanID',
    Model: PaymentPlan
});
module.exports = api;

//api.addLocalforageSupport('cancellation-policies');
//api.addRestSupport(remote, 'cancellation-policies');

session.on.cacheCleaningRequested.subscribe(function() {
//    api.clearCache();
});

// Replace cached list with preset data
api.list = data;

// Replace getList to just return the preset (avoid internal remote fetch)
api.getList = function() {
    return Promise.resolve(api.list());
};

/**
 * Gives a list o plans available to users to be choosen.
 * This excludes partnership plans, only given under special situations in
 * other ways.
 * @member {KnockoutComputed<Array>}
 */
api.availablePlans = ko.pureComputed(function() {
    return api.list().filter((plan) => !plan.partnership());
});
