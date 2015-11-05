/**
    LicensesCertificationsForm activity
**/
'use strict';

var Activity = require('../components/Activity'),
    ko = require('knockout');

var A = Activity.extends(function LicensesCertificationsFormActivity() {
    
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
    
    // TODO Remove when AppModel
    var ModelVersion = require('../utils/ModelVersion'),
        UserLicenseCertification = require('../models/UserLicenseCertification');
    
    if (this.viewModel.isNew()) {
        this.viewModel.version(new ModelVersion(new UserLicenseCertification()));
    }
    else {
        this.viewModel.version(new ModelVersion(new UserLicenseCertification({
            userID: 141,
            jobTitleID: 106,
            statusID: 2,
            licenseCertificationID: 18,
            licenseCertificationNumber: 21341234,
            stateProvinceID: 1,
            countryID: 1,
            expirationDate: new Date(2016, 1, 20),
            lastVerifiedDate: new Date(2015, 3, 20),
            createdDate: new Date(),
            updatedDate: new Date()
        })));
    }
    
    
    // TODO IT DOES NOT WORKS THIS WAY: in the website dahsboard, the licenseID is provided
    // to the form, because there is a short list of them available, NOT auto-generated.
    // CHECK if put a dropdown selection or list selection here and then show the form or 
    // put the list of possible on the listing page (at /licensesCertifications)
    
    if (this.viewModel.licenseCertificationID() === 0) {
        // NEW one
        /* TODO Uncomment when AppModel
        this.viewModel.version(this.app.model.licensesCertifications.newItem());
        */
    }
    else {
        // LOAD
        /* TODO Uncomment when AppModel
        this.app.model.education.createItemVersion(this.viewModel.educationID())
        .then(function (educationVersion) {
            if (educationVersion) {
                this.viewModel.version(educationVersion);
            } else {
                throw new Error('No data');
            }
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
        }.bind(this));*/
    }
};

function ViewModel(app) {

    this.licenseCertificationID = ko.observable(0);
    this.jobTitleID = ko.observable(0);
    // TODO Uncomment when appmodel
    this.isLoading = ko.observable(false); // app.model.licensesCertifications.state.isLoading;
    this.isSaving = ko.observable(false); //app.model.licensesCertifications.state.isSaving;
    this.isSyncing = ko.observable(false); //app.model.licensesCertifications.state.isSyncing;
    this.isDeleting = ko.observable(false); //app.model.licensesCertifications.state.isDeleting;
    this.isLocked = ko.observable(false); /*ko.computed(function() {
        return this.isDeleting() || app.model.licensesCertifications.state.isLocked();
    }, this);*/
    
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
    
    // Fields for the new-certification-file
    this.stateProvinceID = ko.observable(0);
    this.file = ko.observable('');

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
        app.model.licensesCertifications.setItem(this.item().model.toPlainObject())
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
        app.model.licensesCertifications.delItem(this.jobTitleID(), this.licenseCertificationID())
        .then(function() {
            // Go out
            // TODO: custom message??
            app.successSave();
        }.bind(this))
        .catch(function(err) {
            app.modals.showError({
                title: 'There was an error while deleting.',
                error: err
            });
        });
    }.bind(this);
    
    // TODO COMPLETE; FROM A MODEL, REMOTE?
    this.statesProvinces = ko.computed(function() {
        // BLOB copy:
        return [{"stateProvinceID":"23","name":"Alabama"},{"stateProvinceID":"49","name":"Alaska"},{"stateProvinceID":"52","name":"American Samoa"},{"stateProvinceID":"48","name":"Arizona"},{"stateProvinceID":"26","name":"Arkansas"},{"stateProvinceID":"60","name":"Armed Forces Americas (except Canada)"},{"stateProvinceID":"61","name":"Armed Forces Canada, Europe, Middle East, and Africa"},{"stateProvinceID":"62","name":"Armed Forces Pacific"},{"stateProvinceID":"1","name":"California"},{"stateProvinceID":"38","name":"Colorado"},{"stateProvinceID":"6","name":"Connecticut"},{"stateProvinceID":"2","name":"Delaware"},{"stateProvinceID":"51","name":"District of Columbia"},{"stateProvinceID":"57","name":"Federated States of Micronesia"},{"stateProvinceID":"28","name":"Florida"},{"stateProvinceID":"5","name":"Georgia"},{"stateProvinceID":"53","name":"Guam"},{"stateProvinceID":"50","name":"Hawaii"},{"stateProvinceID":"43","name":"Idaho"},{"stateProvinceID":"22","name":"Illinois"},{"stateProvinceID":"20","name":"Indiana"},{"stateProvinceID":"30","name":"Iowa"},{"stateProvinceID":"34","name":"Kansas"},{"stateProvinceID":"16","name":"Kentucky"},{"stateProvinceID":"19","name":"Louisiana"},{"stateProvinceID":"24","name":"Maine"},{"stateProvinceID":"58","name":"Marshall Islands"},{"stateProvinceID":"8","name":"Maryland"},{"stateProvinceID":"7","name":"Massachusetts"},{"stateProvinceID":"27","name":"Michigan"},{"stateProvinceID":"32","name":"Minnesota"},{"stateProvinceID":"21","name":"Mississippi"},{"stateProvinceID":"25","name":"Missouri"},{"stateProvinceID":"41","name":"Montana"},{"stateProvinceID":"37","name":"Nebraska"},{"stateProvinceID":"36","name":"Nevada"},{"stateProvinceID":"10","name":"New Hampshire"},{"stateProvinceID":"4","name":"New Jersey"},{"stateProvinceID":"47","name":"New Mexico"},{"stateProvinceID":"12","name":"New York"},{"stateProvinceID":"13","name":"North Carolina"},{"stateProvinceID":"39","name":"North Dakota"},{"stateProvinceID":"54","name":"Northern Mariana Islands"},{"stateProvinceID":"18","name":"Ohio"},{"stateProvinceID":"46","name":"Oklahoma"},{"stateProvinceID":"33","name":"Oregon"},{"stateProvinceID":"59","name":"Palau"},{"stateProvinceID":"3","name":"Pennsylvania"},{"stateProvinceID":"55","name":"Puerto Rico"},{"stateProvinceID":"14","name":"Rhode Island"},{"stateProvinceID":"9","name":"South Carolina"},{"stateProvinceID":"40","name":"South Dakota"},{"stateProvinceID":"17","name":"Tennessee"},{"stateProvinceID":"29","name":"Texas"},{"stateProvinceID":"56","name":"U.S. Virgin Islands"},{"stateProvinceID":"45","name":"Utah"},{"stateProvinceID":"15","name":"Vermont"},{"stateProvinceID":"11","name":"Virginia"},{"stateProvinceID":"42","name":"Washington"},{"stateProvinceID":"35","name":"West Virginia"},{"stateProvinceID":"31","name":"Wisconsin"},{"stateProvinceID":"44","name":"Wyoming"}];
    });
}
