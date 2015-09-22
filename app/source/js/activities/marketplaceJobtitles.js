/**
    MarketplaceJobtitles activity
**/
'use strict';

var Activity = require('../components/Activity'),
    ko = require('knockout');

var A = Activity.extends(function MarketplaceJobtitlesActivity() {
    
    Activity.apply(this, arguments);
    
    this.accessLevel = this.app.UserType.serviceProfessional;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('Marketplace profile', {
        backLink: '/marketplaceProfile'
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
                // Addresses
                this.app.model.serviceAddresses.getList(jobTitleID)
                .then(function(list) {

                    list = this.app.model.serviceAddresses.asModel(list);
                    this.viewModel.addresses(list);

                }.bind(this))
                .catch(function (err) {
                    this.app.modals.showError({
                        title: 'There was an error while loading addresses.',
                        error: err
                    });
                }.bind(this));
                
                ////////////
                // Pricing/Services
                this.app.model.serviceProfessionalServices.getList(jobTitleID)
                .then(function(list) {

                    list = this.app.model.serviceProfessionalServices.asModel(list);
                    this.viewModel.pricing(list);

                }.bind(this))
                .catch(function (err) {
                    this.app.modals.showError({
                        title: 'There was an error while loading services.',
                        error: err
                    });
                }.bind(this));
                
                ////////////
                // Job Title
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
            }
            else {
                this.viewModel.addresses([]);
                this.viewModel.pricing([]);
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
};

function ViewModel(app) {
    
    this.jobTitleID = ko.observable(0);
    this.jobTitle = ko.observable(null);
    this.userJobTitle = ko.observable(null);
    this.jobTitleName = ko.pureComputed(function() {
        var j = this.jobTitle();
        return j && j.singularName() || 'Job Title';
    }, this);
    
    // Retrieves a computed that will link to the given named activity adding the current
    // jobTitleID and a mustReturn URL to point this page so its remember the back route
    this.getJobUrlTo = function(name) {
        // Sample '/serviceProfessionalServices/' + jobTitleID()
        return ko.pureComputed(function() {
            return (
                '/' + name + '/' + this.jobTitleID() + '?mustReturn=marketplaceJobtitles/' + this.jobTitleID() +
                '&returnText=' + this.jobTitleName()
            );
        }, this);
    };
    
    this.isActiveStatus = ko.pureComputed({
        read: function() {
            var j = this.userJobTitle();
            return j && j.statusID() === 1 || false;
        },
        write: function(v) {
            var status = this.userJobTitle() && this.userJobTitle().statusID();
            if (v === true && status === 3) {
                this.userJobTitle().statusID(1);
            }
            else if (v === false && status === 1) {
                this.userJobTitle().statusID(3);
            }
            // TODO Push change to back-end
        },
        owner: this
    });
    
    this.statusLabel = ko.pureComputed(function() {
        return this.isActiveStatus() ? 'ON' : 'OFF';
    }, this);
    
    this.cancellationPolicyLabel = ko.pureComputed(function() {
        var pid = this.userJobTitle() && this.userJobTitle().cancellationPolicyID();
        // TODO fetch policy ID label
        return pid === 3 ? 'Flexible' : pid === 2 ? 'Moderate' : 'Strict';
    }, this);
    
    this.instantBooking = ko.pureComputed(function() {
        return this.userJobTitle() && this.userJobTitle().instantBooking();
    }, this);
    
    this.instantBookingLabel = ko.pureComputed(function() {
        return this.instantBooking() ? 'ON' : 'OFF';
    }, this);
    
    this.toggleInstantBooking = function() {
        var current = this.instantBooking();
        if (this.userJobTitle()) {
            this.userJobTitle().instantBooking(!current);
            // TODO Push change to server
        }
    };

    /// Related models information
    
    this.addresses = ko.observable([]);
    this.pricing = ko.observable([]);
    this.licenseCertifications = ko.observable([]);
    this.workPhotos = ko.observable([]);

    // Computed since it can check several externa loadings
    this.isLoading = ko.pureComputed(function() {
        return (
            app.model.serviceAddresses.state.isLoading() ||
            app.model.serviceProfessionalServices.state.isLoading()
        );
        
    }, this);
    
    this.addressesCount = ko.pureComputed(function() {
        
        // TODO l10n.
        // Use i18next plural localization support rather than this manual.
        var count = this.addresses().length,
            one = '1 location',
            more = ' locations';
        
        if (count === 1)
            return one;
        else
            // Small numbers, no need for formatting
            return count + more;

    }, this);
    
    this.pricingCount = ko.pureComputed(function() {
        
        // TODO l10n.
        // Use i18next plural localization support rather than this manual.
        var count = this.pricing().length,
            one = '1 service',
            more = ' services';
        
        if (count === 1)
            return one;
        else
            // Small numbers, no need for formatting
            return count + more;

    }, this);
    
    this.licensesCertificationsSummary = ko.pureComputed(function() {
        var lc = this.licenseCertifications();
        if (lc && lc.length) {
            // TODO Detect 
            var verified = 0,
                pending = 0;
            lc.forEach(function(l) {
                if (l && l.statusID() === 1)
                    verified++;
                else if (l && l.statusID() === 2)
                    pending++;
            });
            // L18N
            return verified + ' verified, ' + pending + ' pending';
        }
        else {
            // L18N
            return 'There are not verifications';
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
    
}
