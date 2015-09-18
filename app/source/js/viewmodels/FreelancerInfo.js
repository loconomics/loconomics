/**
    FreelancerInfo component, shows public information
    about a freelancer in a short card.
**/
'use strict';

var Model = require('../models/Model'),
    UserJobTitle = require('../models/UserJobTitle'),
    ko = require('knockout');

function FreelancerInfoVW(values) {
    Model(this);

    this.model.defProperties({
        freelancerID: 0,
        jobTitleID: 0,
        modClasses: 0,
        profile: {
            Model: UserPublicProfile
        },
        jobTitle: {
            Model: UserJobTitle
        },
        siteUrl: ''
    }, values);

    this.photoUrl = ko.pureComputed(function() {
        return this.siteUrl() + '/en-US/Profile/Photo/' + this.freelancerID();
    }, this);
}

module.exports = FreelancerInfoVM;

function UserPublicProfile(values) {
    Model(this);

    this.model.defProperties({
        firstName: '',
        lastName: '',
        secondLastName: '',
        businessName: '',

        hasPhotoUrl: false,
        isFreelancer: false
    }, values);

    this.fullName = ko.pureComputed(function() {
        var nameParts = [this.firstName()];
        if (this.lastName())
            nameParts.push(this.lastName());
        if (this.secondLastName())
            nameParts.push(this.secondLastName);
        
        return nameParts.join(' ');
    }, this);
};
