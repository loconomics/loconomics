/**
    Public information from a user.
**/
'use strict';

var Model = require('./Model'),
    ko = require('knockout');

function PublicUserProfile(values) {
    
    Model(this);
    
    this.model.defProperties({
        userID: 0,
        firstName: 0,
        lastName: 0,
        secondLastName: 0,
        businessName: 0,
        publicBio: 0,
        serviceProfessionalProfileUrlSlug: null,
        serviceProfessionalWebsiteUrl: null,
        serviceProfessionalProfileUrl: null, // Server side generated
        photoUrl: null,
        email: null,
        phone: null,
        isServiceProfessional: false,
        isClient: false,
        timeZone: null,
        updatedDate: null
    }, values);
    
    this.fullName = ko.pureComputed(function() {
        var nameParts = [this.firstName()];
        if (this.lastName())
            nameParts.push(this.lastName());
        if (this.secondLastName())
            nameParts.push(this.secondLastName);
        
        return nameParts.join(' ');
    }, this);
    
    this.firstNameLastInitial = ko.pureComputed(function() {
        var nameParts = [this.firstName()];
        if (this.lastName())
            nameParts.push(this.lastName().substring(0, 1) + '.');
        if (this.secondLastName())
            nameParts.push(this.secondLastName().substring(0, 1) + '.');
        
        return nameParts.join(' ');
    }, this);
    
    
    // The businessName or the fullName; it's the best choice to expose a service-professional name
    this.publicName = ko.pureComputed(function() {
        var b = this.businessName();
        if (b) return b;
        return this.fullName();
    }, this);
}

module.exports = PublicUserProfile;
