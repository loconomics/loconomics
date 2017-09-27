/**
    userBirthDay activity
**/

'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var UserProfileVM = require('../viewmodels/UserProfileVM');

var A = Activity.extend(function UserBirthDay() {

    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.loggedUser;
    
    // Defaults settings for navBar.
    this.navBar = Activity.createSubsectionNavBar('Edit listing', {
        backLink: '/listingEditor', helpLink: this.viewModel.helpLink
    });
    // Make navBar available at viewModel, needed for dekstop navigation
    this.viewModel.navBar = this.navBar;
    this.title = ko.pureComputed(function() {
        return ' Your birthday';
    }, this.viewModel);
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

    this.helpLink = '/help/relatedArticles/201967756-telling-the-community-about-yourself';
    
    this.userProfile = new UserProfileVM(app);

    this.user = this.userProfile.user;

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
        this.userProfile.save()
        .then(function() {
            app.successSave();
        })
        .catch(function() {
            // catch error, managed on event
        });
    }.bind(this);

    this.discard = function() {
        this.userProfile.discard();
    };
    this.sync = function() {
        this.userProfile.sync();
    };
   
    this.isLoading = this.userProfile.isLoading;
    this.isSaving = this.userProfile.isSaving;
    this.isSyncing = this.userProfile.isSyncing;
    this.isLocked = this.userProfile.isLocked;
}

