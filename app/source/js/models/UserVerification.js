/**
    UserVerification model
**/
'use strict';

var Model = require('./Model'),
    ko = require('knockout'),
    Verification = require('./Verification');

function UserVerification(values) {
    Model(this);
    
    this.model.defProperties({
        userID: 0,
        verificationID: 0,
        jobTitleID: 0,
        lastVerifiedDate: null,
        statusID: 0,
        verification: {
            Model: Verification
        }
    }, values);
    
    // L18N
    var statusTextsenUS = {
        'verification.status.confirmed': 'Confirmed',
        'verification.status.pending': 'Pending',
        'verification.status.revoked': 'Revoked',
        'verification.status.obsolete': 'Obsolete'
    };

    this.statusText = ko.pureComputed(function() {
        var statusName = Verification.getStatusName(this.statusID());
        return statusTextsenUS['verification.status.' + statusName];
    }, this);

    /**
        Check if verification has a given status by name
    **/
    this.isStatus = function (statusName) {
        var id = this.statusID();
        return Verification.status[statusName] === id;
    }.bind(this);
}

module.exports = UserVerification;
