/**
    UserJobTitle model, relationship between an user and a
    job title and the main data attached to that relation.
**/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    ProfileAlert = require('./ProfileAlert');

function UserJobTitle(values) {
    
    Model(this);
    
    this.model.defProperties({
        userID: 0,
        jobTitleID: 0,
        intro: null,
        statusID: 0,
        cancellationPolicyID: 0,
        instantBooking: false,
        bookMeButtonReady: false,
        collectPaymentAtBookMeButton: false,
        createdDate: null,
        updatedDate: null,
        alerts: { isArray: true, Model: ProfileAlert }
    }, values);
    
    this.model.defID(['userID', 'jobTitleID']);

    this.requiredAlerts = ko.pureComputed(function() {
        return this.alerts().filter(function(profileAlert) {
            return profileAlert.isRequired();
        });
    }, this);

    this.isComplete = ko.pureComputed(function() {
        var statusComplete = this.statusID() === UserJobTitle.status.on || this.statusID() === UserJobTitle.status.off,
            hasRequiredAlerts = this.requiredAlerts().length > 0;

        return statusComplete && !hasRequiredAlerts;
    }, this);
}

module.exports = UserJobTitle;

// Public Enumeration for the 'statusID' property:
UserJobTitle.status = {
    // Profile is complete and public
    on: 1,
    // Profile cannot be On/public because is incomplete:
    incomplete: 2,
    // User choose to disable (it's supposed to be complete, but disabled by user and will double check before activation)
    off: 3
};
