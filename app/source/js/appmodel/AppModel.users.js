/**
    Query public data from other users in the marketplace,
    usually client fetching service professionals data
    to view profile, book them, etc.
**/
'use strict';

var GroupRemoteModel = require('../utils/GroupRemoteModel');
var PublicUserProfile = require('../models/PublicUserProfile');

exports.create = function create(appModel) {
    //jshint maxstatements:80
    
    var api = {};

    //appModel.on('clearLocalData', function() {
    //    api.clearCache();
    //});
    
    /**
        Get the user index/summary information. That includes
        an object with different properties that matches the results
        from other individual APIs, to get in one call information
        like profile, rating, verificationsSummary, jobProfile.
        Usefull to load faster a user public profile, service professional
        information to start a booking process or the user information
        widgets.
    **/
    api.getUser = function(userID, options) {
        return appModel.rest.get('users/' + (userID |0), options);
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
    profile.addRestSupport(appModel.rest, 'users/', '/profile');
    profile.addLocalforageSupport('userProfiles/');
    api.getProfile = function(userID) {
        return profile.getItem(userID);
        //return appModel.rest.get('users/' + (userID |0) + '/profile');
    };
    
    api.getJobProfile = function(userID) {
        return appModel.rest.get('users/' + (userID |0) + '/job-profile');
    };
    api.getJobTitle = function(userID, jobTitleID) {
        return appModel.rest.get('users/' + (userID |0) + '/job-profile/' + (jobTitleID |0));
    };
    
    // TODO REMOVE THIS OLD?? REPLACED BY SERVER-SIDE AppModel.availability?
    var getAvailability = function getAvailability(userID, format, query) {
        return appModel.rest.get('users/' + (userID |0) + '/availability/' + format, query);
    };
    api.getAvailabilityPerDate = function(userID, startDate, endDate) {
        return getAvailability(userID, 'dates', { start: startDate, end: endDate });
    };
    api.getAvailabilityInsSlots = function(userID, startDate, endDate) {
        return getAvailability(userID, 'slots', { start: startDate, end: endDate });
    };

    var getRatings = function getRatings(modifier, userID) {
        return appModel.rest.get('users/' + (userID |0) + '/ratings' + (modifier ? '/' + modifier : ''));
    };
    api.getUserRatings = getRatings.bind(api, null);
    api.getClientRatings = getRatings.bind(api, 'client');
    api.getServiceProfessionalRatings = getRatings.bind(api, 'service-professional');
    api.getJobTitleRatings = function(userID, jobTitleID) { return getRatings(jobTitleID |0, userID); };
    
    api.getServiceAddresses = function(userID, jobTitleID) {
        return appModel.rest.get('users/' + (userID |0) + '/service-addresses/' + (jobTitleID |0));
    };

    api.getServiceProfessionalServices = function(serviceProfessionalUserID, jobTitleID) {
        return appModel.rest.get('users/' + (serviceProfessionalUserID |0) + '/service-professional-services/' + (jobTitleID |0));
    };
    
    var getVerificationsSummary = function getVerificationsSummary(modifier, userID) {
        return appModel.rest.get('users/' + (userID |0) + '/verifications-summary' + (modifier ? '/' + modifier : ''));
    };
    api.getUserVerificationsSummary = getVerificationsSummary.bind(api, null);
    api.getClientVerificationsSummary = getVerificationsSummary.bind(api, 'client');
    api.getServiceProfessionalVerificationsSummary = getVerificationsSummary.bind(api, 'service-professional');
    api.getJobTitleVerificationsSummary = function(userID, jobTitleID) { return getVerificationsSummary(jobTitleID |0, userID); };

    api.getServiceAttributes = function getServiceAttributes(userID, jobTitleID) {
        return appModel.rest.get('users/' + (userID |0) + '/service-attributes/' + (jobTitleID |0));
    };
    
    /**
        @options:Object {
            limit:int,
            since:Date,
            until:Date
        }
    **/
    api.getReviews = function getReviews(userID, jobTitleID, options) {
        return appModel.rest.get('users/' + (userID |0) + '/reviews' + (jobTitleID ? '/' + (jobTitleID |0) : ''), options);
    };

    return api;
};