/**
    yourListings activity
**/
'use strict';

var Activity = require('../components/Activity');
var UserJobProfileViewModel = require('../viewmodels/UserJobProfile');
var ko = require('knockout');
var moment = require('moment');
var user = require('../data/userProfile').data;
var marketplaceProfile = require('../data/marketplaceProfile');

var A = Activity.extend(function YourListingsActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = new ViewModel(this.app);
    // null for logo
    this.navBar = Activity.createSectionNavBar(null);
    this.title('Your Listings');

    this.viewModel.showMarketplaceInfo(true);
    this.viewModel.baseUrl('/listingEditor');
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    if (this.viewModel.user.isServiceProfessional()) {
        this.viewModel.sync();
        yourListings.sync();
    }
};

function ViewModel(app) {
    // Just use the job profile view model (created for the job title listing
    // at 'scheduling'), instance, extend and return
    var jobVm = new UserJobProfileViewModel(app);

    // TODO read verifications count from model; computed
    jobVm.verificationsCount = ko.observable(3);

    jobVm.displayedVerificationsNumber = ko.computed(function() {
        var verificationsCount = this.verificationsCount();
        // Format
        // L18N
        return '(' + verificationsCount + ')';
    }, jobVm);

    jobVm.verificationsSecondaryText = ko.computed(function() {
        // TODO read count limit
        var verificationsLimit = 10;
        var count = this.verificationsCount();
        var remaining = verificationsLimit - count;
        // Format
        // L18N
        return remaining > 0 ? 'You can add up to ' + remaining + ' more' : 'You cannot add more';
    }, jobVm);

    jobVm.displayedLastBackgroundCheck = ko.computed(function() {
        // TODO read last check date
        var lastDate = new Date(2014, 10, 14);
        return moment(lastDate).format('L');
    }, jobVm);

    jobVm.user = user;

    jobVm.marketplaceProfileUrl = ko.computed(function() {
        var example = 'www.loconomics.com/YOURNAME';
        // IMPORTANT: the ProfileUrl ever returns a value, with automatic SEO URL when no custom slug
        // so we check if there is slug or not to show the actual URL or the example
        var slug = yourListings.data.serviceProfessionalProfileUrlSlug();
        var url = yourListings.data.serviceProfessionalProfileUrl();
        return slug ? url : example;
    }, jobVm);

    return jobVm;
}
