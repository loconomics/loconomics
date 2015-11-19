/**
    ProfilePictureBio activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');

var A = Activity.extend(function ProfilePictureBioActivity() {
    
    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.loggedUser;
    
    this.navBar = Activity.createSubsectionNavBar('Marketplace profile', {
        backLink: 'marketplaceProfile'
    });
    
    this.registerHandler({
        target: this.app.model.marketplaceProfile,
        event: 'error',
        handler: function(err) {
            var msg = err.task === 'save' ? 'Error saving your data.' : 'Error loading your data.';
            this.app.modals.showError({
                title: msg,
                error: err && err.error || err
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
    this.app.model.marketplaceProfile.sync();
};

function ViewModel(app) {

    // Marketplace Profile
    var marketplaceProfile = app.model.marketplaceProfile;
    var profileVersion = marketplaceProfile.newVersion();
    profileVersion.isObsolete.subscribe(function(itIs) {
        if (itIs) {
            // new version from server while editing
            // FUTURE: warn about a new remote version asking
            // confirmation to load them or discard and overwrite them;
            // the same is need on save(), and on server response
            // with a 509:Conflict status (its body must contain the
            // server version).
            // Right now, just overwrite current changes with
            // remote ones:
            profileVersion.pull({ evenIfNewer: true });
        }
    });
    
    // Actual data for the form:
    this.profile = profileVersion.version;
    
    // Control observables: special because must a mix
    // of the both remote models used in this viewmodel
    this.isLocked = marketplaceProfile.isLocked;
    this.isLoading = marketplaceProfile.isLoading;
    this.isSaving = marketplaceProfile.isSaving;

    this.submitText = ko.pureComputed(function() {
        return (
            this.isLoading() ? 
                'loading...' : 
                this.isSaving() ? 
                    'saving...' : 
                    'Save'
        );
    }, this);

    // Actions

    this.discard = function discard() {
        profileVersion.pull({ evenIfNewer: true });
    }.bind(this);

    this.save = function save() {
        profileVersion.pushSave()
        .then(function() {
            app.successSave();
        })
        .catch(function() {
            // catch error, managed on event
        });
    }.bind(this);
}
