/** UserLicenseCertification model **/
'use strict';

var Model = require('./Model'),
    ko = require('knockout');

function UserLicenseCertification(values) {

    Model(this);
    
    this.model.defProperties({
        userID: 0,
        jobTitleID: 0,
        statusID: 0,
        licenseCertificationID: 0,
        licenseCertificationUrl: '',
        licenseCertificationNumber: 0,
        licenseCertificationStatus: 0,
        expirationDate: null,
        issueDate: null,
        countryID: 0,
        stateProvinceID: 0,
        countyID: 0,
        city: '',
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
    }, values);
    
    this.model.defID(['userID', 'jobTitleID', 'licenseCertificationID']);
    
    this.countyName = ko.pureComputed(function() {
        // TODO Implement look-up of counties, a hardly cached version must exists ever
        return 'Alameda';
    }, this);
    this.stateProvinceName = ko.pureComputed(function() {
        // TODO Implement look-up, a hardly cached version must exists ever
        return 'California';
    }, this);
    this.stateProvinceCode = ko.pureComputed(function() {
        // TODO Implement look-up, a hardly cached version must exists ever
        return 'CA';
    }, this);
}

module.exports = UserLicenseCertification;
