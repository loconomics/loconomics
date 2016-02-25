/**
    Search results returned for service professionals.
**/
'use strict';

var Model = require('./Model'),
    PublicUserRating = require('./PublicUserRating'),
    PublicUserVerificationsSummary = require('./PublicUserVerificationsSummary'),
    PublicUserStats = require('./PublicUserStats'),
    PublicUserJobStats = require('./PublicUserJobStats');

function ServiceProfessionalSearchResult(values) {
    
    Model(this);
    
    this.model.defProperties({
        userID: 0,
        firstName: '',
        lastName: '',
        businessName: '',
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
}

module.exports = ServiceProfessionalSearchResult;
