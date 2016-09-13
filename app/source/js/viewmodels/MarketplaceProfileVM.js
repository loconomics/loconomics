'use strict';

module.exports = function MarketplaceProfileVM(app) {

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

    this.isLoading = marketplaceProfile.isLoading;
    this.isSaving = marketplaceProfile.isSaving;
    this.isLocked = marketplaceProfile.isLocked;

    this.discard = function discard() {
        profileVersion.pull({ evenIfNewer: true });
    };

    this.save = function save() {
        return profileVersion.pushSave();
    };
    
    this.sync = app.model.marketplaceProfile.sync.bind(app.model.marketplaceProfile);
};
