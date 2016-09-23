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
                    // SPECIAL CASE:
                    // If we are in onboarding and there are no required licenses applicable to the job title,
                    // we automatically jump to next step (we just check if the condition to continue is matched)
                    if (this.viewModel.onboardingNextReady()) {
                        this.viewModel.goNext();
                    }
                }.bind(this))
                .catch(function (err) {
                    this.app.modals.showError({
                        title: 'There was an error while loading.',
                        error: err
                    });
                }.bind(this));
                
                // Fix URL
                // If the URL didn't included the jobTitleID, or is different,
                // we put it to avoid reload/resume problems
                var found = /licensesCertifications\/(\d+)/i.exec(window.location);
                var urlID = found && found[1] |0;
                if (urlID !== jobTitleID) {
                    var url = '/licensesCertifications/' + jobTitleID;
                    this.app.shell.replaceState(null, null, url);
                }
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
    // Reset
    this.viewModel.jobTitleID(0);

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

    this.isInOnboarding = app.model.onboarding.inProgress;
    
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
        if (!app.model.onboarding.inProgress()) return false;
        var groups = this.jobTitleApplicableLicences();
        if (!groups) return false;

        //If at some point the user credential status need to be checked, this
        // utility can be used (lines commented inside the other function too
        //var userCredentials = this.submittedUserLicensesCertifications();
        /*var findUserCredential = function(credentialID) {
            var found = null;
            userCredentials.some(function(uc) {
                if (uc.licenseCertificationID() == credentialID) {
                    found = uc;
                    // stop loop
                    return true;
                }
            });
            return found;
        };*/
        var hasAllRequiredOfGroup = function(group) {
            if (!group || !group.length) return true;
            var allAccomplished = !group.some(function(credential) {
                // IMPORTANT: The credential record holds a special field, 'submitted',
                // that tell us already if the userCredential for that was submitted and then pass
                // the requirement, so we do not need to search and check the userCredential.
                // Still, sample code was wrote for that if in a future something more like the status
                // needs to be checked (but the status, initially -in the onboarding- will be not-reviewed)
                /*if (credential.required()) {
                    var userCredential = findUserCredential(credential.licenseCertificationID());
                    return (userCredential && userCredential.statusID() === ???);
                }*/
                
                if (credential.required()) {
                    // NOTE: It returns the negated result, that means that when a required credential
                    // is not fullfilled, returning true we stop immediately the loop and know the requirements
                    // are not accomplished.
                    return !credential.submitted();
                }
            });
            return allAccomplished;
        };
        
        return (
            hasAllRequiredOfGroup(groups.municipality()) &&
            hasAllRequiredOfGroup(groups.county()) &&
            hasAllRequiredOfGroup(groups.stateProvince()) &&
            hasAllRequiredOfGroup(groups.country())
        );
    }, this);
    
    this.goNext = function() {
        if (app.model.onboarding.inProgress()) {
            // Ensure we keep the same jobTitleID in next steps as here:
            app.model.onboarding.selectedJobTitleID(this.jobTitleID());
            app.model.onboarding.goNext();
        }
    }.bind(this);
}
