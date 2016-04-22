/** JobTitleMunicipalLicense model **/
'use strict';

var Model = require('./Model');
var LicenseCertification = require('./LicenseCertification');

function JobTitleMunicipalLicense(values) {

    Model(this);
    
    this.model.defProperties({
        jobTitleID: 0,
        licenseCertificationID: 0,
        required: 0,
        municipalityID: 0,
        municipalityName: '',
        languageID: 0,
        
        licenseCertification: new LicenseCertification()
    }, values);
}

module.exports = JobTitleMunicipalLicense;
