/**
    MarketplaceProfilePicture ViewModel extends the MarketplaceProfileVM
    to add the posibility to upload a profile photo additionally to other marketplace
    profile changes.
    REMEMBER: Even if the profile photo URL comes at a GET request to the marketplace profile REST API,
    the ability to upload a new photo exist at a different end-point in the API.
**/
'use strict';
var $ = require('jquery');
var ko = require('knockout');
var photoTools = require('../utils/photoTools');
var MarketplaceProfileVM = require('./MarketplaceProfileVM');

module.exports = function MarketplaceProfilePictureVM(app) {
    //jshint maxstatements:30
    // Base class:
    MarketplaceProfileVM.call(this, app);

    this.user = app.model.userProfile.data;
    this.photoUploadUrl = app.model.rest.baseUrl + 'me/profile-picture';
    this.photoEditRestUrl = 'me/profile-picture/edit';
    this.photoUploadFieldName = 'profilePicture';
    this.localPhotoData = ko.observable();
    this.localPhotoPreview = ko.observable();
    this.takePhotoSupported = ko.observable(photoTools.takePhotoSupported());

    // NOTE: uploader options just for web uploads
    if (!this.takePhotoSupported()) {
        this.uploaderOptions = {
            url: this.photoUploadUrl,
            dataType: 'json',
            type: 'PUT',
            paramName: this.photoUploadFieldName,
            autoUpload: false,
            acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
            maxFileSize: 5000000, // 5MB
            disableImageResize: true,
            // // Enable image resizing, except for Android and Opera,
            // // which actually support image resizing, but fail to
            // // send Blob objects via XHR requests:
            // disableImageResize: /Android(?!.*Chrome)|Opera/
            // .test(window.navigator.userAgent),
            previewMaxWidth: 120,
            previewMaxHeight: 120,
            previewCrop: true
        };
        this.uploaderEventHandlers = {
            fileuploadadd: function (e, data) {
                this.localPhotoData(data);
                this.rotationAngle(0);
            },
            fileuploadprocessalways: function (e, data) {
                var file = data.files[data.index];
                if (file.error) {
                    // TODO Show preview error?
                    console.error('Photo Preview', file.error);
                }
                else if (file.preview) {
                    this.localPhotoPreview(file.preview);
                }
            }
        };
    }
    else {
        this.uploaderOptions = null;
        this.uploaderEventHandlers = null;
    }

    // Actions

    var baseDiscard = this.discard;
    this.discard = function discard() {
        baseDiscard();
        this.localPhotoUrl('');
        this.previewPhotoUrl('');
        this.localPhotoData(null);
        this.localPhotoPreview(null);
        this.rotationAngle(0);
    }.bind(this);

    var baseSave = this.save;
    this.save = function save() {
        this.isSaving(true);
        // Because of problems with image cache, we need to ensure the
        // loading of the new photoUrl with timestamp updated AFTER we actually
        // uploaded a new photo, that prevents us from use parallel requests (by using Promise.all)
        // that is more performant, but uploading first the photo and then profile details we avoid 'cached image' problems.
        /*Promise.all([
            baseSave(),
            this.uploadPhoto()
        .then(function(data) {
        ])*/
        return this.uploadPhoto()
        .then(function(data) {
            // Request the photo from remote to force cache to refresh
            if (data) {
                $.get(data.profilePictureUrl);
            }
            // Save marketplace data and wait to finish:
            return baseSave();
        })
        .then(function() {
            this.isSaving(false);
        }.bind(this))
        .catch(function(err) {
            this.isSaving(false);
            // re-throw
            throw err;
        }.bind(this));
    }.bind(this);


    /// Photo/file management code:

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
                this.rotationAngle(0);
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

    /**
     * Sends rotationAngle value to server (if different than zero)
     * asking to rotate the photo already there
     * (the 'remote photo').
     *
     * This is used only when there is no new file to upload, because
     * that code already includes this editing.
     *
     * TODO: implement cropping, taking care of the exception.
     */
    var editRemotePhoto = function() {
        var r = this.rotationAngle();
        if (r === 0) return Promise.resolve(null);

        return app.model.rest.post(this.photoEditRestUrl, {
            rotationAngle: r
        });
    }.bind(this);

    var nativeUploadPhoto = function() {
        if (!this.localPhotoUrl()) return editRemotePhoto();
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
        if (!fd) return editRemotePhoto();
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
};

// Base class
module.exports._inherits(MarketplaceProfileVM);
