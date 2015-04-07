/**
    FreelancerPricingEditor activity
    
    TODO: ModelVersion is NOT being used, so no getting updates if server updates
    the data after load (data load is requested but get first from cache). Use
    version and get sync'ed data when ready, and additionally notification to
    override changes if server data is different that any local change.
**/
'use strict';
var ko = require('knockout'),
    Activity = require('../components/Activity'),
    PricingType = require('../models/PricingType');

var A = Activity.extends(function FreelancerPricingEditorActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.Freelancer;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('Services');
});

exports.init = A.init;

A.prototype.show = function show(options) {
    //jshint maxcomplexity:10    
    Activity.prototype.show.call(this, options);

    // Reset
    this.viewModel.wasRemoved(false);
    this.viewModel.freelancerPricingVersion(null);

    // Params
    var params = options && options.route && options.route.segments || [];

    var jobTitleID = params[0] |0,
        freelancerPricingID = params[1] |0;

    this.viewModel.jobTitleID(jobTitleID);
    this.viewModel.freelancerPricingID(freelancerPricingID);

    if (freelancerPricingID) {
        // Get the pricing
        this.app.model.freelancerPricing.getItemVersion(jobTitleID, freelancerPricingID)
        .then(function (freelancerPricingVersion) {
            if (freelancerPricingVersion) {
                // Load the pricing type before put the version
                // returns to let the 'catch' to get any error
                return this.app.model.pricingTypes.getItem(freelancerPricingVersion.version.pricingTypeID())
                .then(function(type) {
                    this.viewModel.pricingType(type);
                    this.viewModel.freelancerPricingVersion(freelancerPricingVersion);
                }.bind(this));
            } else {
                this.viewModel.freelancerPricingVersion(null);
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
        // New pricing
        this.viewModel.freelancerPricingVersion(this.app.model.freelancerPricing.newItemVersion({
            jobTitleID: jobTitleID
        }));
    }
};

function ViewModel(app) {

    this.jobTitleID = ko.observable(0);
    this.freelancerPricingID = ko.observable(0);
    
    this.pricingType = ko.observable(new PricingType());

    this.freelancerPricingVersion = ko.observable(null);
    this.freelancerPricing = ko.pureComputed(function() {
        var v = this.freelancerPricingVersion();
        if (v) {
            return v.version;
        }
        return null;
    }, this);

    this.header = ko.pureComputed(function() {
        
        if (this.freelancerPricingVersion()) {
            var t = this.pricingType();
            return t && t.singularName() || 'Service';
        }
        else {
            return 'Unknow service or was deleted';
        }

    }, this);
    
    // Quicker access in form, under a 'with'
    this.current = ko.pureComputed(function() {
        var t = this.pricingType(),
            p = this.freelancerPricing();
        
        if (t && p) {
            return {
                type: t,
                pricing: p
            };
        }
        return null;
    }, this);
    
    this.isLoading = app.model.freelancerPricing.state.isLoading;
    this.isSaving = app.model.freelancerPricing.state.isSaving;
    this.isDeleting = app.model.freelancerPricing.state.isDeleting;

    this.wasRemoved = ko.observable(false);
    
    this.isLocked = ko.computed(function() {
        return this.isDeleting() || app.model.freelancerPricing.state.isLocked();
    }, this);
    
    this.isNew = ko.pureComputed(function() {
        var p = this.freelancerPricing();
        return p && !p.updatedDate();
    }, this);

    this.submitText = ko.pureComputed(function() {
        var v = this.freelancerPricingVersion();
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
        var v = this.freelancerPricingVersion();
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

        app.model.freelancerPricing.setItem(this.freelancerPricing().model.toPlainObject())
        .then(function(serverData) {
            // Update version with server data.
            this.freelancerPricing().model.updateWith(serverData);
            // Push version so it appears as saved
            this.freelancerPricingVersion().push({ evenIfObsolete: true });
        }.bind(this))
        .catch(function(err) {
            app.modals.showError({
                title: 'There was an error while saving.',
                error: err
            });
        });

    }.bind(this);
    
    this.confirmRemoval = function() {
        // TODO Type
        app.modals.confirm({
            title: 'Delete service',
            message: 'Are you sure? The operation cannot be undone.',
            yes: 'Delete',
            no: 'Keep'
        })
        .then(function() {
            this.remove();
        }.bind(this));
    }.bind(this);

    this.remove = function() {

        app.model.freelancerPricing.delItem(this.jobTitleID(), this.freelancerPricingID())
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
}
