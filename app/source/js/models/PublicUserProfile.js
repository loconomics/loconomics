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
}

module.exports = PublicUserProfile;
