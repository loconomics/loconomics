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
        description: '<ul class="TilesList TilesList--openEnd">Includes:<li class="ItemTile"><i class="Tile-marker fa ion-ios-glasses-outline text-secondary"></i><div class="Tile-content"><p>Learn new skills to grow your business at our monthly workshops</p></div></li><li class="ItemTile"><i class="Tile-marker fa ion-android-contacts text-secondary"></i><div class="Tile-content"><p>Meet referral partners through exclusive networking events</p></div></li><li class="ItemTile"><i class="Tile-marker fa ion-ios-paper-outline text-secondary"></i><div class="Tile-content"><p>Expand your offerings with an extra marketplace listing</p></div></li><li class="ItemTile"><i class="Tile-marker fa ion-ios-cart-outline text-secondary"></i><div class="Tile-content"><p>Preferred listing placement in the marketplace</p></div></li><li class="ItemTile"><i class="Tile-marker fa ion-ios-color-filter-outline text-secondary"></i><div class="Tile-content"><p>Earn patronage and elect and/or run for our board of directors</p></div></li><ul>'
    },
    {//new PaymentPlan({
        paymentPlanID: 'OwnerPro',
        name: 'Owner Pro',
        summary: '$29 charged once a month',
        description: '<ul class="TilesList TilesList--openEnd">Includes all features in Owner Growth plus<li class="ItemTile"><i class="Tile-marker fa ion-android-calendar text-secondary"></i><div class="Tile-content"><p>Get organized with our scheduling software</p></div></li><li class="ItemTile"><i class="Tile-marker fa ion-ios-pricetags-outline text-secondary"></i><div class="Tile-content"><p>Attract more clients by adding scheduling to your website</p></div></li><li class="ItemTile"><i class="Tile-marker fa ion-ios-bolt-outline text-secondary"></i><div class="Tile-content"><p>Increase your income & allow clients to book you instantly</p></div></li><li class="ItemTile"><i class="Tile-marker fa fa-vcard-o text-secondary"></i><div class="Tile-content"><p>Build loyalty with client-specific pricing</p></div></li><li class="ItemTile"><i class="Tile-marker fa fa-bank text-secondary"></i><div class="Tile-content"><p>Assistance with zero-interest loan application through our partnership with Kiva Local</p></div></li><ul>'
        
        



    },
    {//new PaymentPlan({
        paymentPlanID: 'OwnerProAnnual',
        name: 'Owner Pro Annual',
        summary: '$290 charged once a year (Save $58 with this option)',
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
