/** LicenseCertification model **/
'use strict';

var Model = require('./Model');

function LicenseCertification(values) {

    Model(this);
    
    this.model.defProperties({
        licenseCertificationID: 0,
        name: '',
        stateProvinceID: 0,
        countryID: 0,
        description: null,
        authority: null,
        verificationWebsiteUrl: null,
        howToGetLicensedUrl: null,
        optionGroup: null,
        createdDate: null, // Autofilled by server
        updatedDate: null, // Autofilled by server
    }, values);
    
    this.model.defID(['licenseCertificationID']);
}

module.exports = LicenseCertification;
