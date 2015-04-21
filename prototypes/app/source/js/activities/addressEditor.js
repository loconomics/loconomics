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
var ko = require('knockout'),
    Address = require('../models/Address'),
    Activity = require('../components/Activity');

var A = Activity.extends(function AddressEditorActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.Freelancer;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('Locations');
});

exports.init = A.init;

A.prototype.show = function show(options) {
    //jshint maxcomplexity:10    
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
    
    this.viewModel.jobTitleID(jobTitleID);
    this.viewModel.addressID(addressID);

    if (addressID) {
        // Get the address
        this.app.model.serviceAddresses.getItemVersion(jobTitleID, addressID)
        .then(function (addressVersion) {
            if (addressVersion) {
                this.viewModel.addressVersion(addressVersion);
                this.viewModel.header('Edit Location');
            } else {
                this.viewModel.addressVersion(null);
                this.viewModel.header('Unknow location or was deleted');
            }
        }.bind(this))
        .catch(function (err) {
            this.app.modals.showError({
                title: 'There was an error while loading.',
                error: err
            });
        }.bind(this));
    }
    else {
        // New address
        this.viewModel.addressVersion(this.app.model.serviceAddresses.newItemVersion({
            jobTitleID: jobTitleID
        }));

        switch (serviceType) {
            case 'serviceArea':
                this.viewModel.address().isServiceArea(true);
                this.viewModel.address().isServiceLocation(false);
                this.viewModel.header('Add a service area');
                break;
            case 'serviceLocation':
                this.viewModel.address().isServiceArea(false);
                this.viewModel.address().isServiceLocation(true);
                this.viewModel.header('Add a service location');
                break;
            default:
                this.viewModel.address().isServiceArea(true);
                this.viewModel.address().isServiceLocation(true);
                this.viewModel.header('Add a location');
                break;
        }
    }
};

function ViewModel(app) {

    this.header = ko.observable('Edit Location');
    
    this.jobTitleID = ko.observable(0);
    this.addressID = ko.observable(0);
    
    this.addressVersion = ko.observable(null);
    this.address = ko.pureComputed(function() {
        var v = this.addressVersion();
        if (v) {
            return v.version;
        }
        return null;
    }, this);
    this.isLoading = app.model.serviceAddresses.state.isLoading;
    this.isSaving = app.model.serviceAddresses.state.isSaving;
    this.isDeleting = app.model.serviceAddresses.state.isDeleting;

    this.wasRemoved = ko.observable(false);
    
    this.isLocked = ko.computed(function() {
        return this.isDeleting() || app.model.serviceAddresses.state.isLocked();
    }, this);
    
    this.isNew = ko.pureComputed(function() {
        return !this.address().updatedDate();
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

        app.model.serviceAddresses.setItem(this.address().model.toPlainObject())
        .then(function(serverData) {
            // Update version with server data.
            this.address().model.updateWith(serverData);
            // Push version so it appears as saved
            this.addressVersion().push({ evenIfObsolete: true });
            
            // On save, auto go back
            // NOTE: if auto go back is disabled, the URL must update to match the new ID
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
        app.modals.confirm({
            title: 'Delete location',
            message: 'Are you sure? The operation cannot be undone.',
            yes: 'Delete',
            no: 'Keep'
        })
        .then(function() {
            this.remove();
        }.bind(this));
    }.bind(this);

    this.remove = function() {

        app.model.serviceAddresses.delItem(this.jobTitleID(), this.addressID())
        .then(function() {
            this.wasRemoved(true);
            // Go out the deleted location
            app.shell.goBack();
        }.bind(this))
        .catch(function(err) {
            app.modals.showError({
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
    ]);
}
