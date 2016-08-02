/**
    ProfilePictureBio activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout'),
    photoTools = require('../utils/photoTools'),
    $ = require('jquery');
require('jquery.fileupload-image');

var A = Activity.extend(function ProfilePictureBioActivity() {
    
    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.loggedUser;
    
    var serviceProfessionalNavBar = Activity.createSubsectionNavBar('Marketplace profile', {
        backLink: '/marketplaceProfile' , helpLink: '/help/relatedArticles/201960933-writing-your-profile-bio'
    });
    this.serviceProfessionalNavBar = serviceProfessionalNavBar.model.toPlainObject(true);
    var clientNavBar = Activity.createSubsectionNavBar('Marketplace profile', {
        backLink: '/marketplaceProfile' , helpLink: '/help/relatedArticles/201213895-managing-your-marketplace-profile'
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
    
    if (!photoTools.takePhotoSupported()) {
        // Web version to pick a photo/file
        var $input = this.$activity.find('#profilePictureBio-photoFile');//input[type=file]
        var $avatar = this.$activity.find('.Avatar');
        $input.fileupload({
            url: this.viewModel.photoUploadUrl,
            dataType: 'json',
            type: 'PUT',
            paramName: this.viewModel.photoUploadFieldName,
            autoUpload: false,
            acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
            maxFileSize: 5000000, // 5MB
            disableImageResize: true,
            // // Enable image resizing, except for Android and Opera,
            // // which actually support image resizing, but fail to
            // // send Blob objects via XHR requests:
            // disableImageResize: /Android(?!.*Chrome)|Opera/
            // .test(window.navigator.userAgent),
            previewMaxWidth: $avatar.width(),
            previewMaxHeight: $avatar.height(),
            previewCrop: true
        })
        .on('fileuploadadd', function (e, data) {
            this.viewModel.localPhotoData(data);
        }.bind(this))
        .on('fileuploadprocessalways', function (e, data) {
            var file = data.files[data.index];
            if (file.error) {
                // TODO Show preview error?
                console.error('Photo Preview', file.error);
            }
            else if (file.preview) {
                this.viewModel.localPhotoPreview(file.preview);
            }
        }.bind(this));
    }
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
    this.app.model.marketplaceProfile.sync();
    
    this.updateNavBarState();
};

function ViewModel(app) {
    //jshint maxstatements:30
    
    this.user = app.model.userProfile.data;
    this.photoUploadUrl = app.model.rest.baseUrl + 'me/profile-picture';
    this.photoUploadFieldName = 'profilePicture';
    this.localPhotoData = ko.observable();
    this.localPhotoPreview = ko.observable();
    this.takePhotoSupported = ko.observable(photoTools.takePhotoSupported());

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
        this.localPhotoData(null);
        this.localPhotoPreview(null);
        this.rotationAngle(0);
    }.bind(this);

    this.save = function save() {
        this.isSaving(true);
        // Because of problems with image cache, we need to ensure the
        // loading of the new photoUrl with timestamp updated AFTER we actually
        // uploaded a new photo, that prevents us from use parallel requests (by using Promise.all)
        // that is more performant, but uploading first the photo and then profile details we avoid 'cached image' problems.
        /*Promise.all([
            profileVersion.pushSave(),
            this.uploadPhoto()
        .then(function(data) {
        ])*/
        this.uploadPhoto()
        .then(function(data) {
            profileVersion.pushSave();
            return data;
        })
        .then(function(data) {
            app.successSave();
            // Request the photo from remote to force cache to refresh
            if (data) {
                $.get(data.profilePictureUrl);
            }
            this.isSaving(false);
        }.bind(this))
        .catch(function(err) {
            app.modals.showError({
                title: 'Error saving your data.',
                error: err && err.error || err
            });
            this.isSaving(false);
        }.bind(this));
    }.bind(this);
    
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
    
    var nativeUploadPhoto = function() {
        if (!this.localPhotoUrl()) return Promise.resolve(null);
        var uploadSettings = {
            fileKey: this.photoUploadFieldName,
            mimeType: 'image/jpeg',
            httpMethod: 'PUT',
            headers: $.extend(true, {}, app.model.rest.extraHeaders),
            params: {
                rotationAngle: this.rotationAngle()
            }
        };
        return photoTools.uploadLocalFileJson(this.localPhotoUrl(), this.photoUploadUrl, uploadSettings);
    }.bind(this);
    
    var webUploadPhoto = function() {
        var fd = this.localPhotoData();
        if (!fd) return Promise.resolve(null);
        // NOTE: If URL needs update before upload: fd.url = ..;
        fd.headers = $.extend(true, {}, app.model.rest.extraHeaders);
        fd.formData = [{
            name: 'rotationAngle',
            value: this.rotationAngle()
        }];
        return Promise.resolve(fd.submit());
    }.bind(this);

    this.uploadPhoto = function() {
        if (photoTools.takePhotoSupported()) {
            return nativeUploadPhoto();
        }
        else {
            return webUploadPhoto();
        }
    }.bind(this);
    
    this.rotationAngle = ko.observable(0);
    this.rotatePhoto = function() {
        var d = this.rotationAngle() |0;
        this.rotationAngle((d + 90) % 360);
    };
    this.photoRotationStyle = ko.pureComputed(function() {
        var d = this.rotationAngle() |0;
        return 'transform: rotate(' + d + 'deg);';
    }, this);
}
