/**
    AddressEditor activity

    TODO: ModelVersion is NOT being used, so no getting updates if server updates
    the data after load (data load is requested but get first from cache). Use
    version and get sync'ed data when ready, and additionally notification to
    override changes if server data is different that any local change.

    TODO: The URL structure and how params are read is ready to allow
    edition of different kind of addresses, but actually only service addresses
    are fully supported, since 'home address' is edited in contactInfo and
    'billing addresses' are not used currently, but when needed, the support for this
    last will need to be completed. All the API calls right now are
    for model.serviceAdddresses for example.
**/
'use strict';
var ko = require('knockout');
var Address = require('../models/Address');
var Activity = require('../components/Activity');
var PostalCodeVM = require('../viewmodels/PostalCode');
var onboarding = require('../data/onboarding');
var jobTitles = require('../data/jobTitles');
var serviceAddresses = require('../data/serviceAddresses');
var showConfirm = require('../modals/confirm').show;
var showError = require('../modals/error').show;

var A = Activity.extend(function AddressEditorActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.serviceProfessional;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('Locations', {
        backLink: '/scheduling' , helpLink: this.viewModel.helpLink
    });
    this.title('Edit location');

    // On changing jobTitleID:
    // - load job title name
    this.registerHandler({
        target: this.viewModel.jobTitleID,
        handler: function(jobTitleID) {
            if (jobTitleID) {
                // Get data for the Job title ID
                jobTitles.getJobTitle(jobTitleID)
                .then(function(jobTitle) {
                    // Fill in job title name
                    this.viewModel.jobTitleName(jobTitle.singularName());
                }.bind(this))
                .catch(function (err) {
                    showError({
                        title: 'There was an error while loading.',
                        error: err
                    });
                });
            }
            else {
                this.viewModel.jobTitleName('Job Title');
            }
        }.bind(this)
    });

    // Special treatment of the save operation
    this.viewModel.onSave = function(addressID) {
        if (this.requestData.returnNewAsSelected === true) {
            // Go to previous activity that required
            // to select an address
            // It's a new non-saved address
            if (this.viewModel.clientUserID()) {
                this.requestData.address = this.viewModel.address().model.toPlainObject(true);
            }
            else {
                this.requestData.addressID = addressID;
            }

            this.app.shell.goBack(this.requestData);
        }
        else if (onboarding.inProgress()) {
            // Per #712, we move to next onboarding step directly from editor
            // but implementation details at onboarding complicate this a bit,
            // so just go back and then move next
            this.app.shell.goBack();
            setTimeout(function() {
                onboarding.goNext();
            }, 100);
        }
        else {
            this.app.successSave();
        }
    }.bind(this);
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {

    var link = this.requestData.cancelLink || '/serviceAddresses/' + this.viewModel.jobTitleID();

    this.convertToCancelAction(this.navBar.leftAction(), link);
};

A.prototype.show = function show(options) {
    /* eslint complexity:"off" */
    Activity.prototype.show.call(this, options);

    // Reset
    this.viewModel.wasRemoved(false);

    // Params
    var params = options && options.route && options.route.segments || [];

    var kind = params[0] || '',
        isService = kind === Address.kind.service,
        jobTitleID = isService ? params[1] |0 : 0,
        addressID = isService ? params[2] |0 : params[1] |0,
        // Only used on service address creation, instead an ID we get
        // a string for 'serviceArea' or 'serviceLocation')
        serviceType = params[2] || '';
    // Special type: clientLocation
    var clientUserID = serviceType === 'clientLocation' ? params[3] : null;

    this.viewModel.jobTitleID(jobTitleID);
    this.viewModel.addressID(addressID);
    this.viewModel.clientUserID(clientUserID);

    this.updateNavBarState();

    if (addressID) {
        // Get the address
        serviceAddresses.getItemVersion(jobTitleID, addressID)
        .then(function (addressVersion) {
            if (addressVersion) {
                this.viewModel.addressVersion(addressVersion);

                var address = addressVersion.original;
                var title = (address.isServiceLocation() && address.kind() == Address.kind.service) ? 'Edit this place of work' : 'Edit this service area';
                var formInstructions = (address.isServiceLocation() && address.kind() == Address.kind.service) ? 'This is an address of a location where clients come to receive your ' : "This is an area where you are willing to go to a client's home or business to perform your ";

                this.title(title);
                this.viewModel.formInstructions(formInstructions);
            }
            else {
                this.viewModel.addressVersion(null);
                this.title('Unknown or deleted location');
                this.viewModel.formInstructions('');
            }

            this.viewModel.postalCodeVM.onFormLoaded();
        }.bind(this))
        .catch(function (err) {
            showError({
                title: 'There was an error while loading.',
                error: err
            });
        });
    }
    else {
        // New address
        this.viewModel.addressVersion(serviceAddresses.newItemVersion({
            jobTitleID: jobTitleID
        }));

        this.viewModel.formInstructions('');
        this.viewModel.postalCodeVM.onFormLoaded();

        switch (serviceType) {
            case 'serviceArea':
                this.viewModel.address().isServiceArea(true);
                this.viewModel.address().isServiceLocation(false);
                this.title('Add an area where you work');
                this.viewModel.titleIcon('ion-pinpoint');
                this.viewModel.formInstructions("Enter a zip code and a distance from that zip code to create an area where you are willing to go to a client's home or business to perform your ");
                break;
            case 'serviceLocation':
                this.viewModel.address().isServiceArea(false);
                this.viewModel.address().isServiceLocation(true);
                this.title('Add a place where you work');
                this.viewModel.titleIcon('ion-ios-location-outline');
                this.viewModel.formInstructions('Enter the address of the location where clients come to receive your ');
                break;
            case 'clientLocation':
                // A service professional is adding a location to perform a service that belongs
                // to the client of the booking, on behalf of.
                this.viewModel.address().userID(clientUserID);
                this.viewModel.address().isServiceArea(false);
                this.viewModel.address().isServiceLocation(true);
                this.title('Add a client location');
                this.viewModel.titleIcon('ion-ios-location-outline');
                this.viewModel.formInstructions("Enter your client's address where you'll perform your ");
                break;
            default:
                this.viewModel.address().isServiceArea(true);
                this.viewModel.address().isServiceLocation(true);
                this.title('Add a location for your ');
                this.viewModel.titleIcon('ion-ios-location-outline');
                break;
        }
    }
};

function ViewModel(app) {
    this.helpLink = '/help/relatedArticles/201965996-setting-your-service-locations-areas';

    this.isInOnboarding = onboarding.inProgress;

    this.titleIcon = ko.observable('ion-ios-location-outline');
    this.formInstructions = ko.observable('');
    // List of possible error messages registered
    // by name
    this.errorMessages = {
        postalCode: ko.observable('')
    };

    this.jobTitleID = ko.observable(0);
    this.addressID = ko.observable(0);
    this.clientUserID = ko.observable(0);
    this.jobTitleName = ko.observable('Job Title');

    this.addressVersion = ko.observable(null);
    this.address = ko.pureComputed(function() {
        var v = this.addressVersion();
        if (v) {
            return v.version;
        }
        return null;
    }, this);

    // On change to a valid code, do remote look-up
    this.postalCodeVM = new PostalCodeVM({
        address: this.address,
        postalCodeError: this.errorMessages.postalCode
    });

    this.isLoading = serviceAddresses.state.isLoading;
    this.isSaving = serviceAddresses.state.isSaving;
    this.isDeleting = serviceAddresses.state.isDeleting;

    this.wasRemoved = ko.observable(false);

    this.isLocked = ko.computed(function() {
        return this.isDeleting() || serviceAddresses.state.isLocked();
    }, this);

    this.isNew = ko.pureComputed(function() {
        var add = this.address();
        return !add || !add.updatedDate();
    }, this);

    this.submitText = ko.pureComputed(function() {
        var v = this.addressVersion();
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
        var v = this.addressVersion();
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
        if (this.clientUserID()) {
            // We want to return the in-memory data for the address rather
            // than save it.
            // NOTE: This feature 'clientLocation' is used by the serviceProfessional booking
            // process to use a 'new client location' as address rather than a new serviceProfessiona address
            // Just call the onSave, it knows what to do
            this.onSave();
        }
        else {
            // Normal use: save the user (serviceProfessional) address and provide the generated
            // addressID to the onSave method.
            serviceAddresses.setItem(this.address().model.toPlainObject())
            .then(function(serverData) {
                // Update version with server data.
                this.address().model.updateWith(serverData);
                // Push version so it appears as saved
                this.addressVersion().push({ evenIfObsolete: true });

                // Special save, function provided by the activity on set-up
                this.onSave(serverData.addressID);
            }.bind(this))
            .catch(function(err) {
                showError({
                    title: 'There was an error while saving.',
                    error: err
                });
            });
        }

    }.bind(this);

    this.confirmRemoval = function() {
        showConfirm({
            title: 'Delete location',
            message: 'Are you sure? This cannot be undone.',
            yes: 'Delete',
            no: 'Keep'
        })
        .then(function() {
            this.remove();
        }.bind(this));
    }.bind(this);

    this.remove = function() {

        serviceAddresses.delItem(this.jobTitleID(), this.addressID())
        .then(function() {
            this.wasRemoved(true);
            // Go out the deleted location
            app.shell.goBack();
        }.bind(this))
        .catch(function(err) {
            showError({
                title: 'There was an error while deleting.',
                error: err
            });
        });
    }.bind(this);

    /**
        Typed value binding rather than html binding allow to avoid
        problems because the data in html are string values while
        the actual data from the model is a number.
        Cause problems on some edge cases matching values and with
        detection of changes in the data (because the binding coming from the
        control assigning a string to the value).
    **/
    this.serviceRadiusOptions = ko.observableArray([
        { value: 0.5, label: '0.5 miles' },
        { value: 1.0, label: '1 mile' },
        { value: 2.0, label: '2 miles' },
        { value: 3.0, label: '3 miles' },
        { value: 4.0, label: '4 miles' },
        { value: 5.0, label: '5 miles' },
        { value: 10, label: '10 miles' },
        { value: 25, label: '25 miles' },
        { value: 50, label: '50 miles' },
        { value: 5000, label: 'I work remotely' },
    ]);
}
