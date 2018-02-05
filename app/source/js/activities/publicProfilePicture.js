/**
    publicProfilePicture activity
**/

'use strict';

import '../kocomponents/utilities/icon-dec';
var Activity = require('../components/Activity');
var ko = require('knockout');
var ProfilePictureBioVM = require('../viewmodels/ProfilePictureBioVM');

var A = Activity.extend(function PublicProfilePicture() {

    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.loggedUser;
    var helpLink = '/help/relatedArticles/201967756-telling-the-community-about-yourself';
    
    // Defaults settings for navBar.
    this.navBar = Activity.createSubsectionNavBar('Edit listing', {
        backLink: '/listingEditor', helpLink: helpLink
    });
    // Make navBar available at viewModel, needed for dekstop navigation
    this.viewModel.navBar = this.navBar;
    this.title = ko.pureComputed(function() {
        return ' Your profile picture';
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

function ViewModel(app) {


    this.profilePicture = new ProfilePictureBioVM(app);

    this.submitText = ko.pureComputed(function() {
        return (
            this.isLoading() ?
                'Loading...' :
                this.isSaving() ?
                    'Saving...' :
                    'Save'
        );
    }, this);

    this.save = function() {
        this.profilePicture.save()
        .then(function() {
            app.successSave();
        })
        .catch(function() {
            // catch error, managed on event
        });
    }.bind(this);

    this.discard = function() {
        this.profilePicture.discard();
    };
    this.sync = function() {
        this.profilePicture.sync();
    };
   
    this.isLoading = this.profilePicture.isLoading;
    this.isSaving = this.profilePicture.isSaving;
    this.isSyncing = this.profilePicture.isSyncing;
    this.isLocked = this.profilePicture.isLocked;
}

