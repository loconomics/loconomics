/** UserLicenseCertification model **/
'use strict';

var Model = require('./Model'),
    ko = require('knockout'),
    Verification = require('./Verification'),
    LicenseCertification = require('../models/LicenseCertification');

function UserLicenseCertification(values) {

    Model(this);
    
    this.model.defProperties({
        userID: 0,
        jobTitleID: 0,
        statusID: 0,
        licenseCertificationID: 0,
        licenseCertificationUrl: '',
        licenseCertificationNumber: '',
        licenseCertificationStatus: '',
        expirationDate: null,
        issueDate: null,
        countryCode: '',
        stateProvinceCode: null,
        stateProvinceName: null,
        countyName: null,
        city: null,
        firstName: null,
        lastName: null,
        middleInitial: null,
        secondLastName: null,
        businessName: null,
        actions: null,
        comments: null,
        verifiedBy: null,
        lastVerifiedDate: null,
        createdDate: null, // Autofilled by server
        updatedDate: null, // Autofilled by server
        
        licenseCertification: new LicenseCertification(),
        
        // Additional local data:
        // path to local photo file, unsaved/not-uploaded still.
        localTempFilePath: null
    }, values);
    
    this.model.defID(['userID', 'jobTitleID', 'licenseCertificationID']);
    
    // TODO statusText and isStatus copied from verifications, dedupe/refactor
    this.statusText = ko.pureComputed(function() {
        // L18N
        var statusTextsenUS = {
            'verification.status.confirmed': 'Confirmed',
            'verification.status.pending': 'Pending',
            'verification.status.revoked': 'Revoked',
            'verification.status.obsolete': 'Obsolete'
        };
        var statusCode = Verification.getStatusName(this.statusID());
        return statusTextsenUS['verification.status.' + statusCode];
    }, this);

    /**
        Check if verification has a given status by name
    **/
    this.isStatus = function (statusName) {
        var id = this.statusID();
        return Verification.status[statusName] === id;
    };
}

module.exports = UserLicenseCertification;
