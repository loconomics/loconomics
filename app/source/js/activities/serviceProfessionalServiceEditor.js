/**
    ServiceProfessionalServiceEditor activity
    
    TODO: ModelVersion is NOT being used, so no getting updates if server updates
    the data after load (data load is requested but get first from cache). Use
    version and get sync'ed data when ready, and additionally notification to
    override changes if server data is different that any local change.
**/
'use strict';
var ko = require('knockout'),
    Activity = require('../components/Activity'),
    PricingType = require('../models/PricingType');

var A = Activity.extends(function ServiceProfessionalServiceEditorActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.serviceProfessional;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('Services');
    
    /// Go out after save succesfully an item.
    /// Pricing is a plain object
    this.viewModel.onSave = function(pricing) {
        // Go back on save.
        // If we comes with a selection of pricing, we must add the new one
        // there and just go back (serviceProfessionalService is in selection mode) keeping
        // any requestData for in-progress state.
        if (this.requestData.selectedPricing) {
            // Is an array of plain objects of just ID and totalPrice
            this.requestData.selectedPricing.push({
                serviceProfessionalServiceID: pricing.serviceProfessionalServiceID,
                totalPrice: pricing.totalPrice
            });
            this.app.shell.goBack(this.requestData);
        }
        else {
            // Just execute the standard save process
            this.app.successSave();
        }
    }.bind(this);
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {

    var link = this.requestData.cancelLink || '/serviceProfessionalService/' + this.viewModel.jobTitleID();
    
    this.convertToCancelAction(this.navBar.leftAction(), link);
};

A.prototype.show = function show(options) {
    //jshint maxcomplexity:10    
    Activity.prototype.show.call(this, options);

    // Reset
    this.viewModel.wasRemoved(false);
    this.viewModel.serviceProfessionalServiceVersion(null);
    this.viewModel.pricingType(null);

    // Params
    var params = options && options.route && options.route.segments || [];

    var jobTitleID = params[0] |0,
        // Parameter [1] can be 'new' followed by a pricingTypeID as [2]
        pricingTypeID = params[1] === 'new' ? params[2] |0 : 0,
        // Or a pricingID
        serviceProfessionalServiceID = params[1] |0;

    this.viewModel.jobTitleID(jobTitleID);
    this.viewModel.serviceProfessionalServiceID(serviceProfessionalServiceID);
    
    this.updateNavBarState();
    
    /**
        The pricing record needs some special set-up after creation/loading and before
        being presented to the user, because special value-rules.
    **/
    var pricingSetup = function pricingSetup() {
        // Pricing fields that has a special initial value
        var c = this.viewModel.current();
        if (c) {
            // Name: must be the PricingType.fixedName ever if any, or
            //   the name saved in the pricing or
            //   the suggestedName as last fallback
            c.pricing.name(c.type.fixedName() || c.pricing.name() || c.type.suggestedName());
            // Required call after loading a pricing to reflect data correctly (cannot be automated)
            c.pricing.refreshNoPriceRate();
        }
        this.viewModel.isLoading(false);
    }.bind(this);
    
    var showInvalidRequestError = function() {
        this.viewModel.isLoading(false);
        this.app.modals.showError({
            title: 'Invalid request',
            error: { jobTitleID: jobTitleID, pricingTypeID: pricingTypeID, serviceProfessionalServiceID: serviceProfessionalServiceID }
        })
        .then(function() {
            // On close modal, go back
            this.app.shell.goBack();
        }.bind(this));
    }.bind(this);

    this.viewModel.isLoading(true);
    if (pricingTypeID) {
        // Load the pricing Type
        this.app.model.pricingTypes.getItem(pricingTypeID)
        .then(function(type) {
            if (type) {
                this.viewModel.pricingType(type);
                // New pricing
                this.viewModel.serviceProfessionalServiceVersion(this.app.model.serviceProfessionalService.newItemVersion({
                    jobTitleID: jobTitleID,
                    pricingTypeID: pricingTypeID
                }));
                pricingSetup();
            }
            else {
                showInvalidRequestError();
            }
        }.bind(this));
    }
    else if (serviceProfessionalServiceID) {
        // Get the pricing
        this.app.model.serviceProfessionalService.getItemVersion(jobTitleID, serviceProfessionalServiceID)
        .then(function (serviceProfessionalServiceVersion) {
            if (serviceProfessionalServiceVersion) {
                // Load the pricing type before put the version
                // returns to let the 'catch' to get any error
                return this.app.model.pricingTypes.getItem(serviceProfessionalServiceVersion.version.pricingTypeID())
                .then(function(type) {
                    if (type) {
                        this.viewModel.pricingType(type);
                        this.viewModel.serviceProfessionalServiceVersion(serviceProfessionalServiceVersion);
                        pricingSetup();
                    }
                    else {
                        showInvalidRequestError();
                    }
                }.bind(this));
            } else {
                showInvalidRequestError();
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
        }.bind(this));
    }
    else {
        showInvalidRequestError();
    }
};

function ViewModel(app) {
    /*jshint maxstatements: 35*/

    this.isLoading = ko.observable(false);
    // managed manually instead of
    //app.model.serviceProfessionalService.state.isLoading;
    this.isSaving = app.model.serviceProfessionalServices.state.isSaving;
    this.isSyncing = app.model.serviceProfessionalServices.state.isSyncing;
    this.isDeleting = app.model.serviceProfessionalServices.state.isDeleting;
    this.jobTitleID = ko.observable(0);
    this.serviceProfessionalServiceID = ko.observable(0);
    // L10N
    this.moneySymbol = ko.observable('$');
    
    this.pricingType = ko.observable(new PricingType());

    this.serviceProfessionalServiceVersion = ko.observable(null);
    this.serviceProfessionalService = ko.pureComputed(function() {
        var v = this.serviceProfessionalServiceVersion();
        if (v) {
            return v.version;
        }
        return null;
    }, this);

    this.header = ko.pureComputed(function() {
        if (this.isLoading()) {
            return 'Loading...';
        }
        else if (this.serviceProfessionalServiceVersion()) {
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
            p = this.serviceProfessionalService();
        
        if (t && p) {
            return {
                type: t,
                pricing: p
            };
        }
        return null;
    }, this);

    this.wasRemoved = ko.observable(false);
    
    this.isLocked = ko.computed(function() {
        return this.isDeleting() || app.model.serviceProfessionalServices.state.isLocked();
    }, this);
    
    this.isNew = ko.pureComputed(function() {
        var p = this.serviceProfessionalService();
        return p && !p.updatedDate();
    }, this);

    this.submitText = ko.pureComputed(function() {
        var v = this.serviceProfessionalServiceVersion();
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
        var v = this.serviceProfessionalServiceVersion();
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
        
        app.model.serviceProfessionalService.setItem(this.serviceProfessionalService().model.toPlainObject())
        .then(function(serverData) {
            // Update version with server data.
            this.serviceProfessionalService().model.updateWith(serverData);
            // Push version so it appears as saved
            this.serviceProfessionalServiceVersion().push({ evenIfObsolete: true });
            
            // After save logic provided by the activity, injected in the view:
            this.onSave(serverData);
        }.bind(this))
        .catch(function(err) {
            app.modals.showError({
                title: 'There was an error while saving.',
                error: err
            });
        });

    }.bind(this);
    
    this.confirmRemoval = function() {
        // TODO Better l10n or replace by a new preset field on pricingType.deleteLabel
        var p = this.pricingType();
        app.modals.confirm({
            title: 'Delete ' + (p && p.singularName()),
            message: 'Are you sure? The operation cannot be undone.',
            yes: 'Delete',
            no: 'Keep'
        })
        .then(function() {
            this.remove();
        }.bind(this));
    }.bind(this);

    this.remove = function() {

        app.model.serviceProfessionalService.delItem(this.jobTitleID(), this.serviceProfessionalServiceID())
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
