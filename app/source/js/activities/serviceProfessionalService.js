/**
    ServiceProfessional Service activity
**/
'use strict';

var ko = require('knockout'),
    Activity = require('../components/Activity'),
    ServiceProfessionalServiceViewModel = require('../viewmodels/ServiceProfessionalService'),
    $ = require('jquery'),
    RouteMatcher = require('../utils/Router').RouteMatcher,
    Route = require('../utils/Router').Route;

var A = Activity.extend(function ServiceProfessionalServiceActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.serviceProfessional;
    this.viewModel = new ViewModel(this.app);
    // Defaults settings for navBar.
    this.navBar = Activity.createSubsectionNavBar('Job Title', {
        backLink: '/scheduling', helpLink: this.viewModel.helpLink
    });
    // Save defaults to restore on updateNavBarState when needed:
    this.defaultLeftAction = this.navBar.leftAction().model.toPlainObject(true);
    // Make navBar available at viewModel, needed for dekstop navigation
    this.viewModel.navBar = this.navBar;
    
    // On changing jobTitleID:
    this.registerHandler({
        target: this.viewModel.jobTitle,
        handler: function(/*jobTitle*/) {
            // Update navbar (may indicate the jobTitle name)
            this.updateNavBarState();

            // May depend on current URL, will change with job title
            this.viewModel.serviceEditorCancelLink(this.serviceEditorCancelLink(this.viewModel.isAdditionMode()));
        }.bind(this)
    });

    // On changing jobTitleID:
    this.registerHandler({
        target: this.viewModel.jobTitleID,
        handler: function(jobTitleID) {

            if (jobTitleID) {

                var params = this.parseRoute(this.requestData.route.path),
                    urlJobTitleID = +params.jobTitleID,
                    clientID = +params.clientID;

                if (urlJobTitleID !== jobTitleID) {
                    var url = this.buildRoute(jobTitleID, clientID, params.isNew);

                    this.app.shell.replaceState(this.requestData, null, url);
                }
            }
        }.bind(this)
    });

    this.registerHandler({
        target: this.viewModel.clientID,
        handler: function(clientID) {
            var viewModel = this.viewModel,
                app = this.app;

            viewModel.client(null);

            if(clientID) {
                app.model.clients.getItem(clientID)
                .then(function(client) {
                    viewModel.client(client);
                })
                .catch(function(error) {
                    app.modals.showError({ title: 'Unable to load client.', error: error });
                });
            }
        }.bind(this)
    });

    // Go back with the selected pricing when triggered in the form/view
    this.viewModel.returnSelected = function(pricing, jobTitleID) {
        // Pass the selected client in the info
        this.requestData.selectedServices = pricing;
        this.requestData.selectedJobTitleID = jobTitleID;
        // And go back
        this.app.shell.goBack(this.requestData);
    }.bind(this);
    
    this.returnRequest = function returnRequest() {
        this.app.shell.goBack(this.requestData);
    }.bind(this);
});

exports.init = A.init;

A.prototype.applyOwnNavbarRules = function() {
    //jshint maxcomplexity:10

    var itIs = this.viewModel.isSelectionMode();

    if (this.requestData.title) {
        // Replace title by title if required
        this.navBar.title(this.requestData.title);
    }
    else {
        // Title must be empty
        this.navBar.title('');
    }

    if (this.requestData.cancelLink) {
        this.convertToCancelAction(this.navBar.leftAction(), this.requestData.cancelLink, this.requestData);
    }
    else {
        // Reset to defaults, or given title:
        this.navBar.leftAction().model.updateWith(this.defaultLeftAction, true);

        var jid = this.viewModel.jobTitleID(),
            jname = this.viewModel.jobTitle() && this.viewModel.jobTitle().singularName() || 'Scheduler',
            url = this.mustReturnTo || (jid && '/jobtitles/' + jid || '/scheduling');

        this.navBar.leftAction().link(url);
        this.navBar.leftAction().text(this.requestData.navTitle || jname);
    }

    if (itIs && !this.requestData.cancelLink) {
        // Uses a custom handler so it returns keeping the given state:
        this.navBar.leftAction().handler(this.returnRequest);
    }
    else if (!this.requestData.cancelLink) {
        this.navBar.leftAction().handler(null);
    }
};

A.prototype.updateNavBarState = function updateNavBarState() {
    // Perform updates that apply this request:
    this.app.model.onboarding.updateNavBar(this.navBar) ||
    //this.app.applyNavbarMustReturn(this.requestData) ||
    this.applyOwnNavbarRules();
};

A.prototype.referrerURL = function() {
    return (this.app.shell.referrerRoute && this.app.shell.referrerRoute.url) || '/';
};

A.prototype.serviceEditorCancelLink = function(isAdditionMode) {
    if (isAdditionMode) {
        // Sets referrer as cancel link
        return this.referrerURL();
    }
    else {
        return '/serviceProfessionalService' + this.requestData.route.path;
    }
};

A.prototype.buildRoute = function(jobTitleID, clientID, isAdditionMode) {
    var base = '/serviceProfessionalService',
        jobTitle = '/' + jobTitleID,
        client = clientID > 0 ? ('/client/' + clientID) : '',
        newParam = isAdditionMode ? '/new' : '';

    return base + jobTitle + client + newParam;
};

