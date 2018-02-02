/**
    publicBio activity
**/

'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var ProfilePictureBioVM = require('../viewmodels/ProfilePictureBioVM');

var A = Activity.extend(function PublicBio() {

    Activity.apply(this, arguments);

    this.viewModel = new ProfilePictureBioVM(this.app);
    this.accessLevel = this.app.UserType.loggedUser;
    var helpLink = '/help/relatedArticles/201967756-telling-the-community-about-yourself';
    
    // Defaults settings for navBar.
    this.navBar = Activity.createSubsectionNavBar('Edit listing', {
        backLink: '/listingEditor', helpLink: helpLink
    });
    // Make navBar available at viewModel, needed for dekstop navigation
    this.viewModel.navBar = this.navBar;
    this.title = ko.pureComputed(function() {
        return ' Your public bio';
    }, this.viewModel);

    this.viewModel.helpLink = helpLink;
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    // Discard any previous unsaved edit
    this.viewModel.discard();

    // Keep data updated:
    this.viewModel.sync();
};
