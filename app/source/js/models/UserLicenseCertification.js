/** UserLicenseCertification model **/
'use strict';

var Model = require('./Model');
var LicenseCertification = require('./LicenseCertification');

function UserLicenseCertification(values) {

    Model(this);
    
    this.model.defProperties({        
        userLicenseCertificationID: 0,
        userID: 0,
        jobTitleID: 0,
        licenseCertificationID: 0,
        statusID: 0,
        licenseCertificationNumber: '',
        licenseCertificationUrl: '',
        expirationDate: null,
        issueDate: null,
        firstName: null,
        lastName: null,
        middleInitial: null,
        secondLastName: null,
        businessName: null,
        comments: null,
        verifiedBy: null,
        lastVerifiedDate: null,
        submitDate: null, // Autofilled by server
        submittedBy: null,
        submittedImageLocalURL: null,
        status: null,
        statusDescription: null,
                
        licenseCertification: new LicenseCertification(),
        // Additional local data:
        // path to local photo file, unsaved/not-uploaded still.
        localTempFilePath: null
    }, values);
    
    this.model.defID(['userID', 'jobTitleID', 'licenseCertificationID']);
}

module.exports = UserLicenseCertification;