A.prototype.parseRoute = function(url) {
    var paramsDefaults = { jobTitleID: 0, isNew: false, clientID: null },
        matcher = new RouteMatcher([
            new Route('/:jobTitleID/new', { isNew: true }),
            new Route('/:jobTitleID/client/:clientID/new', { isNew: true }),
            new Route('/:jobTitleID/client/:clientID'),
            new Route('/new', { isNew: true }),
            new Route('/:jobTitleID')
        ], paramsDefaults);

    return matcher.match(url) || paramsDefaults;
};

A.prototype.show = function show(options) {
    //jshint maxcomplexity:8
    Activity.prototype.show.call(this, options);

    // Remember route to go back, from a request of 'mustReturn' or last requested
    this.mustReturnTo = this.requestData.route.query.mustReturn || this.mustReturnTo;
        
    // Reset: avoiding errors because persisted data for different ID on loading
    // or outdated info forcing update
    this.viewModel.reset();
    this.viewModel.requestData(this.requestData);
    this.viewModel.preSelectedServices(this.requestData.selectedServices || []);

    this.viewModel.isSelectionMode(this.requestData.selectPricing === true);

    var params = this.parseRoute(options.route.path);

    var jobTitleID = +params.jobTitleID;
    if (jobTitleID === 0 && options.selectedJobTitleID > 0)
        jobTitleID = options.selectedJobTitleID |0;

    this.viewModel.clientID(+params.clientID);

    var isAdditionMode = params.isNew;

    this.viewModel.serviceEditorCancelLink(this.serviceEditorCancelLink(isAdditionMode));

    if (isAdditionMode) {
        this.requestData.cancelLink = this.referrerURL();
    }

    this.viewModel.isAdditionMode(isAdditionMode);

    this.updateNavBarState();

    this.viewModel.jobTitleID(jobTitleID);

    if (jobTitleID === 0) {
        this.viewModel.clearData();
        this.viewModel.jobTitles.sync();
    }
    else {
        this.viewModel.loadServicesData();
    }
};

var UserJobProfile = require('../viewmodels/UserJobProfile');

function ViewModel(app) {
    // ViewModel has all of the properties of a ServiceProfessionalServiceViewModel
    ServiceProfessionalServiceViewModel.call(this, app);

    // Always load empty pricing types, regardless of view model mode
    this.loadEmptyPricingTypes(true);

    this.clientID = ko.observable(null);
    this.client = ko.observable(null);

    this.requestData = ko.observable(null);
    this.serviceEditorCancelLink = ko.observable(null);

    this.helpLink = '/help/relatedArticles/201967166-listing-and-pricing-your-services';
    this.isInOnboarding = app.model.onboarding.inProgress;

    this.isLocked = this.isLoading;

    this.jobTitles = new UserJobProfile(app);
    this.jobTitles.baseUrl('/serviceProfessionalService');
    this.jobTitles.selectJobTitle = function(jobTitle) {
        this.jobTitleID(jobTitle.jobTitleID());
        this.loadServicesData();
        return false;
    }.bind(this);

    this.loadServicesData = function() {
        var clientID = this.clientID(),
            jobTitleID = this.jobTitleID(),
            model = app.model.serviceProfessionalServices,
            services = clientID ? model.getClientSpecificServicesForJobTitle(clientID, jobTitleID) :
                                  model.getList(jobTitleID);

        return this.loadData(null, jobTitleID, services);
    }.bind(this);

    this.clientName = ko.pureComputed(function() {
        return (this.client() && this.client().firstName()) || '';
    }, this);

    this.jobTitleName = ko.pureComputed(function() {
        return (this.jobTitle() && this.jobTitle().singularName()) || '';
    }, this);

    this.submitText = ko.pureComputed(function() {
        return (
            this.isLoading() ? 
                'loading...' : 
                'Save and continue'
        );
    }, this);

    this.onboardingNextReady = ko.computed(function() {
        var isin = app.model.onboarding.inProgress(),
            hasPricing = this.list().length > 0;
        
        return isin && hasPricing;
    }, this);

    this.editServiceRequest = function() {
        return $.extend({ cancelLink: this.serviceEditorCancelLink() }, this.requestData());
    }.bind(this);

    this.newServiceRequest = function() {
        return $.extend({ cancelLink: this.serviceEditorCancelLink() }, this.requestData());
    }.bind(this);

    var baseNewServiceURL = this.newServiceURL;

    this.newServiceURL = function(jobTitleID, pricingTypeID) {
        if(this.client()) {
            return '#!serviceProfessionalServiceEditor/' + jobTitleID + '/pricing_type/' + pricingTypeID + '/client/' + this.clientID() + '/new';
        }
        else {
            return baseNewServiceURL(jobTitleID, pricingTypeID);
        }
    }.bind(this);
    
    /**
        Ends the selection process, ready to collect selection
        and passing it to the requester activity.
        Works too to pass to the next onboarding step
    **/
    this.endSelection = function(data, event) {
        
        if (app.model.onboarding.inProgress()) {
            // Ensure we keep the same jobTitleID in next steps as here:
            app.model.onboarding.selectedJobTitleID(this.jobTitleID());
            app.model.onboarding.goNext();
        }
        else {
            // Run method injected by the activity to return a 
            // selected address:
            this.returnSelected(
                this.selectedServices().map(function(pricing) {
                    return pricing.model.toPlainObject(true);
                }),
                this.jobTitleID()
            );
        }

        event.preventDefault();
        event.stopImmediatePropagation();
    }.bind(this);
    
    this.selectedServiceRequest = function(pricing) {
        return pricing.model.toPlainObject(true);
    };
}

ViewModel._inherits(ServiceProfessionalServiceViewModel);
