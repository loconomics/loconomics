/** PublicUserLicenseCertification model **/
'use strict';

var Model = require('./Model');
var LicenseCertification = require('./LicenseCertification');

function PublicUserLicenseCertification(values) {

    Model(this);
    
    this.model.defProperties({  
        userID: 0,
        jobTitleID: 0,
        licenseCertificationID: 0,
        licenseCertificationNumber: '',
        licenseCertificationUrl: '',
        expirationDate: null,
        firstName: null,
        lastName: null,
        middleInitial: null,
        businessName: null,
        statusID: 0,
        status: null,
        statusDescription: null,
        lastVerifiedDate: null,
                
        licenseCertification: new LicenseCertification()
    }, values);
    
    this.model.defID(['userID', 'jobTitleID', 'licenseCertificationID']);
}

module.exports = PublicUserLicenseCertification;