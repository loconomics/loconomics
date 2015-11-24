/**
    WorkPhotos activity
**/
'use strict';

var ko = require('knockout'),
    $ = require('jquery'),
    Activity = require('../components/Activity');

var WorkPhoto = require('../models/WorkPhoto'),
    photoTools = require('../utils/photoTools');

var A = Activity.extend(function WorkPhotosActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.serviceProfessional;
    this.viewModel = new ViewModel(this.app);
    // Defaults settings for navBar.
    this.navBar = Activity.createSubsectionNavBar('Job Title');

    // On changing jobTitleID:
    // - load photos
    this.registerHandler({
        target: this.viewModel.jobTitleID,
        handler: function(jobTitleID) {
            if (jobTitleID) {
                // Get data for the Job title ID
                this.app.model.workPhotos.getList(jobTitleID)
                .then(function(list) {
                    // Save for use in the view
                    this.viewModel.list(this.app.model.workPhotos.asModel(list));
                }.bind(this))
                .catch(function (err) {
                    this.app.modals.showError({
                        title: 'There was an error while loading.',
                        error: err
                    });
                }.bind(this));
            }
            else {
                this.viewModel.list([]);
            }
        }.bind(this)
    });

    // Event handlers for photo list management
    this.registerHandler({
        target: this.$activity,
        selector: '.WorkPhotos-imgBtn',
        event: 'click',
        handler: function(event) {
            $(event.target).closest('li').toggleClass('is-selected');
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);

    var params = options && options.route && options.route.segments;
    this.viewModel.jobTitleID(params[0] |0);
    this.viewModel.removedItems.removeAll();
};

function ViewModel(app) {

    this.jobTitleID = ko.observable(0);
    this.list = ko.observableArray([]);
    this.removedItems = ko.observableArray([]);
    
    this.state = app.model.workPhotos.state;
    
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

    this.addNew = function() {
        // Pick a new photo
        this.openPhotoPicker()
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
            app.modals.showError({ error: err, title: 'Error getting photo.' });
        });
    }.bind(this);

    this.removeImg = function(item) {
        this.removedItems.push(item);
        this.list.remove(item);
    }.bind(this);

    this.openPhotoPicker = function() {
        if (photoTools.takePhotoSupported()) {
            return photoTools.cameraGetPicture(cameraSettings)
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
    
    this.updateSort = function(/*info*/) {
        // TODO Update rankPosition on every item using the sorting info
    };
    
    // Delete on remote REST API all the registered items for deletion
    var remoteDeleteFlaggedItems = function() {
        return this.removedItems().reduce(function(cur, next) {
            return cur.then(function() {
                return app.model.workPhotos.delItem(next.jobTitleID(), next.workPhotoID());
            });
        }, Promise.resolve());
    }.bind(this);
    
    // Upload to remote REST API every photo or data in sequence
    var uploadAllItems = function() {
        return this.list().reduce(function(cur, next) {
            return cur.then(function() {
                return app.model.workPhotos.setItem(next.model.toPlainObject(true));
            });
        }, Promise.resolve());
    }.bind(this);
    
    this.save = function() {
        remoteDeleteFlaggedItems()
        .then(uploadAllItems)
        .then(function(/*updatedWorkPhotos*/) {
            // all executed
            app.successSave();
        })
        .catch(function(err) {
            app.modals.showError({
                title: 'Error saving your photos',
                error: err
            });
        });
    }.bind(this);
}
