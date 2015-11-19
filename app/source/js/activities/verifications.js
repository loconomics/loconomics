/**
    Verifications activity
**/
'use strict';

var ko = require('knockout'),
    Activity = require('../components/Activity');

var A = Activity.extend(function VerificationsActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = new ViewModel(this.app);
    // Defaults settings for navBar.
    this.navBar = Activity.createSubsectionNavBar('Marketplace Profile', {
        backLink: '/marketplaceProfile'
    });
    
    // Setup special links behavior to add/perform specific verifications
    this.registerHandler({
        target: this.$activity,
        event: 'click',
        selector: '[href="#resendEmailConfirmation"]',
        handler: function() {
            this.app.modals.showNotification({
                message: 'TO-DO: resend email confirmation'
            });
        }.bind(this)
    });
    this.registerHandler({
        target: this.$activity,
        event: 'click',
        selector: '[href="#connectWithFacebook"]',
        handler: function() {
            this.app.modals.showNotification({
                message: 'TO-DO: ask for connect with Facebook API'
            });
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);
    
    this.app.model.userVerifications.getList()
    .then(function(list) {
        this.viewModel.userVerifications(list());
    }.bind(this))
    .catch(function(err) {
        this.app.modals.showError({ title: 'Error loading your verifications', error: err });
    }.bind(this));
};

function ViewModel(app) {
    
    this.isSyncing = app.model.userVerifications.state.isSyncing;
    this.isLoading = app.model.userVerifications.state.isLoading;
    this.isSaving = app.model.userVerifications.state.isSaving;

    this.userVerifications = ko.observableArray();

    this.emailInfo = ko.observable('Please click on "Verify my account" in the e-mail we sent you to verify your address. <a class="btn btn-link btn-block"  href="#resendEmailConfirmation">Click here to resend.</a>');
    this.facebookInfo = ko.pureComputed(function() {
        var tpl = 'Letting potential __kind__ know you have a trusted online presence helps them know you\'re real. <a class="btn btn-link btn-block" href="#connectWithFacebook">Click here to connect your account.</a>';
        return tpl.replace(/__kind__/, app.model.user().isServiceProfessional() ? 'clients' : 'service professionals');
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
