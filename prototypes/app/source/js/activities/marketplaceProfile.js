/**
    MarketplaceProfile activity
**/
'use strict';

var Activity = require('../components/Activity'),
    UserJobProfileViewModel = require('../viewmodels/UserJobProfile'),
    ko = require('knockout'),
    moment = require('moment');

var A = Activity.extends(function MarketplaceProfileActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.Freelancer;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSectionNavBar('Marketplace Profile');
    
    this.viewModel.showMarketplaceInfo(true);
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    this.viewModel.sync();
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

    return jobVm;
}
