/**
    ProfilePictureBio activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout'),
    photoTools = require('../utils/photoTools'),
    $ = require('jquery');

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
        this.localPhotoUrl('');
        this.previewPhotoUrl('');
    }.bind(this);

    this.save = function save() {
        Promise.all([
            profileVersion.pushSave(),
            this.uploadPhoto()
        ])
        .then(function(data) {
            app.successSave();
            if (data && data[1])
                $.get(data[1].profilePictureUrl);
        })
        .catch(function(err) {
            app.modals.showError({
                title: 'Error saving your data.',
                error: err && err.error || err
            });
        });
    }.bind(this);
    
    this.takePhotoSupported = photoTools.takePhotoSupported;
    var cameraSettings = {
        targetWidth: 600,
        targetHeight: 600,
        quality: 90
    };
    
    this.previewPhotoUrl = ko.observable('');
    this.localPhotoUrl = ko.observable('');
    var takePickPhoto = function takePhoto(fromCamera) {
        var settings = $.extend({}, cameraSettings, {
            sourceType: fromCamera ?
                window.Camera && window.Camera.PictureSourceType.CAMERA :
                window.Camera && window.Camera.PictureSourceType.PHOTOLIBRARY
        });
        if (photoTools.takePhotoSupported()) {
            photoTools.cameraGetPicture(settings)
            .then(function(imgLocalUrl) {
                this.localPhotoUrl(imgLocalUrl);
                this.previewPhotoUrl(photoTools.getPreviewPhotoUrl(imgLocalUrl));
            }.bind(this))
            .catch(function(err) {
                // A user abort gives no error or 'no image selected' on iOS 9/9.1
                if (err && err !== 'no image selected' && err !== 'has no access to camera') {
                    app.modals.showError({ error: err, title: 'Error getting photo.' });
                }
            });
        }
        else {
            app.modals.showNotification({
                message: 'Take photo is not supported on the web right now'
            });
        }
    }.bind(this);
    
    this.takePhoto = function() {
        takePickPhoto(true);
    }.bind(this);
    
    this.pickPhoto = function() {
        takePickPhoto(false);
    }.bind(this);
    
    this.uploadPhoto = function() {
        if (!this.localPhotoUrl()) return null;
        var uploadSettings = {
            fileKey: 'profilePicture',
            mimeType: 'image/jpeg',
            httpMethod: 'PUT',
            headers: $.extend(true, {}, app.model.rest.extraHeaders)
        };
        return photoTools.uploadLocalFileJson(this.localPhotoUrl(), app.model.rest.baseUrl + 'me/profile-picture', uploadSettings);
    }.bind(this);
}
