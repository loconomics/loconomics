/**
    WorkPhotos activity
**/
'use strict';

var ko = require('knockout'),
    $ = require('jquery'),
    Activity = require('../components/Activity');

var WorkPhoto = require('../models/WorkPhoto'),
    photoTools = require('../utils/photoTools');
require('jquery.fileupload-image');
var workPhotos = require('../data/workPhotos');
require('../kocomponents/button-file');
var showError = require('../modals/error').show;

var A = Activity.extend(function WorkPhotosActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.serviceProfessional;
    this.viewModel = new ViewModel(this.app);

    this.navBar = Activity.createSubsectionNavBar('Job Title', {
        backLink: '/marketplaceProfile', helpLink: this.viewModel.helpLink
    });
    this.title('Your work photos');

    // Event handlers for photo list management
    this.registerHandler({
        target: this.$activity,
        selector: '.WorkPhotos-imgBtn',
        event: 'click mouseenter mouseleave',
        handler: function(event) {
            if (!this.viewModel.state.isLocked())
                $(event.target).closest('li').toggleClass('is-selected', event.type === 'mouseenter' || event.type === 'click');
        }.bind(this)
    });

    if (!photoTools.takePhotoSupported()) {
        // Web version to pick a photo/file
        this.viewModel.inputElement.subscribe(function(input) {
            if (!input) return;
            var $input = $(input);
            // Constant size: is the maximum as defined in the CSS and server processing.
            var PHOTO_WIDTH = 442;
            var PHOTO_HEIGHT = 332;
            $input.fileupload({
                // Asigned per file uploaded:
                //url: 'assigned per file uploaded',
                //type: 'PUT',
                //paramName: 'file',
                dataType: 'json',
                autoUpload: false,
                acceptFileTypes: /(\.|\/)(jpe?g)$/i,
                maxFileSize: 5000000, // 5MB
                disableImageResize: true,
                // // Enable image resizing, except for Android and Opera,
                // // which actually support image resizing, but fail to
                // // send Blob objects via XHR requests:
                // disableImageResize: /Android(?!.*Chrome)|Opera/
                // .test(window.navigator.userAgent),
                previewMaxWidth: PHOTO_WIDTH,
                previewMaxHeight: PHOTO_HEIGHT,
                previewCrop: false
            })
            .on('fileuploadprocessalways', function (e, data) {
                var file = data.files[data.index];
                if (file.error) {
                    // TODO Show preview error?
                    console.error('Photo Preview', file.error);
                }
                else if (file.preview) {
                    //this.viewModel.list()[data.index].localTempPhotoPreview(file.preview);
                    var newItem = new WorkPhoto({
                        workPhotoID: 0,
                        jobTitleID: this.viewModel.jobTitleID(),
                        url: null,
                        localTempFileData: data,
                        localTempPhotoPreview: file.preview,
                        caption: ''
                    });
                    this.viewModel.list.push(newItem);

                    // Usability/accessibility: after add a new item, move focus
                    // to it's caption textbox.
                    // Give a moment to allow DOM processing using a timeout
                    setTimeout(function() {
                        this.$activity
                        .find('.WorkPhotos > li:last-child input[type=text]')
                        .focus();
                    }.bind(this));
                }
            }.bind(this));
        }.bind(this));
    }
});

exports.init = A.init;

A.prototype.show = function show(options) {
    // Reset
    this.viewModel.list.removeAll();
    this.viewModel.removedItems.removeAll();
    this.viewModel.jobTitleID(0);

    Activity.prototype.show.call(this, options);

    var params = options && options.route && options.route.segments;
    var jobTitleID = params[0] |0;
    this.viewModel.jobTitleID(jobTitleID);
    if (jobTitleID) {
        // Get data for the Job title ID
        workPhotos.getList(jobTitleID)
        .then(function(list) {
            // Save for use in the view
            this.viewModel.list(workPhotos.asModel(list));
        }.bind(this))
        .catch(function (err) {
            showError({
                title: 'There was an error while loading.',
                error: err
            });
        });
    }
    else {
        this.viewModel.list([]);
    }
};

