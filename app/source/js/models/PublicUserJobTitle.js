/**
    PublicUserJobTitle model, relationship between an user and a
    job title and the main data attached to that relation for
    public access (internal fields avoided) and additional
    useful job title info (shortcut to job title names for convenience).
    
    The model has optional properties that link
    to other model information related to a specific jobTitle
    for convenience when querying a wider set of information
    and keep it organized under this model instances.
**/
'use strict';

var Model = require('./Model'),
    PublicUserRating = require('./PublicUserRating'),
    PublicUserVerificationsSummary = require('./PublicUserVerificationsSummary');

function PublicUserJobTitle(values) {
    
    Model(this);
    
    this.model.defProperties({
        userID: 0,
        jobTitleID: 0,
        intro: null,
        cancellationPolicyID: 0,
        instantBooking: false,
        jobTitleSingularName: '',
        jobTitlePluralName: '',
        
        rating: { Model: PublicUserRating },
        verificationsSummary: { Model: PublicUserVerificationsSummary },
    }, values);

    this.model.defID(['userID', 'jobTitleID']);
}

module.exports = PublicUserJobTitle;
