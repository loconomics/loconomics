/**
    backgroundCheck activity
**/
'use strict';

var ko = require('knockout'),
    Activity = require('../components/Activity');

var A = Activity.extends(function BackgroundCheckActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
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
    
    //this.isSyncing = app.model.backgroundCheck.state.isSyncing;
    this.isSyncing = ko.observable(false);
    this.isLoading = ko.observable(false);
    this.isSaving = ko.observable(false);
    
    this.list = ko.observableArray(testdata());
}


// IMPORTANT Background Check uses verification statuses
var Verification = function() {};
Verification.status = {
    confirmed: 1,
    pending: 2,
    revoked: 3,
    obsolete: 4
};

function testdata() {
    
    var verA = new BackgroundCheck({
            name: 'Database Search'
        }),
        verB = new BackgroundCheck({
            name: 'Basic Criminal'
        }),
        verC = new BackgroundCheck({
            name: 'Risk Adverse'
        }),
        verD = new BackgroundCheck({
            name: 'Healthcare Check'
        });

    return [
        new UserBackgroundCheck({
            statusID: Verification.status.confirmed,
            lastVerifiedDate: new Date(2015, 1, 12, 10, 23, 32),
            backgroundCheck: verA
        }),
        new UserBackgroundCheck({
            statusID: Verification.status.revoked,
            lastVerifiedDate: new Date(2015, 5, 20, 16, 4, 0),
            backgroundCheck: verB
        }),
        new UserBackgroundCheck({
            statusID: Verification.status.pending,
            lastVerifiedDate: new Date(2014, 11, 30, 19, 54, 4),
            backgroundCheck: verC
        }),
        new UserBackgroundCheck({
            statusID: Verification.status.obsolete,
            lastVerifiedDate: new Date(2014, 11, 30, 19, 54, 4),
            backgroundCheck: verD
        })
    ];
}


var Model = require('../models/Model');
// TODO Incomplete Model for UI mockup
function UserBackgroundCheck(values) {
    Model(this);
    
    this.model.defProperties({
        statusID: 0,
        lastVerifiedDate: null,
        backgroundCheck: {
            Model: BackgroundCheck
        }
    }, values);
    
    // Same as in UserVerifications
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
function BackgroundCheck(values) {
    Model(this);
    
    this.model.defProperties({
        name: ''
    }, values);
}

// Become shared util; it is on Verifications too:
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
                               