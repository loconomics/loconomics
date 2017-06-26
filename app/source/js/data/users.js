/**
 * Query public data on remote from other users in the marketplace.
 * Usually needed for client fetching service professionals data
 * to view profile, book them, etc.
 */
// TODO jsdocs
'use strict';

var GroupRemoteModel = require('./helpers/GroupRemoteModel');
var PublicUserProfile = require('../models/PublicUserProfile');
var remote = require('./drivers/restClient');

/**
    Get the user index/summary information. That includes
    an object with different properties that matches the results
    from other individual APIs, to get in one call information
    like profile, rating, verificationsSummary, jobProfile.
    Usefull to load faster a user public profile, service professional
    information to start a booking process or the user information
    widgets.
**/
exports.getUser = function(userID, options) {
    return remote.get('users/' + (userID |0), options);
};

// IMPORTANT: We need cache for user profiles, since are used to fetch information
// of users attached to thread-messages.
var profile = new GroupRemoteModel({
    ttl: {
        minutes: 10
    },
    Model: PublicUserProfile,
    itemIdField: 'userID'
});
profile.addRestSupport(remote, 'users/', '/profile');
profile.addLocalforageSupport('userProfiles/');
exports.getProfile = function(userID) {
    return profile.getItem(userID);
    //return remote.get('users/' + (userID |0) + '/profile');
};

exports.getJobProfile = function(userID) {
    return remote.get('users/' + (userID |0) + '/job-profile');
};
exports.getJobTitle = function(userID, jobTitleID) {
    return remote.get('users/' + (userID |0) + '/job-profile/' + (jobTitleID |0));
};

var getRatings = function getRatings(modifier, userID) {
    return remote.get('users/' + (userID |0) + '/ratings' + (modifier ? '/' + modifier : ''));
};
exports.getUserRatings = getRatings.bind(exports, null);
exports.getClientRatings = getRatings.bind(exports, 'client');
exports.getServiceProfessionalRatings = getRatings.bind(exports, 'service-professional');
exports.getJobTitleRatings = function(userID, jobTitleID) { return getRatings(jobTitleID |0, userID); };

exports.getServiceAddresses = function(userID, jobTitleID) {
    return remote.get('users/' + (userID |0) + '/service-addresses/' + (jobTitleID |0));
};

exports.getServiceProfessionalServices = function(serviceProfessionalUserID, jobTitleID) {
    return remote.get('users/' + (serviceProfessionalUserID |0) + '/service-professional-services/' + (jobTitleID |0));
};

var getVerificationsSummary = function getVerificationsSummary(modifier, userID) {
    return remote.get('users/' + (userID |0) + '/verifications-summary' + (modifier ? '/' + modifier : ''));
};
exports.getUserVerificationsSummary = getVerificationsSummary.bind(exports, null);
exports.getClientVerificationsSummary = getVerificationsSummary.bind(exports, 'client');
exports.getServiceProfessionalVerificationsSummary = getVerificationsSummary.bind(exports, 'service-professional');
exports.getJobTitleVerificationsSummary = function(userID, jobTitleID) { return getVerificationsSummary(jobTitleID |0, userID); };

exports.getServiceAttributes = function getServiceAttributes(userID, jobTitleID) {
    return remote.get('users/' + (userID |0) + '/service-attributes/' + (jobTitleID |0));
};

/**
    @options:Object {
        limit:int,
        since:Date,
        until:Date
    }
**/
exports.getReviews = function getReviews(userID, jobTitleID, options) {
    return remote.get('users/' + (userID |0) + '/reviews' + (jobTitleID ? '/' + (jobTitleID |0) : ''), options);
};
