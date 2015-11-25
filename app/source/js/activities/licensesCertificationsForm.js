/**
    LicensesCertificationsForm activity
**/
'use strict';

var Activity = require('../components/Activity'),
    ko = require('knockout'),
    photoTools = require('../utils/photoTools');

var A = Activity.extend(function LicensesCertificationsFormActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.serviceProfessional;

    this.navBar = Activity.createSubsectionNavBar('Certifications/Licenses');
    this.defaultNavBarSettings = this.navBar.model.toPlainObject(true);
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {

    var link = this.requestData.cancelLink || '/licensesCertifications/';
    
    if (this.viewModel.isNew())
        this.convertToCancelAction(this.navBar.leftAction(), link);
    else
        this.navBar.model.updateWith(this.defaultNavBarSettings, true);
};

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    // Reset
    this.viewModel.version(null);

    // Params
    var params = state && state.route && state.route.segments || [];
    
    this.viewModel.jobTitleID(params[0] |0);
    this.viewModel.licenseCertificationID(params[1] |0);
    
    this.updateNavBarState();
    
    var ModelVersion = require('../utils/ModelVersion'),
        UserLicenseCertification = require('../models/UserLicenseCertification');
    
    if (this.viewModel.isNew()) {
        this.app.model.statesProvinces.getList()
        .then(function(list) {
            this.viewModel.statesProvinces(list());
            this.viewModel.version(new ModelVersion(new UserLicenseCertification()));
        }.bind(this));
    }
    else {
        this.app.model.userLicensesCertifications
        .getItem(this.viewModel.jobTitleID(), this.viewModel.licenseCertificationID())
        .then(function(data) {
            this.viewModel.version(new ModelVersion(new UserLicenseCertification(data)));
        }.bind(this))
        .catch(function (err) {
            this.app.modals.showError({
                title: 'There was an error while loading.',
                error: err
            })
            .then(function() {
                // On close modal, go back
                this.app.shell.goBack();
            }.bind(this));
        }.bind(this));
    }
};

function ViewModel(app) {

    this.statesProvinces = ko.observable();
    this.licenseCertificationID = ko.observable(0);
    this.jobTitleID = ko.observable(0);
    this.isLoading = ko.pureComputed(function() {
        return (
            app.model.userLicensesCertifications.state.isLoading() ||
            app.model.statesProvinces.state.isLoading()
        );
    }, this);
    this.isSaving = app.model.userLicensesCertifications.state.isSaving;
    this.isSyncing = app.model.userLicensesCertifications.state.isSyncing;
    this.isDeleting = app.model.userLicensesCertifications.state.isDeleting;
    this.isLocked = ko.pureComputed(function() {
        return (
            app.model.userLicensesCertifications.state.isLocked() ||
            app.model.statesProvinces.state.isLocked()
        );
    }, this);
    this.isReady = ko.pureComputed(function() {
        var it = this.item();
        return !!(it && it.stateProvinceCode() && it.localTempFilePath());
    }, this);
    
    this.submitText = ko.pureComputed(function() {
        return (this.isLoading() || this.isSyncing()) ? 'Loading..' : this.isSaving() ? 'Saving..' : this.isDeleting() ? 'Deleting..' : 'Save';
    }, this);

    this.isNew = ko.pureComputed(function() {
        return this.licenseCertificationID() === 0;
    }, this);
    
    this.version = ko.observable(null);
    this.item = ko.pureComputed(function() {
        var v = this.version();
        if (v) {
            return v.version;
        }
        return null;
    }, this);

    this.unsavedChanges = ko.pureComputed(function() {
        var v = this.version();
        return v && v.areDifferent();
    }, this);
    
    this.deleteText = ko.pureComputed(function() {
        return (
            this.isDeleting() ? 
                'Deleting...' : 
                'Delete'
        );
    }, this);

    this.save = function() {
        app.model.userLicensesCertifications.setItem(this.item().model.toPlainObject())
        .then(function(serverData) {
            // Update version with server data.
            this.item().model.updateWith(serverData);
            // Push version so it appears as saved
            this.version().push({ evenIfObsolete: true });
            // Go out
            app.successSave();
        }.bind(this))
        .catch(function(err) {
            app.modals.showError({
                title: 'There was an error while saving.',
                error: err
            });
        });

    }.bind(this);
    
    this.confirmRemoval = function() {
        // L18N
        app.modals.confirm({
            title: 'Delete',
            message: 'Are you sure? The operation cannot be undone.',
            yes: 'Delete',
            no: 'Keep'
        })
        .then(function() {
            this.remove();
        }.bind(this));
    }.bind(this);

    this.remove = function() {
        app.model.userLicensesCertifications.delItem(this.jobTitleID(), this.licenseCertificationID())
        .then(function() {
            // Go out
            app.successSave();
        }.bind(this))
        .catch(function(err) {
            app.modals.showError({
                title: 'There was an error while deleting.',
                error: err
            });
        });
    }.bind(this);
    
    var addNew = function(fromCamera) {
        var settings = {
            sourceType: fromCamera ?
                window.Camera && window.Camera.PictureSourceType.CAMERA :
                window.Camera && window.Camera.PictureSourceType.PHOTOLIBRARY
        };
        if (photoTools.takePhotoSupported()) {
            return photoTools.cameraGetPicture(settings)
            .then(function(imgLocalUrl) {
                this.item().localTempFilePath(imgLocalUrl);
                //photoTools.getPreviewPhotoUrl(imgLocalUrl)
            }.bind(this));
        }
        else {
            app.modals.showError({ error: 'Take photo is not supported on the web right now' });
        }
    }.bind(this);
    
    this.takePhotoForNew = function() {
        addNew(true);
    }.bind(this);
    
    this.pickPhotoForNew = function() {
        addNew(false);
    }.bind(this);
}