function ViewModel(app) {
    this.helpLink = '/help/relatedArticles/201964193-showcase-your-work-with-photos';

    this.jobTitleID = ko.observable(0);
    this.list = ko.observableArray([]);
    this.removedItems = ko.observableArray([]);

    this.takePhotoSupported = ko.observable(photoTools.takePhotoSupported());

    this.state = workPhotos.state;
    this.inputElement = ko.observable();

    this.saveBtnText = ko.pureComputed(function() {
        return this.state.isSaving() ? 'Saving..' : this.state.isLoading() ? 'Loading..' : this.state.isDeleting() ? 'Deleting..' : 'Save';
    }, this);


    // IMPORTANT: Size like the server 'original' photo, that's the 'visible size on screen' multiply
    // by the scale for the original used to create hidpi versions and to crop with quality.
    var cameraSettings = {
        targetWidth: 442 * 3,
        targetHeight: 332 * 3,
        correctOrientation: true
    };

    var addNew = function(fromCamera) {
        // Pick a new photo
        this.openPhotoPicker(fromCamera)
        .then(function(data) {
            var newItem = new WorkPhoto({
                workPhotoID: 0,
                jobTitleID: this.jobTitleID(),
                url: data.previewUrl,
                localTempFilePath: data.localUrl,
                caption: ''
            });
            this.list.push(newItem);
        }.bind(this))
        .catch(function(err) {
            // A user abort gives no error or 'no image selected' on iOS 9/9.1
            if (err && err !== 'no image selected' && err !== 'has no access to camera') {
                showError({ error: err, title: 'Error getting photo.' });
            }
        });
    }.bind(this);

    this.takePhotoForNew = function() {
        addNew(true);
    }.bind(this);

    this.pickPhotoForNew = function() {
        addNew(false);
    }.bind(this);

    this.removeImg = function(item) {
        this.removedItems.push(item);
        this.list.remove(item);
    }.bind(this);

    this.rotateImg = function(item) {
        var d = item.rotationAngle() |0;
        item.rotationAngle((d + 90) % 360);
    }.bind(this);

    this.openPhotoPicker = function(fromCamera) {
        var settings = $.extend({}, cameraSettings, {
            sourceType: fromCamera ?
                window.Camera && window.Camera.PictureSourceType.CAMERA :
                window.Camera && window.Camera.PictureSourceType.PHOTOLIBRARY
        });
        if (photoTools.takePhotoSupported()) {
            return photoTools.cameraGetPicture(settings)
            .then(function(imgLocalUrl) {
                return {
                    localUrl: imgLocalUrl,
                    previewUrl: photoTools.getPreviewPhotoUrl(imgLocalUrl)
                };
            });
        }
        else {
            return Promise.reject('Take photo is not supported on the web right now');
        }
    };

    // Delete on remote REST API all the registered items for deletion
    var remoteDeleteFlaggedItems = function() {
        return this.removedItems().reduce(function(cur, next) {
            return cur.then(function() {
                return workPhotos.delItem(next.jobTitleID(), next.workPhotoID());
            });
        }, Promise.resolve());
    }.bind(this);

    // Upload to remote REST API every photo or data in sequence
    var uploadAllItems = function() {
        return this.list().reduce(function(cur, next) {
            return cur.then(function() {
                return workPhotos.setItem(next.model.toPlainObject(true));
            });
        }, Promise.resolve());
    }.bind(this);

    this.save = function() {
        remoteDeleteFlaggedItems()
        .then(uploadAllItems)
        .then(function(/*updatedWorkPhotos*/) {
            // all executed
            app.successSave();
            this.removedItems.removeAll();
        }.bind(this))
        .catch(function(err) {
            showError({
                title: 'Error saving your photos',
                error: err
            });
        });
    }.bind(this);
}
