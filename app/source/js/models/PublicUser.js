/**
    Collection of public information from a user,
    holded on different models
    
    TODO: Some fields introduced to help the ServiceProfessionalInfo component, but may require refactor
**/
'use strict';

var Model = require('./Model'),
    PublicUserProfile = require('./PublicUserProfile'),
    PublicUserRating = require('./PublicUserRating'),
    PublicUserVerificationsSummary = require('./PublicUserVerificationsSummary'),
    PublicUserJobTitle = require('./PublicUserJobTitle'),
    ko = require('knockout');

function PublicUser(values) {
    
    Model(this);
    
    this.model.defProperties({
        profile: { Model: PublicUserProfile },
        rating: { Model: PublicUserRating },
        verificationsSummary: { Model: PublicUserVerificationsSummary },
        jobProfile: {
            Model: PublicUserJobTitle,
            isArray: true
        },
        // TODO To implement on server, REST API
        backgroundCheckPassed: null, // null, true, false
        // Utility data for ServiceProfessionalInfo
        selectedJobTitleID: null,
        isClientFavorite: false
    }, values);
    
    // Utilities for ServiceProfessionalInfo
    this.selectedJobTitle = ko.pureComputed(function() {
        var jid = this.selectedJobTitleID(),
            jp = this.jobProfile();
        if (!jid || !jp) return null;
        var found = null;
        jp.some(function(jobTitle) {
            if (jobTitle.jobTitleID() === jid) {
                found = jobTitle;
                return true;
            }
        });
        return found;
    }, this);
    
    this.backgroundCheckLabel = ko.pureComputed(function() {
        var v = this.backgroundCheckPassed();
        if (v === true) return 'OK';
        else if (v === false) return 'FAILED';
        else return '';
    }, this);
}

module.exports = PublicUser;
