/**
    Search results returned for service professionals.
**/
'use strict';

var Model = require('./Model');
var PublicUserRating = require('./PublicUserRating');
var PublicUserVerificationsSummary = require('./PublicUserVerificationsSummary');
var PublicUserStats = require('./PublicUserStats');
var PublicUserJobStats = require('./PublicUserJobStats');
var ko = require('knockout');

function ServiceProfessionalSearchResult(values) {

    Model(this);

    this.model.defProperties({
        userID: 0,
        jobTitleID: 0,
        firstName: '',
        lastName: '',
        lastInitial: '',
        publicBio: '',
        businessName: '',
        instantBooking: '',
        jobTitleNameSingular: '',
        otherJobTitles: '',
        allJobTitles: '',
        distance: 0.0,
        rating: { Model: PublicUserRating },
        verificationsSummary: { Model: PublicUserVerificationsSummary },
        stats: { Model: PublicUserStats },
        jobStats: { Model: PublicUserJobStats },
        photoUrl: ''
    }, values);

    var valueAsBoolean = function(a) { return !!a; };
    this.fullName = ko.pureComputed(function() {
        return [this.firstName(), this.lastName()].filter(valueAsBoolean).join(' ');
    }, this);
}

module.exports = ServiceProfessionalSearchResult;
