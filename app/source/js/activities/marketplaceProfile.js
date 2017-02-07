/**
    MarketplaceProfile activity
**/
'use strict';

var Activity = require('../components/Activity'),
    UserJobProfileViewModel = require('../viewmodels/UserJobProfile'),
    ko = require('knockout'),
    moment = require('moment');

var A = Activity.extend(function MarketplaceProfileActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSectionNavBar('Your Listings');
    
    this.viewModel.showMarketplaceInfo(true);
    this.viewModel.baseUrl('/marketplaceJobtitles');
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    /* NOTE: Commented out since we have now an OnboardingSuccess activity
    if (this.requestData.completedOnboarding) {
        switch (this.requestData.completedOnboarding) {
            case 'welcome': // Schedule complete
                this.app.modals.showNotification({
                    title: 'Nice work!',
                    message: 'You\'ll now be taken to your marketplace profile. ' +
                        'Please complete the following: \n' +
                        '1. Fill in the "About you" section \n' +
                        '2. Add details about your services \n' +
                        '3. Add pricing and service locations',
                    buttonText: 'Got it'
                });
                break;
        }
    }*/

    if (this.viewModel.user.isServiceProfessional()) {
        this.viewModel.sync();
        this.app.model.marketplaceProfile.sync();
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
        var verificationsLimit = 10,
            count = this.verificationsCount(),
            remaining = verificationsLimit - count;
        // Format
        // L18N
        return remaining > 0 ? 'You can add up to ' + remaining + ' more' : 'You cannot add more';
    }, jobVm);
    
    jobVm.displayedLastBackgroundCheck = ko.computed(function() {
        // TODO read last check date
        var lastDate = new Date(2014, 10, 14);
        return moment(lastDate).format('L');
    }, jobVm);
    
    jobVm.user = app.model.userProfile.data;
    
    jobVm.marketplaceProfileUrl = ko.computed(function() {
        var example = 'www.loconomics.com/YOURNAME';
        // IMPORTANT: the ProfileUrl ever returns a value, with automatic SEO URL when no custom slug
        // so we check if there is slug or not to show the actual URL or the example
        var slug = app.model.marketplaceProfile.data.serviceProfessionalProfileUrlSlug();
        var url = app.model.marketplaceProfile.data.serviceProfessionalProfileUrl();
        return slug ? url : example;
    }, jobVm);
    
    var UserJobTitle = require('../models/UserJobTitle');
    jobVm.isPreviewReady = ko.pureComputed(function() {
        return this.userJobProfile().reduce(function(a, b) {
            if (b.statusID() === UserJobTitle.status.on) return true;
            else return a;
        }, false);
    }, jobVm);

    return jobVm;
}
