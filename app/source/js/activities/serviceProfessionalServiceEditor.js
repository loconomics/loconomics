/**
    ServiceProfessionalServiceEditor activity

    TODO: ModelVersion is NOT being used, so no getting updates if server updates
    the data after load (data load is requested but get first from cache). Use
    version and get sync'ed data when ready, and additionally notification to
    override changes if server data is different that any local change.
**/
'use strict';
var ko = require('knockout');
var Activity = require('../components/Activity');
var PricingType = require('../models/PricingType');
var RouteMatcher = require('../utils/Router').RouteMatcher;
var Route = require('../utils/Router').Route;

var onboarding = require('../data/onboarding');
var clients = require('../data/clients');
var pricingTypes = require('../data/pricingTypes');
var serviceProfessionalServices = require('../data/serviceProfessionalServices');
var showConfirm = require('../modals/confirm').show;
var showError = require('../modals/error').show;

var A = Activity.extend(function ServiceProfessionalServiceEditorActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.serviceProfessional;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('Services', {
        helpLink: this.viewModel.helpLink
    });
    this.title = ko.pureComputed(function() {
        var pricingName = (this.pricingType() && this.pricingType().singularName()) || 'Service';
        var prefix = this.isNew() ? 'New ' : '';
        var postfix = this.client() ? (' only for ' + this.client().firstName()) : '';

        if (this.isLoading()) {
            return 'Loading...';
        }
        else if (this.serviceProfessionalServiceVersion()) {
            return prefix + pricingName + postfix;
        }
        else {
            return 'Unable to load service';
        }

    }, this.viewModel);
    /// Go out after save succesfully an item.
    /// Pricing is a plain object
    this.viewModel.onSave = function(pricing) {
        // Go back on save.
        // If we comes with a selection of pricing, we must add the new one
        // there and just go back (serviceProfessionalService is in selection mode) keeping
        // any requestData for in-progress state.
        if (this.requestData.selectedServices) {
            // Is an array of plain objects of just ID and totalPrice
            this.requestData.selectedServices.push({
                serviceProfessionalServiceID: pricing.serviceProfessionalServiceID,
                totalPrice: pricing.totalPrice
            });

            this.app.shell.goBack(this.requestData);
        }
        else if (onboarding.inProgress()) {
            this.app.shell.goBack();
        }
        else {
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
    Activity.prototype.show.call(this, options);

    // Reset
    this.viewModel.wasRemoved(false);
    this.viewModel.serviceProfessionalServiceVersion(null);
    this.viewModel.pricingType(null);

    // Params
    var paramsDefaults = { jobTitleID: 0, serviceID: 0, pricingTypeID: 0, clientID: 0 };
    var matcher = new RouteMatcher([
            new Route('/:jobTitleID/pricingType/:pricingTypeID/client/:clientID/new'),
            new Route('/:jobTitleID/pricingType/:pricingTypeID/new'),
            new Route('/:jobTitleID/:serviceID')
        ], paramsDefaults);

    var params = matcher.match(options.route.path) || {};

    var jobTitleID = params.jobTitleID | 0;
    var pricingTypeID = params.pricingTypeID | 0;
    var serviceProfessionalServiceID = params.serviceID | 0;
    var clientID = params.clientID | 0;

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
    }.bind(this);

    var showLoadingError = function(error) {
        this.viewModel.isLoading(false);
        showError({
            title: 'Unable to load service',
            error: error
        })
        .then(function() {
            // On close modal, go back
            this.app.shell.goBack();
        }.bind(this));
    }.bind(this);

    this.viewModel.isLoading(true);

    var loadClient = function(service) {
        var clientID = service.clientID();

        if(clientID) {
            return clients.getItem(clientID)
            .then(function(client) {
                this.viewModel.client(client);
            }.bind(this));
        }
        else {
            this.viewModel.client(null);
            return Promise.resolve(service);
        }
    }.bind(this);

    if (pricingTypeID) {
        // Load the pricing Type
        pricingTypes.getItem(pricingTypeID)
        .then(function(type) {
            this.viewModel.pricingType(type);
            // New pricing
            var serviceVersion = serviceProfessionalServices.newItemVersion({
                jobTitleID: jobTitleID,
                pricingTypeID: pricingTypeID,
                visibleToClientID: clientID
            });
            this.viewModel.serviceProfessionalServiceVersion(serviceVersion);
            pricingSetup();
            return serviceVersion.version;
        }.bind(this))
        .then(loadClient)
        .catch(showLoadingError)
        .then(function() {
            this.viewModel.isLoading(false);
        }.bind(this));
    }
    else if (serviceProfessionalServiceID) {
        // Get the pricing
        serviceProfessionalServices.getItemVersion(jobTitleID, serviceProfessionalServiceID)
        .then(function (serviceProfessionalServiceVersion) {
            if (!serviceProfessionalServiceVersion) {
                throw new Error('Unable to load service');
            }
            // Load the pricing type before put the version
            // returns to let the 'catch' to get any error
            return pricingTypes.getItem(serviceProfessionalServiceVersion.version.pricingTypeID())
            .then(function(type) {
                this.viewModel.pricingType(type);
                this.viewModel.serviceProfessionalServiceVersion(serviceProfessionalServiceVersion);
                pricingSetup();

                return serviceProfessionalServiceVersion.version;
            }.bind(this));
        }.bind(this))
        .then(loadClient)
        .catch(showLoadingError)
        .then(function() {
            this.viewModel.isLoading(false);
        }.bind(this));
    }
    else {
        showLoadingError('Unable to load service — missing parameters');
    }
};

function ViewModel(app) {
    this.helpLink = '/help/relatedArticles/201967166-listing-and-pricing-your-services';

    this.isInOnboarding = onboarding.inProgress;

    this.isLoading = ko.observable(false);
    // managed manually instead of
    //serviceProfessionalServices.state.isLoading;
    this.isSaving = serviceProfessionalServices.state.isSaving;
    this.isSyncing = serviceProfessionalServices.state.isSyncing;
    this.isDeleting = serviceProfessionalServices.state.isDeleting;
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

    this.client = ko.observable(null);

    // Quicker access in form, under a 'with'
    this.current = ko.pureComputed(function() {
        var t = this.pricingType();
        var p = this.serviceProfessionalService();

        if (t && p) {
            return {
                type: t,
                pricing: p
            };
        }
        return null;
    }, this);

    this.showFirstTimeClientsOnlyLabel = ko.pureComputed(function() {
        var pricingLabel = this.pricingType() && this.pricingType().firstTimeClientsOnlyLabel();

        return pricingLabel && !this.client();
    }, this);

    this.wasRemoved = ko.observable(false);

    this.isLocked = ko.computed(function() {
        return this.isDeleting() || serviceProfessionalServices.state.isLocked();
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

        serviceProfessionalServices.setItem(this.serviceProfessionalService().model.toPlainObject())
        .then(function(serverData) {
            // Update version with server data.
            this.serviceProfessionalService().model.updateWith(serverData);
            // Push version so it appears as saved
            this.serviceProfessionalServiceVersion().push({ evenIfObsolete: true });

            // After save logic provided by the activity, injected in the view:
            this.onSave(serverData);
        }.bind(this))
        .catch(function(err) {
            showError({
                title: 'Unable to save the service.',
                error: err
            });
        });

    }.bind(this);

    this.confirmRemoval = function() {
        // TODO Better l10n or replace by a new preset field on pricingType.deleteLabel
        var p = this.pricingType();
        showConfirm({
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

        serviceProfessionalServices.delItem(this.jobTitleID(), this.serviceProfessionalServiceID())
        .then(function() {
            this.wasRemoved(true);
            // Go out the deleted location
            app.shell.goBack();
        }.bind(this))
        .catch(function(err) {
            showError({
                title: 'Unable to delete the service.',
                error: err
            });
        });
    }.bind(this);
}
