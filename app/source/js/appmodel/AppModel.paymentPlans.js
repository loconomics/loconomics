/** Payment Plans available for membership subscriptions

    TODO: Implement REST SERVICE, right now it uses preset data
**/
'use strict';

var PaymentPlan = require('../models/PaymentPlan');
var ListRemoteModel = require('../utils/ListRemoteModel');

// PRESET
var data = [
    {//new PaymentPlan({
        paymentPlanID: 'OwnerGrowth',
        name: 'Owner Growth',
        summary: '$19 charged once a month',
        description: '<div class="IconListCard"><p class="IconListCard-intro">Includes everything in Starter plus:</p>' +
            '<ul class="IconList">' +
            '<li><i class="fa ion-ios-glasses-outline"></i><p>Learn new skills to grow your biz at our monthly workshops</p></li>' +
            '<li><i class="fa fa-handshake-o"></i><p>Meet & match with referral partners in the cooperative</p></li>' +
            '<li><i class="fa ion-ios-paper-outline"></i><p>Expand your offerings with extra marketplace listings</p></li>' +
            '<li><i class="fa ion-ios-cart-outline"></i><p>Preferred listing placement in the marketplace</p></li>' +
            '<li><i class="fa ion-ios-color-filter-outline"></i><p>Earn patronage and vote/run for our board of directors</p></li>' +
            '</ul></div>'
    },
    {//new PaymentPlan({
        paymentPlanID: 'OwnerPro',
        name: 'Owner Pro',
        summary: '$39 charged once a month',
        description: '<div class="IconListCard"><p class="IconListCard-intro">Includes everything in Owner Growth plus:</p>' +
            '<ul class="IconList">' +
            '<li><i class="fa ion-android-calendar"></i><p>Get organized with our scheduling software</p></li>' +
            '<li><i class="fa ion-ios-pricetags-outline"></i><p>Attract more clients by adding scheduling to your website</p></li>' +
            '<li><i class="fa ion-ios-bolt-outline"></i><p>Increase your income & allow clients to book you instantly</p></li>' +
            '<li><i class="fa fa-vcard-o"></i><p>Build loyalty with client-specific pricing</p></li>' +
            '<li><i class="fa fa-bank"></i><p>Apply for a zero-interest loan through our partnership with Kiva</p></li>' +
            '</ul></div>'
    },
    {//new PaymentPlan({
        paymentPlanID: 'OwnerProAnnual',
        name: 'Owner Pro Annual',
        summary: '$390 charged once a year (Save $78 with this option)',
        description: '<div class="IconListCard"><p class="IconListCard-intro">Includes everything in Owner Growth & Pro plus:</p>' +
            '<ul class="IconList">' +
            '<li><i class="fa ion-arrow-graph-up-right"></i><p>Get on track with a half-day biz assessment from experts</p></li>' +
            '<li><i class="fa ion-social-usd-outline"></i><p>Save $78 with this option</p></li>' +
            '</ul></div>'
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
