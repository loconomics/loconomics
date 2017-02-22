/**
    ServiceProfessional Service activity
**/
'use strict';

var ko = require('knockout'),
    Activity = require('../components/Activity'),
    ServiceProfessionalServiceViewModel = require('../viewmodels/ServiceProfessionalService');

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
        }.bind(this)
    });

    // On changing jobTitleID:
    this.registerHandler({
        target: this.viewModel.jobTitleID,
        handler: function(jobTitleID) {
            if (jobTitleID) {
                /// Rewrite URL
                // IMPORTANT: When in isSelectionMode, pushState cannot be use
                // because it conflicts with the selection logic (on new-booking progress)
                // TODO: discarded URL rewrite until the bug with replaceState in HashbangHistory is fixed
                if (this.viewModel.isSelectionMode()) return;
                // If the URL didn't included the jobTitleID, or is different,
                // we put it to avoid reload/resume problems
                var found = /serviceProfessionalService\/(\d+)/i.exec(window.location);
                var urlID = found && found[1] |0;
                if (urlID !== jobTitleID) {
                    var url = '/serviceProfessionalService/' + jobTitleID;
                    if (this.viewModel.isAdditionMode()) url += '/new';
                    this.app.shell.replaceState(null, null, url);
                }
            }
        }.bind(this)
    });

    // On changing jobTitleID:
    // - load pricing
    this.registerHandler({
        target: this.viewModel.jobTitleID,
        handler: function(jobTitleID) {
            this.viewModel.loadData(null, jobTitleID);
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
        if (this.requestData.navTitle)
            this.navBar.leftAction().text(this.requestData.navTitle);

        var jid = this.viewModel.jobTitleID(),
            jname = this.viewModel.jobTitle() && this.viewModel.jobTitle().singularName() || 'Scheduler',
            url = this.mustReturnTo || (jid && '/jobtitles/' + jid || '/scheduling');

        this.navBar.leftAction().link(url);
        this.navBar.leftAction().text(jname);
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
    var itIs = this.viewModel.isSelectionMode();
    
    this.viewModel.headerText(itIs ? 'Select services' : 'Services');
    
    // Perform updates that apply this request:
    this.app.model.onboarding.updateNavBar(this.navBar) ||
    //this.app.applyNavbarMustReturn(this.requestData) ||
    this.applyOwnNavbarRules();
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
    
    // Params
    var params = options && options.route && options.route.segments;
    var jobTitleID = params[0] |0;
    if (jobTitleID === 0 && options.selectedJobTitleID > 0)
        jobTitleID = options.selectedJobTitleID |0;

    var isAdditionMode = params[0] === 'new' || params[1] === 'new';
    if (isAdditionMode) {
        // Sets referrer as cancelLink
        var ref = this.app.shell.referrerRoute;
        ref = ref && ref.url || '/';
        this.requestData.cancelLink = ref;
        // Set for editor links in the view
        this.viewModel.cancelLink(ref);
    }
    else {
        // Set this page as cancelLink for editor links in the view
        this.viewModel.cancelLink('/serviceProfessionalService/' + jobTitleID);
    }

    this.viewModel.isAdditionMode(isAdditionMode);
    
    this.updateNavBarState();

    this.viewModel.jobTitleID(jobTitleID);
    
    if (jobTitleID === 0) {
        this.viewModel.jobTitles.sync();
    }
};

var UserJobProfile = require('../viewmodels/UserJobProfile');

function ViewModel(app) {
    // ViewModel has all of the properties of a ServiceProfessionalServiceViewModel
    ServiceProfessionalServiceViewModel.call(this, app);

    // Always load empty pricing types, regardless of view model mode
    this.loadEmptyPricingTypes(true);

    this.helpLink = '/help/relatedArticles/201967166-listing-and-pricing-your-services';
    this.isInOnboarding = app.model.onboarding.inProgress;
    this.headerText = ko.observable('Services');

    this.isLocked = this.isLoading;

    this.jobTitles = new UserJobProfile(app);
    this.jobTitles.baseUrl('/serviceProfessionalService');
    this.jobTitles.selectJobTitle = function(jobTitle) {
        this.jobTitleID(jobTitle.jobTitleID());
        return false;
    }.bind(this);

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
