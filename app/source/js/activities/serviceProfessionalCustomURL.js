/**
    serviceProfessionalCustomURL activity
**/
'use strict';

import '../kocomponents/utilities/icon-dec';
var Activity = require('../components/Activity');
var ko = require('knockout');
var ListingVM = require('../viewmodels/ListingVM');

var A = Activity.extend(function ServiceProfessionalBusinessInfo() {
    Activity.apply(this, arguments);

    this.viewModel = new ListingVM(this.app);
    this.accessLevel = this.app.UserType.loggedUser;
    var helpLink = '/help/relatedArticles/201967756-telling-the-community-about-yourself';
    
    // Defaults settings for navBar.
    this.navBar = Activity.createSubsectionNavBar('Edit listing', {
        backLink: '/listingEditor', helpLink: helpLink
    });
    // Make navBar available at viewModel, needed for dekstop navigation
    this.viewModel.navBar = this.navBar;
    this.title = ko.pureComputed(function() {
        return " Your listing's custom URL";
    }, this.viewModel);

    this.viewModel.helpLink = helpLink;
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    // Keep data updated:
    this.viewModel.sync();
};
