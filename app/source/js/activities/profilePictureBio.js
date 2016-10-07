/**
    ProfilePictureBio activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var ProfilePictureBioVM = require('../viewmodels/MarketplaceProfilePictureVM');

var A = Activity.extend(function ProfilePictureBioActivity() {
    
    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.loggedUser;
    
    var serviceProfessionalNavBar = Activity.createSubsectionNavBar('Marketplace profile', {
        backLink: '/marketplaceProfile' , helpLink: this.viewModel.helpLinkProfessionals
    });
    this.serviceProfessionalNavBar = serviceProfessionalNavBar.model.toPlainObject(true);
    var clientNavBar = Activity.createSubsectionNavBar('Marketplace profile', {
        backLink: '/marketplaceProfile' , helpLink: this.viewModel.helpLinkClients
    });
    this.clientNavBar = serviceProfessionalNavBar.model.toPlainObject(true);
    this.navBar = this.viewModel.user.isServiceProfessional() ? serviceProfessionalNavBar : clientNavBar;
        
    this.registerHandler({
        target: this.app.model.marketplaceProfile,
        event: 'error',
        handler: function(err) {
            if (err.task === 'load' || err.task === 'sync') {
                this.app.modals.showError({
                    title: 'Error loading your data.',
                    error: err && err.error || err
                });
            }
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {
    
    if (!this.app.model.onboarding.updateNavBar(this.navBar)) {
        // Reset
        var nav = this.viewModel.user.isServiceProfessional() ? this.serviceProfessionalNavBar : this.clientNavBar;
        this.navBar.model.updateWith(nav, true);
    }
};

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    // Discard any previous unsaved edit
    this.viewModel.discard();
    
    // Keep data updated:
    this.viewModel.sync();
    
    this.updateNavBarState();
};

function ViewModel(app) {
    
    this.user = app.model.userProfile.data;
    this.helpLinkProfessionals = '/help/relatedArticles/201960933-writing-your-profile-bio';
    this.helpLinkClients = '/help/relatedArticles/201213895-managing-your-marketplace-profile';
    this.helpLink = ko.pureComputed(function() {
        return this.user.isServiceProfessional() ? this.helpLinkProfessionals : this.helpLinkClients ;
    }, this);

    var t = new ProfilePictureBioVM(app);

    t.submitText = ko.pureComputed(function() {
        return (
            this.isLoading() ? 
                'loading...' : 
                this.isSaving() ? 
                    'saving...' : 
                    'Save'
        );
    }, t);
    
    var save = t.save;
    t.save = function() {
        save()
        .then(function() {
            app.successSave();
        }.bind(this))
        .catch(function(err) {
            app.modals.showError({
                title: 'Error saving your data.',
                error: err && err.error || err
            });
        }.bind(this));
    };
    
    return t;
}
