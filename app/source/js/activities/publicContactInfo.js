/**
    publicContactInfo activity
**/
/**
    publicBio activity
**/

'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var ContactInfoVM = require('../viewmodels/ContactInfoVM');

var A = Activity.extend(function PublicContactInfo() {

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
        return ' Your contact info';
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
    
    this.contactInfo = new ContactInfoVM(app);

    this.user = this.contactInfo.user;

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
        this.contactInfo.save()
        .then(function() {
            app.successSave();
        })
        .catch(function() {
            // catch error, managed on event
        });
    }.bind(this);

    this.discard = function() {
        this.contactInfo.discard();
    };
    this.sync = function() {
        this.contactInfo.sync();
    };
   
    this.isLoading = this.contactInfo.isLoading;
    this.isSaving = this.contactInfo.isSaving;
    this.isSyncing = this.contactInfo.isSyncing;
    this.isLocked = this.contactInfo.isLocked;
}

