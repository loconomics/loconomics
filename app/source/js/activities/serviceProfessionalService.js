/**
    ServiceProfessional Service activity
    
    TODO: Use ServiceProfessionalService ViewModel and template
**/
'use strict';

var ko = require('knockout'),
    groupBy = require('lodash/groupBy'),
    $ = require('jquery'),
    Activity = require('../components/Activity');

var A = Activity.extend(function ServiceProfessionalServiceActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.serviceProfessional;
    this.viewModel = new ViewModel(this.app);
    // Defaults settings for navBar.
    this.navBar = Activity.createSubsectionNavBar('Job Title', {
        backLink: '/scheduling'
    });
    // Save defaults to restore on updateNavBarState when needed:
    this.defaultLeftAction = this.navBar.leftAction().model.toPlainObject(true);
    
    // On changing jobTitleID:
    // - load pricing
    this.registerHandler({
        target: this.viewModel.jobTitle,
        handler: function(/*jobTitle*/) {
            // Update navbar (may indicate the jobTitle name)
            this.updateNavBarState();
        }.bind(this)
    });

    // On changing jobTitleID:
    // - load pricing
    this.registerHandler({
        target: this.viewModel.jobTitleID,
        handler: function(jobTitleID) {
            if (jobTitleID) {
                // Get data for the Job title ID and pricing types.
                // They are essential data
                Promise.all([
                    this.app.model.jobTitles.getJobTitle(jobTitleID),
                    this.app.model.pricingTypes.getList()
                ])
                .then(function(data) {
                    var jobTitle = data[0];
                    // Save for use in the view
                    this.viewModel.jobTitle(jobTitle);
                    // Get pricing
                    return this.app.model.serviceProfessionalServices.getList(jobTitleID);
                }.bind(this))
                .then(function(list) {

                    list = this.app.model.serviceProfessionalServices.asModel(list);
                    
                    // Read presets selection from requestData
                    var preset = this.requestData.selectedServices || [],
                        selection = this.viewModel.selectedServices;
                    
                    // Add the isSelected property to each item
                    list.forEach(function(item) {
                        var preSelected = preset.some(function(pr) {
                            if (pr.serviceProfessionalServiceID === item.serviceProfessionalServiceID())
                                return true;
                        }) || false;
                        
                        item.isSelected = ko.observable(preSelected);
                        
                        if (preSelected) {
                            selection.push(item);
                        }
                    });
                    this.viewModel.list(list);

                }.bind(this))
                .catch(function (err) {
                    this.app.modals.showError({
                        title: 'There was an error while loading.',
                        error: err
                    });
                }.bind(this));
            }
            else {
                this.viewModel.list([]);
                this.viewModel.jobTitle(null);
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
        if (this.requestData.navTitle)
            this.navBar.leftAction().text(this.requestData.navTitle);

        var jid = this.viewModel.jobTitleID(),
            jname = this.viewModel.jobTitle() && this.viewModel.jobTitle().singularName() || 'Scheduling',
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
    this.viewModel.jobTitleID(0);
    this.viewModel.selectedServices.removeAll();
    this.viewModel.requestData = this.requestData;

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
        this.viewModel.cancelLink('/serviceProfessionalService/' + this.viewModel.jobTitleID());
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

    this.headerText = ko.observable('Services');
    
    this.jobTitleID = ko.observable(0);
    this.jobTitle = ko.observable(null);
    this.isAdditionMode = ko.observable(false);
    this.cancelLink = ko.observable(null);
    
    this.jobTitles = new UserJobProfile(app);
    this.jobTitles.baseUrl('/serviceProfessionalService');
    this.jobTitles.selectJobTitle = function(jobTitle) {
        
        this.jobTitleID(jobTitle.jobTitleID());
        var url = 'serviceProfessionalService/' + jobTitle.jobTitleID();
        if (this.isAdditionMode())
            url += '/new';
        // pushState cannot be used because it conflicts with the 
        // selection logic (on new-booking progress)
        // TODO: commented until the bug with replaceState in HashbangHistory is fixed
        //app.shell.replaceState(null, null, url);
        
        return false;
    }.bind(this);

    this.list = ko.observableArray([]);

    this.isLoading = ko.computed(function() {
        return (
            app.model.serviceProfessionalServices.state.isLoading() ||
            app.model.pricingTypes.state.isLoading() ||
            app.model.jobTitles.state.isLoading()
        );
    });
    this.isLocked = this.isLoading;

    // Especial mode when instead of pick and edit we are just selecting
    this.isSelectionMode = ko.observable(false);

    this.submitText = ko.pureComputed(function() {
        return (
            this.isLoading() ? 
                'loading...' : 
                'Save and continue'
        );
    }, this);
    
    // Grouped list of pricings:
    // Defined groups by pricing type
    this.groupedServices = ko.computed(function(){

        var list = this.list();
        var isSelection = this.isSelectionMode();
        var groupNamePrefix = isSelection ? 'Select ' : '';

        var groups = [],
            groupsList = [];
        if (!this.isAdditionMode()) {
            groups = groupBy(list, function(pricingItem) {
                return pricingItem.pricingTypeID();
            });

            // Convert the indexed object into an array with some meta-data
            groupsList = Object.keys(groups).map(function(key) {
                var gr = {
                    pricing: groups[key],
                    // Load the pricing information
                    type: app.model.pricingTypes.getObservableItem(key)
                };
                gr.group = ko.computed(function() {
                    return groupNamePrefix + (
                        this.type() && this.type().pluralName() ||
                        'Services'
                    );
                }, gr);
                return gr;
            });
        }
        
        // Since the groupsList is built from the existent pricing items
        // if there are no records for some pricing type (or nothing when
        // just created the job title), that types/groups are not included,
        // so review and include now.
        // NOTE: as a good side effect of this approach, pricing types with
        // some pricing will appear first in the list (nearest to the top)
        var pricingTypes = this.jobTitle() && this.jobTitle().pricingTypes();
        if (pricingTypes && pricingTypes.length) {
            pricingTypes.forEach(function (jobType) {
                
                var typeID = jobType.pricingTypeID();
                // Not if already in the list
                if (groups.hasOwnProperty(typeID))
                    return;

                var gr = {
                    pricing: [],
                    type: app.model.pricingTypes.getObservableItem(typeID)
                };
                gr.group = ko.computed(function() {
                    return groupNamePrefix + (
                        this.type() && this.type().pluralName() ||
                        'Services'
                    );
                }, gr);

                groupsList.push(gr);
            });
        }

        return groupsList;

    }, this);

    this.selectedServices = ko.observableArray([]);
    /**
        Toggle the selection status of a pricing, adding
        or removing it from the 'selectedServices' array.
    **/
    this.toggleServiceSelection = function(pricing) {

        var inIndex = -1,
            isSelected = this.selectedServices().some(function(selectedServices, index) {
            if (selectedServices === pricing) {
                inIndex = index;
                return true;
            }
        });

        pricing.isSelected(!isSelected);

        if (isSelected)
            this.selectedServices.splice(inIndex, 1);
        else
            this.selectedServices.push(pricing);
    }.bind(this);
    
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
    
    this.editService = function(pricing) {
        app.shell.go('serviceProfessionalServiceEditor/' + this.jobTitleID() + '/' + pricing.serviceProfessionalServiceID());
    }.bind(this);
    
    /**
        Handler for the listview items, managing edition and selection depending on current mode
    **/
    this.tapService = function(pricing, event) {
        if (this.isSelectionMode()) {
            this.toggleServiceSelection(pricing);
        }
        else {
            this.editService(pricing);
        }

        event.preventDefault();
        event.stopImmediatePropagation();
    }.bind(this);
    
    this.tapNewService = function(group, event) {
        
        var url = '#!serviceProfessionalServiceEditor/' + this.jobTitleID() + '/new/' + (group.type() && group.type().pricingTypeID());

        // Passing original data, for in-progress process (as new-booking)
        // and the selected title since the URL could not be updated properly
        // (see the anotated comment about replaceState bug on this file)
        var request = $.extend({}, this.requestData, {
            selectedJobTitleID: this.jobTitleID()
        });
        if (!request.cancelLink) {
            $.extend(request, {
                cancelLink: this.cancelLink()
            });
        }
        
        // When in selection mode:
        // Add current selection as preselection, so can be recovered later and 
        // the editor can add the new pricing to the list
        if (this.isSelectionMode()) {
            request.selectedServices = this.selectedServices()
            .map(function(pricing) {
                return pricing.model.toPlainObject(true);
            });
        }

        app.shell.go(url, request);

        event.preventDefault();
        event.stopImmediatePropagation();
    }.bind(this);
}
