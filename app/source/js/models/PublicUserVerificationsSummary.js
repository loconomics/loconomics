/**
    Number of verifications and grouped counts.
**/
'use strict';

var Model = require('./Model'),
    PublicUserVerificationsGroup = require('./PublicUserVerificationsGroup');

function PublicUserVerificationsSummary(values) {
    
    Model(this);
    
    this.model.defProperties({
        total: 0,
        groups: PublicUserVerificationsGroup
    }, values);
}

module.exports = PublicUserVerificationsSummary;
