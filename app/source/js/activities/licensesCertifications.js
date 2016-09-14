/**
    LicensesCertifications activity
**/
'use strict';

var ko = require('knockout'),
    $ = require('jquery'),
    Activity = require('../components/Activity');

var A = Activity.extend(function LicensesCertificationsActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.serviceProfessional;
    this.viewModel = new ViewModel(this.app);
    // Defaults settings for navBar.
    
    this.navBar = Activity.createSubsectionNavBar('Job Title', {
        backLink: '/marketplaceProfile', helpLink: '/help/relatedArticles/201967966-adding-professional-licenses-and-certifications'
    });
    
    this.defaultNavBar = this.navBar.model.toPlainObject(true);
    
    // On changing jobTitleID:
    // - load job title name
    this.registerHandler({
        target: this.viewModel.jobTitleID,
        handler: function(jobTitleID) {

            if (jobTitleID) {
                
                ////////////
                // Job Title
                // Get data for the Job title ID
                this.app.model.jobTitles.getJobTitle(jobTitleID)
                .then(function(jobTitle) {

                // Fill in job title name
                this.viewModel.jobTitleName(jobTitle.singularName());
                }.bind(this))
                .catch(function(err) {
                    this.app.modals.showError({
                        title: 'There was an error while loading the job title.',
                        error: err
                    });
                }.bind(this));
                
                // Get data for the Job title ID
                this.app.model.userLicensesCertifications.getList(jobTitleID)
                .then(function(list) {
                    // Save for use in the view
                    this.viewModel.submittedUserLicensesCertifications(this.app.model.userLicensesCertifications.asModel(list));
                }.bind(this))
                .catch(function (err) {
                    this.app.modals.showError({
                        title: 'There was an error while loading.',
                        error: err
                    });
                }.bind(this));

                // Get required licenses for the Job title ID - an object, not a list
                this.app.model.jobTitleLicenses.getItem(jobTitleID)
                .then(function(item) {
                    // Save for use in the view
                    this.viewModel.jobTitleApplicableLicences(item);
                }.bind(this))
                .catch(function (err) {
                    this.app.modals.showError({
                        title: 'There was an error while loading.',
                        error: err
                    });
                }.bind(this));
            }
            else {
                this.viewModel.jobTitleName('Job Title');
                this.viewModel.submittedUserLicensesCertifications([]);
                this.viewModel.jobTitleApplicableLicences(null);
            }
        }.bind(this)
    });
});
exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {
    
    if (!this.app.model.onboarding.updateNavBar(this.navBar)) {
        // Reset
        this.navBar.model.updateWith(this.defaultNavBar, true);
    }
};

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);
    
    this.updateNavBarState();

    var params = options && options.route && options.route.segments;
    var jobTitleID = params[0] |0;
    this.viewModel.jobTitleID(jobTitleID);
    if (!jobTitleID) {
        // Load titles to display for selection
        this.viewModel.jobTitles.sync();
    }
};

var UserJobProfile = require('../viewmodels/UserJobProfile');

function ViewModel(app) {
    
    this.jobTitleID = ko.observable(0);
    this.submittedUserLicensesCertifications = ko.observableArray([]);
    //is an object that happens to have arrays
    this.jobTitleApplicableLicences = ko.observable(null);
    this.jobTitleName = ko.observable('Job Title'); 
    
    this.isSyncing = app.model.userLicensesCertifications.state.isSyncing();
    this.isLoading = app.model.userLicensesCertifications.state.isLoading();
    
    this.jobTitles = new UserJobProfile(app);
    this.jobTitles.baseUrl('/licensesCertifications');
    this.jobTitles.selectJobTitle = function(jobTitle) {
        
        this.jobTitleID(jobTitle.jobTitleID());
        
        return false;
    }.bind(this);

    this.addNew = function(item) {
        var url = '#!licensesCertificationsForm/' + this.jobTitleID() + '/0?licenseCertificationID=' + item.licenseCertificationID(),
            cancelUrl = app.shell.currentRoute.url;
        var request = $.extend({}, this.requestData, {
            cancelLink: cancelUrl
        });
        app.shell.go(url, request);
    }.bind(this);
    
    this.selectItem = function(item) {
        var url = '/licensesCertificationsForm/' + this.jobTitleID() + '/' +
            item.userLicenseCertificationID() + '?mustReturn=' + 
            encodeURIComponent(app.shell.currentRoute.url) +
            '&returnText=' + encodeURIComponent('Licenses/certifications');
        app.shell.go(url, this.requestData);
    }.bind(this);
    
    this.onboardingNextReady = ko.computed(function() {
        var groups = this.jobTitleApplicableLicences();
        if (!groups) return false;
        var isin = app.model.onboarding.inProgress();
        
        // TODO check if all required from all groups are filled with a valid status
        
        return isin;
    }, this);
    
    this.goNext = function() {
        if (app.model.onboarding.inProgress()) {
            app.model.onboarding.goNext();
        }
    };
}
