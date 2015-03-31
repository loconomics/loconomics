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
    
    var params = options && options.route && options.route.segments || [];

    var kind = params[0] || '',
        isService = kind === Address.kind.service,
        jobTitleID = isService ? params[1] |0 : 0,
        addressID = isService ? params[2] |0 : params[1] |0,
        // Only used on service address creation, instead an ID we get
        // a string for 'serviceArea' or 'serviceLocation')
        serviceType = params[2] || '';

    if (addressID) {
        // Get the address
        this.app.model.serviceAddresses.getItem(jobTitleID, addressID)
        .then(function (address) {
            if (address) {
                this.viewModel.address(new Address(address));
                this.viewModel.header('Edit Location');
            } else {
                this.viewModel.address(null);
                this.viewModel.header('Unknow location or was deleted');
            }
        }.bind(this))
        .catch(function (err) {
            this.app.modals.showError({
                title: 'There was an error while loading.',
                error: err && err.error || err
            });
        }.bind(this));
    }
    else {
        // New address
        this.viewModel.address(new Address());

        switch (serviceType) {
            case 'serviceRadius':
                this.viewModel.address().isServiceRadius(true);
                this.viewModel.header('Add a service radius');
                break;
            case 'serviceLocation':
                this.viewModel.address().isServiceLocation(true);
                this.viewModel.header('Add a service location');
                break;
            default:
                this.viewModel.addres().isServiceRadius(false);
                this.viewModel.addres().isServiceLocation(false);
                this.viewModel.header('Add a location');
                break;
        }
    }
};

function ViewModel(app) {

    this.header = ko.observable('Edit Location');
    
    this.address = ko.observable(new Address());
    this.isLoading = app.model.serviceAddresses.state.isLoading;
    this.isSaving = app.model.serviceAddresses.state.isSaving;
    
    this.isLocked = app.model.serviceAddresses.state.isLocked;

    this.submitText = ko.pureComputed(function() {
        return (
            this.isLoading() ? 
                'loading...' : 
                this.isSaving() ? 
                    'saving...' : 
                    'Save'
        );
    }, this);

    this.save = function() {

        app.model.serviceAddresses.setItem(this.address().model.toPlainObject())
        .then(function(serverData) {
            this.address().model.updateWith(serverData);
        }.bind(this))
        .catch(function(err) {
            app.modals.showError({
                title: 'There was an error while saving.',
                error: err && err.error || err
            });
        });

    }.bind(this);
}