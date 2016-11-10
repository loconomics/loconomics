/**
    Rating values for user, as user, client. service professional
    or job title specific.
**/
'use strict';

var Model = require('./Model');

function PublicUserRating(values) {
    
    Model(this);
    
    this.model.defProperties({
        rating1: 0,
        rating2: 0,
        rating3: 0,
        ratingAverage: 0,
        totalRatings: 0,
        serviceHours: 0,
        lastRatingDate: null
    }, values);
}

module.exports = PublicUserRating;
