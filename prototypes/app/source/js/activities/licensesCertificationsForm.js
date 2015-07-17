/**
    LicensesCertificationsForm activity
**/
'use strict';

var Activity = require('../components/Activity'),
    ko = require('knockout');

var A = Activity.extends(function LicensesCertificationsFormActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.Freelancer;

    this.navBar = Activity.createSubsectionNavBar('Certifications/Licenses');
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {

    var link = this.requestData.cancelLink || '/licensesCertifications/';
    
    this.convertToCancelAction(this.navBar.leftAction(), link);
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
    
    this.version = ko.observable(null);
    this.item = ko.pureComputed(function() {
        var v = this.version();
        if (v) {
            return v.version;
        }
        return null;
    }, this);
    
    this.isNew = ko.pureComputed(function() {
        var p = this.item();
        return p && !p.updatedDate();
    }, this);

    this.submitText = ko.pureComputed(function() {
        var v = this.version();
        return (
            this.isLoading() ? 
                'Loading...' : 
                this.isSaving() ? 
                    'Saving changes' : 
                    v && v.areDifferent() ?
                        'Save changes' :
                        'Saved'
        );
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
    this.counties = ko.computed(function() {
        return [
            {
                countyID: 1,
                name: 'Alameda'
            },
            {
                countyID: 2,
                name: 'Alpine'
            },
            {
                countyID: 3,
                name: 'Amador'
            }
        ];
    });
}
