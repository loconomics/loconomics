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
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);
    
};

function ViewModel(/*app*/) {
    
    //this.isSyncing = app.model.userVerifications.state.isSyncing;
    this.isSyncing = ko.observable(false);
    this.isLoading = ko.observable(false);
    this.isSaving = ko.observable(false);
    
    this.userVerifications = ko.observableArray(testdata());
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
                               