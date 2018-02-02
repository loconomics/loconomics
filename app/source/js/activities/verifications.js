/**
    Verifications activity
**/
'use strict';

import '../kocomponents/utilities/icon-dec';
var ko = require('knockout');
var Activity = require('../components/Activity');
var user = require('../data/userProfile').data;
var userVerifications = require('../data/userVerifications');
var showNotification = require('../modals/notification').show;
var showError = require('../modals/error').show;

var A = Activity.extend(function VerificationsActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = new ViewModel();
    // Defaults settings for navBar.

    this.navBar = Activity.createSubsectionNavBar('Marketplace profile', {
        backLink: '/yourListings', helpLink: this.viewModel.helpLink
    });
    this.title('Verifications');
    // Share navBar with desktop nav through viewModel
    this.viewModel.navBar = this.navBar;

    // Setup special links behavior to add/perform specific verifications
    this.registerHandler({
        target: this.$activity,
        event: 'click',
        selector: '[href="#resendEmailConfirmation"]',
        handler: function() {
            showNotification({
                message: 'TO-DO: resend email confirmation'
            });
        }
    });
    this.registerHandler({
        target: this.$activity,
        event: 'click',
        selector: '[href="#connectWithFacebook"]',
        handler: function() {
            showNotification({
                message: 'TO-DO: ask for connect with Facebook API'
            });
        }
    });
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);

    userVerifications.getList()
    .then(function(list) {
        this.viewModel.userVerifications(list());
    }.bind(this))
    .catch(function(err) {
        showError({ title: 'Error loading your verifications', error: err });
    }.bind(this));
};

function ViewModel() {
    this.helpLink = '/help/relatedArticles/201967776-adding-verifications-to-your-profile';

    this.isSyncing = userVerifications.state.isSyncing;
    this.isLoading = userVerifications.state.isLoading;
    this.isSaving = userVerifications.state.isSaving;

    this.userVerifications = ko.observableArray();

    this.emailInfo = ko.observable('Please click on "Verify my account" in the e-mail we sent you to verify your address. <a class="btn btn-link btn-block"  href="#resendEmailConfirmation">Click here to resend.</a>');
    this.facebookInfo = ko.pureComputed(function() {
        var tpl = 'Letting potential __kind__ know you have a trusted online presence helps them know you\'re real. <a class="btn btn-link btn-block" href="#connectWithFacebook">Click here to connect your account.</a>';
        return tpl.replace(/__kind__/, user.isServiceProfessional() ? 'clients' : 'service professionals');
    });
}

/*
var UserVerification = require('../models/UserVerification'),
    Verification = require('../models/Verification');

function testdata() {

    var verA = new Verification({
            name: 'Email'
        }),
        verB = new Verification({
            name: 'Facebook'
        }),
        verC = new Verification({
            name: 'Loconomic\'s user-reviewed'
        });

    return [
        new UserVerification({
            statusID: Verification.status.confirmed,
            lastVerifiedDate: new Date(2015, 1, 12, 10, 23, 32),
            verification: verA
        }),
        new UserVerification({
            statusID: Verification.status.revoked,
            lastVerifiedDate: new Date(2015, 5, 20, 16, 4, 0),
            verification: verB
        }),
        new UserVerification({
            statusID: Verification.status.pending,
            lastVerifiedDate: new Date(2014, 11, 30, 19, 54, 4),
            verification: verC
        })
    ];
}
*/
