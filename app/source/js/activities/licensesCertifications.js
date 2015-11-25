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
    this.navBar = Activity.createSubsectionNavBar('Job Title');

    // On changing jobTitleID:
    // - load licenses/certifications
    /* TODO Uncomment and update on implementing REST API AppModel
    this.registerHandler({
        target: this.viewModel.jobTitleID,
        handler: function(jobTitleID) {
            if (jobTitleID) {
                // Get data for the Job title ID
                this.app.model.licensesCertifications.getList(jobTitleID)
                .then(function(list) {
                    // Save for use in the view
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
            }
        }.bind(this)
    });*/
    // TODO Remove on implemented REST API
    this.viewModel.list(testdata());
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);

    var params = options && options.route && options.route.segments;
    this.viewModel.jobTitleID(params[0] |0);
};

function ViewModel(app) {

    this.jobTitleID = ko.observable(0);
    this.list = ko.observableArray([]);
    
    this.isSyncing = app.model.licensesCertifications.state.isSyncing();
    this.isLoading = app.model.licensesCertifications.state.isLoading();

    this.addNew = function() {
        var url = '#!licensesCertificationsForm/' + this.jobTitleID(),
            cancelUrl = app.shell.currentRoute.url;
        var request = $.extend({}, this.requestData, {
            cancelLink: cancelUrl
        });
        app.shell.go(url, request);
    }.bind(this);
    
    this.selectItem = function(item) {
        var url = '/licensesCertificationsForm/' + this.jobTitleID() + '/' +
            item.licenseCertificationID() + '?mustReturn=' + 
            encodeURIComponent(app.shell.currentRoute.url) +
            '&returnText=' + encodeURIComponent('Certifications/Licenses');
        app.shell.go(url, this.requestData);
    }.bind(this);
}

/// TESTDATA
var UserLicenseCertification = require('../models/UserLicenseCertification');
var LicenseCertification = require('../models/LicenseCertification');
function testdata() {
    
    var base = {
        17: new LicenseCertification({
            licenseCertificationID: 17,
            name: 'Certified Massage Therapist (CMT)',
            stateProvinceID: 1,
            countryID: 1,
            description: 'Required to complete at least 500 hours of massage education and training at an approved massage therapy school.  CMTs also must undergo background checks, including fingerprinting and other identification verification procedures.',
            authority: 'The California Massage Therapy Council (CAMTC)',
            verificationWebsiteUrl: 'https://www.camtc.org/VerifyCertification.aspx',
            howToGetLicensedUrl: 'https://www.camtc.org/FormDownloads/CAMTCApplicationChecklist.pdf',
            optionGroup: 'Certified Massage',
            createdDate: new Date(),
            updatedDate: new Date()
        }),
        18: new LicenseCertification({
            licenseCertificationID: 18,
            name: 'Certified Massage Practitioner (CMP)',
            stateProvinceID: 1,
            countryID: 1,
            description: 'Generally must complete at least 250 hours of education and training.  CMPs also must undergo background checks, including fingerprinting and other identification verification procedures.',
            authority: 'The California Massage Therapy Council (CAMTC)',
            verificationWebsiteUrl: 'https://www.camtc.org/VerifyCertification.aspx',
            howToGetLicensedUrl: 'https://www.camtc.org/FormDownloads/CAMTCApplicationChecklist.pdf',
            optionGroup: 'Certified Massage',
            createdDate: new Date(),
            updatedDate: new Date()
        })
    };

    return [
        (new UserLicenseCertification({
            userID: 141,
            jobTitleID: 106,
            statusID: 2,
            licenseCertificationID: 18,
            licenseCertificationNumber: 21341234,
            stateProvinceID: 1,
            countryID: 1,
            expirationDate: new Date(2016, 1, 20),
            lastVerifiedDate: new Date(2015, 3, 20),
            createdDate: new Date(),
            updatedDate: new Date(),
            licenseCertification: base['18']
        })),
        (new UserLicenseCertification({
            userID: 141,
            jobTitleID: 106,
            statusID: 1,
            licenseCertificationID: 17,
            licenseCertificationNumber: 987654321,
            stateProvinceID: 1,
            countryID: 1,
            expirationDate: new Date(2016, 1, 20),
            lastVerifiedDate: new Date(2015, 3, 20),
            createdDate: new Date(),
            updatedDate: new Date(),
            licenseCertification: base['17']
        }))
    ];
}
