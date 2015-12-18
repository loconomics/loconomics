/**
    Public User Reviews Model
**/
'use strict';

var Model = require('./Model');

function PublicUserReview(values) {
    Model(this);

    this.model.defProperties({
        bookingID: 0,
        jobTitleID: 0,
        reviewedUserID: 0,
        reviewerUserID: 0,
        reviewerUserSince: null,
        rating1: null,
        rating2: null,
        rating3: null,
        publicReview: '',
        serviceHours: null,
        helpfulReviewCount: 0,
        updatedDate: null,
        reviewerName: ''
    }, values);
}

module.exports = PublicUserReview;
