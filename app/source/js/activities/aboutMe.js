/**
    AboutMe activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var createPostalCodeAutolookup = require('../utils/createPostalCodeAutolookup');

var A = Activity.extend(function AboutMeActivity() {
    
    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.loggedUser;
    
    var serviceProfessionalNavBar = Activity.createSubsectionNavBar('Account', {
        backLink: '/account' , helpLink: this.viewModel.helpLinkProfessionals
    });
    this.serviceProfessionalNavBar = serviceProfessionalNavBar.model.toPlainObject(true);
    var clientNavBar = Activity.createSubsectionNavBar('Account', {
        backLink: '/account' , helpLink: this.viewModel.helpLinkClients
    });
    this.clientNavBar = serviceProfessionalNavBar.model.toPlainObject(true);
    this.navBar = this.viewModel.user.isServiceProfessional() ? serviceProfessionalNavBar : clientNavBar;
    
    this.registerHandler({
        target: this.app.model.userProfile,
        event: 'error',
        handler: function(err) {
            var msg = err.task === 'save' ? 'Error saving contact data.' : 'Error loading contact data.';
            this.app.modals.showError({
                title: msg,
                error: err && err.error || err
            });
        }.bind(this)
    });
    
    this.registerHandler({
        target: this.app.model.homeAddress,
        event: 'error',
        handler: function(err) {
            var msg = err.task === 'save' ? 'Error saving address details.' : 'Error loading address details.';
            this.app.modals.showError({
                title: msg,
                error: err && err.error || err
            });
        }.bind(this)
    });

    this.registerHandler({
        target: this.app.model.marketplaceProfile,
        event: 'error',
        handler: function(err) {
            var msg = err.task === 'save' ? 'Error saving your public data.' : 'Error loading your public data.';
            this.app.modals.showError({
                title: msg,
                error: err && err.task && err.error || err
            });
        }.bind(this)
    });
    
    // On change to a valid code, do remote look-up
    createPostalCodeAutolookup({
        appModel: this.app.model,
        address: this.viewModel.contactInfo.address,
        postalCodeError: this.viewModel.contactInfo.errorMessages.postalCode
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
    
    this.updateNavBarState();
    
    // Keep data updated:
    this.viewModel.sync();
};

var ContactInfoVM = require('../viewmodels/ContactInfoVM');
var MarketplaceProfilePictureVM = require('../viewmodels/MarketplaceProfilePictureVM');

function ViewModel(app) {
    
    this.helpLinkProfessionals = '/help/relatedArticles/201967756-telling-the-community-about-yourself';
    this.helpLinkClients = '/help/relatedArticles/201960753-telling-the-community-about-yourself';
    this.helpLink = ko.pureComputed(function() {
        return this.user.isServiceProfessional() ? this.helpLinkProfessionals : this.helpLinkClients ;
    }, this);

    this.isInOnboarding = app.model.onboarding.inProgress;

    this.contactInfo = new ContactInfoVM(app);
    this.marketplaceProfilePicture = new MarketplaceProfilePictureVM(app);
    
    this.user = this.contactInfo.user;
    
    var vms = [this.contactInfo, this.marketplaceProfilePicture];
    
    this.submitText = ko.pureComputed(function() {
        return (
            app.model.onboarding.inProgress() ?
                'Save and continue' :
            this.isLoading() ? 
                'loading...' : 
                this.isSaving() ? 
                    'saving...' : 
                    'Save'
        );
    }, this);
    
    this.save = function() {
        Promise.all(vms.map(function(vm) { return vm.save(); }))
        .then(function() {
            if (app.model.onboarding.inProgress()) {
                app.model.onboarding.goNext();
            }
            else {
                app.successSave();
            }
        })
        .catch(function() {
            // catch error, managed on event
        });
    };
    
    this.discard = function() {
        vms.forEach(function(vm) {
            if (vm.discard) vm.discard();
        });
    };
    this.sync = function() {
        vms.forEach(function(vm) {
            if (vm.sync) vm.sync();
        });
    };

    var createStatusObs = function(t, name) {
        t[name] = ko.pureComputed(function() {
            vms.reduce(function(prev, vm) {
                if (vm[name] && vm[name]()) {
                    return true;
                }
                return prev;
            }, false);
        });
    };
    createStatusObs(this, 'isLoading');
    createStatusObs(this, 'isSaving');
    createStatusObs(this, 'isSyncing');
    createStatusObs(this, 'isLocked');
}
