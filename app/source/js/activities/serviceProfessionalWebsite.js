/**
    serviceProfessionalWebsite activity
**/

'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var marketplaceProfile = require('../data/marketplaceProfile');
var MarketplaceProfilePictureVM = require('../viewmodels/MarketplaceProfilePictureVM');

var A = Activity.extend(function ServiceProfessionalWebsite() {

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
        return ' Your business website';
    }, this.viewModel);
    this.registerHandler({
        target: marketplaceProfile,
        event: 'error',
        handler: function(err) {
            var msg = err.task === 'save' ? 'Unable to save your public data.' : 'Unable to load your public data.';
            this.app.modals.showError({
                title: msg,
                error: err
            });
        }.bind(this)
    });
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


    this.marketplaceProfilePicture = new MarketplaceProfilePictureVM(app);

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
        this.marketplaceProfilePicture.save()
        .then(function() {
            app.successSave();
        })
        .catch(function() {
            // catch error, managed on event
        });
    }.bind(this);

    this.discard = function() {
        this.marketplaceProfilePicture.discard();
    };
    this.sync = function() {
        this.marketplaceProfilePicture.sync();
    };
   
    this.isLoading = this.marketplaceProfilePicture.isLoading;
    this.isSaving = this.marketplaceProfilePicture.isSaving;
    this.isSyncing = this.marketplaceProfilePicture.isSyncing;
    this.isLocked = this.marketplaceProfilePicture.isLocked;
}
