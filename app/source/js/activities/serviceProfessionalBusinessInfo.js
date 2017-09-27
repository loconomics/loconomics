/**
    serviceProfessionalBusinessInfo activity
**/

'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var listing = require('../data/marketplaceProfile');
var ListingVM = require('../viewmodels/MarketplaceProfileVM');

var A = Activity.extend(function ServiceProfessionalBusinessInfo() {

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
        return ' Your business info';
    }, this.viewModel);
    this.registerHandler({
        target: listing,
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

    this.listingBusinessInfo = new ListingVM(app);

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
        this.listingBusinessInfo.save()
        .then(function() {
            app.successSave();
        })
        .catch(function() {
            // catch error, managed on event
        });
    }.bind(this);

    this.discard = function() {
        this.listingBusinessInfo.discard();
    };
    this.sync = function() {
        this.listingBusinessInfo.sync();
    };
   
    this.isLoading = this.listingBusinessInfo.isLoading;
    this.isSaving = this.listingBusinessInfo.isSaving;
    this.isSyncing = this.listingBusinessInfo.isSyncing;
    this.isLocked = this.listingBusinessInfo.isLocked;
}
