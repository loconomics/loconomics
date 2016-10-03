/**
    MarketplaceJobtitles activity
**/
'use strict';

var Activity = require('../components/Activity'),
    ko = require('knockout');

var A = Activity.extend(function MarketplaceJobtitlesActivity() {
    
    Activity.apply(this, arguments);
    
    this.accessLevel = this.app.UserType.serviceProfessional;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('Marketplace profile', {
        backLink: '/marketplaceProfile' , helpLink: this.viewModel.helpLink
    });

    // On changing jobTitleID:
    // - load addresses
    // - load job title information
    // - load pricing
    this.registerHandler({
        target: this.viewModel.jobTitleID,
        handler: function(jobTitleID) {

            if (jobTitleID) {
                ////////////
                // User Job Title
                // Get data for the Job Title and User Profile
                this.app.model.userJobProfile.getUserJobTitleAndJobTitle(jobTitleID)
                //this.app.model.jobTitles.getJobTitle(jobTitleID)
                .then(function(job) {
                    // Fill the job title record
                    this.viewModel.jobTitle(job.jobTitle);
                    this.viewModel.userJobTitle(job.userJobTitle);
                }.bind(this))
                .catch(function(err) {
                    this.app.modals.showError({
                        title: 'There was an error while loading your job title.',
                        error: err
                    });
                }.bind(this));
                
                /* NOTE: job title comes in the previous userJobProfile call, so is no need to duplicate the task
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
                }.bind(this));*/
                
                ////////////
                // Work Photos
                this.app.model.workPhotos.getList(jobTitleID)
                .then(function(list) {
                    list = this.app.model.workPhotos.asModel(list);
                    this.viewModel.workPhotos(list);

                }.bind(this))
                .catch(function (err) {
                    this.app.modals.showError({
                        title: 'There was an error while your work photos.',
                        error: err
                    });
                }.bind(this));
                ////////////
                // Submitted Licenses
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
                this.viewModel.jobTitle(null);
                this.viewModel.userJobTitle(null);
                //this.viewModel.jobTitleName('Job Title');
            }
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    // Reset: avoiding errors because persisted data for different ID on loading
    // or outdated info forcing update
    this.viewModel.jobTitleID(0);

    // Parameters
    var params = state && state.route && state.route.segments || {};
    
    // Set the job title
    var jobID = params[0] |0;
    this.viewModel.jobTitleID(jobID);
    
    //Get the return nav text
    var returnText = state && state.route && state.route.query.returnText || 'Back';
    this.viewModel.returnText(decodeURIComponent(returnText));
};

function ViewModel(app) {
    this.helpLink = '/help/relatedArticles/202034083-managing-your-marketplace-profile';
    
    this.jobTitleID = ko.observable(0);
    this.jobTitle = ko.observable(null);
    this.userJobTitle = ko.observable(null);
    this.returnText = ko.observable('Back'); 
    //this.jobTitleName = ko.observable('Job Title'); 
    this.jobTitleName = ko.pureComputed(function() {
        return this.jobTitle() && this.jobTitle().singularName() || 'Job Title';
    }, this);
    this.userID = ko.pureComputed(function() {
        return app.model.userProfile.data.userID();
    }, this);
    
    // Retrieves a computed that will link to the given named activity adding the current
    // jobTitleID and a mustReturn URL to point this page so its remember the back route
    this.getJobUrlTo = function(name) {
        // Sample '/serviceProfessionalServices/' + jobTitleID()
        return ko.pureComputed(function() {
            return (
                '/' + name + '/' + this.jobTitleID() + '?mustReturn=marketplaceJobtitles/' + this.jobTitleID() +
                '&returnText=' + encodeURIComponent(this.jobTitleName())
            );
        }, this);
    };
    
    var UserJobTitle = require('../models/UserJobTitle');
    this.isToggleReady = ko.pureComputed(function() {
        var j = this.userJobTitle();
        return j && j.statusID() !== UserJobTitle.status.incomplete;
    }, this);
    this.isActiveStatus = ko.pureComputed({
        read: function() {
            var j = this.userJobTitle();
            return j && j.statusID() === UserJobTitle.status.on || false;
        },
        write: function(v) {
            var status = this.userJobTitle() && this.userJobTitle().statusID();
            if (v === true && status === UserJobTitle.status.off) {
                this.userJobTitle().statusID(UserJobTitle.status.on);
                // Push change to back-end
                app.model.userJobProfile.reactivateUserJobTitle(this.jobTitleID())
                .catch(function(err) {
                    app.modals.showError({ title: 'Error enabling a Job Title', error: err });
                });
            }
            else if (v === false && status === UserJobTitle.status.on) {
                this.userJobTitle().statusID(UserJobTitle.status.off);
                // Push change to back-end
                app.model.userJobProfile.deactivateUserJobTitle(this.jobTitleID())
                .catch(function(err) {
                    app.modals.showError({ title: 'Error disabling a Job Title', error: err });
                });
                // Per #1001, notify user about availability of bookMeNow button even with public marketplace profile
                // disabled/hidden
                app.modals.showNotification({
                    message: 'Clients will no longer be able to find you in the marketplace. However, any "book me now" links you have posted will still be active.',
                    buttonText: 'Got it!'
                });
            }
        },
        owner: this
    });
    
    this.statusLabel = ko.pureComputed(function() {
        var statusID = this.userJobTitle() && this.userJobTitle().statusID();
        switch (statusID) {
            case UserJobTitle.status.on:
                return 'ON';
            case UserJobTitle.status.off:
                return 'OFF';
            //case UserJobTitle.status.incomplete:
            default:
                return 'INCOMPLETE (There are steps left to activate)';
        }
    }, this);

    /// Related models information
    this.submittedUserLicensesCertifications = ko.observableArray([]);
    this.jobTitleApplicableLicences = ko.observable(null);
    this.workPhotos = ko.observable([]);

    // Computed since it can check several externa loadings
    this.isLoading = ko.pureComputed(function() {
        return (
            app.model.serviceAddresses.state.isLoading() ||
            app.model.serviceProfessionalServices.state.isLoading()
        );
        
    }, this);
 
    this.licensesCertificationsSummary = ko.pureComputed(function() {
        var lc = this.submittedUserLicensesCertifications();
        //jshint maxcomplexity:8
        if (lc && lc.length) {
            var verified = 0, 
                other = 0,
                pending = 0;
            lc.forEach(function(l) {
                if (l && l.statusID() === 1)
                    verified++;
                else if (l && l.statusID() === 2)
                    pending++;
                else if (l && l.statusID() === 4)
                    return 'Expired, please update';
                else if (l && l.statusID() === 5)
                    other++;
                else if (l && l.statusID() === 6)
                    return 'Expiring soon, please update';
                else if (l && l.statusID() === 3)
                    return 'Please contact us';
            });
            return verified + ' verified, ' + pending + ' pending, ' + other + ' supplemental';
        }
        else {
            return 'None verified';
        }
    }, this);
    
    this.workPhotosSummary = ko.pureComputed(function() {
        var wp = this.workPhotos();
        // L18N
        if (wp && wp.length > 1)
            return wp.length + ' images';
        else if (wp && wp.length === 1)
            return '1 image';
        else
            return 'No images';
    }, this);
    
    this.deleteJobTitle = function() {
        var jid = this.jobTitleID();
        var jname = this.jobTitleName();
        if (jid) {
            app.modals.confirm({
                title: 'Delete ' + jname + ' profile',
                message: 'Are you really sure you want to delete your ' + jname +' profile?',
                yes: 'Delete',
                no: 'Keep'
            }).then(function() {
                app.shell.goBack();
                return app.model.userJobProfile.deleteUserJobTitle(jid);
            })
            .catch(function(err) {
                if (err) {
                    app.modals.showError({ error: err, title: 'Error while deleting a job title' });
                }
            });
        }
    }.bind(this);
}
