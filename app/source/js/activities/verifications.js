/**
    Verifications activity
**/
'use strict';

var ko = require('knockout'),
    Activity = require('../components/Activity');

var A = Activity.extends(function VerificationsActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.LoggedUser;
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
    
};

function ViewModel(app) {
    
    //this.isSyncing = app.model.userVerifications.state.isSyncing;
    this.isSyncing = ko.observable(false);
    this.isLoading = ko.observable(false);
    this.isSaving = ko.observable(false);
    
    this.userVerifications = ko.observableArray(testdata());
    
    this.emailInfo = ko.observable('Please click on "Verify my account" in the e-mail we sent you to verify your address. <a class="btn btn-link btn-block"  href="#resendEmailConfirmation">Click here to resend.</a>');
    this.facebookInfo = ko.pureComputed(function() {
        var tpl = 'Letting potential __kind__ know you have a trusted online presence helps them know you\'re real. <a class="btn btn-link btn-block" href="#connectWithFacebook">Click here to connect your account.</a>';
        return tpl.replace(/__kind__/, app.model.user().isFreelancer() ? 'clients' : 'freelancers');
    });
}

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

var Model = require('../models/Model');
// TODO Incomplete Model for UI mockup
function UserVerification(values) {
    Model(this);
    
    this.model.defProperties({
        statusID: 0,
        lastVerifiedDate: null,
        verification: {
            Model: Verification
        }
    }, values);
    
    this.statusText = ko.pureComputed(function() {
        // L18N
        var statusTextsenUS = {
            'verification.status.confirmed': 'Confirmed',
            'verification.status.pending': 'Pending',
            'verification.status.revoked': 'Revoked',
            'verification.status.obsolete': 'Obsolete'
        };
        var statusCode = enumGetName(this.statusID(), Verification.status);
        return statusTextsenUS['verification.status.' + statusCode];
    }, this);
    
    /**
        Check if verification has a given status by name
    **/
    this.isStatus = function (statusName) {
        var id = this.statusID();
        return Verification.status[statusName] === id;
    }.bind(this);
}
function Verification(values) {
    Model(this);
    
    this.model.defProperties({
        name: ''
    }, values);
}
Verification.status = {
    confirmed: 1,
    pending: 2,
    revoked: 3,
    obsolete: 4
};
function enumGetName(value, enumList) {
    var found = null;
    Object.keys(enumList).some(function(k) {
        if (enumList[k] === value) {
            found = k;
            return true;
        }
    });
    return found;
}
                               