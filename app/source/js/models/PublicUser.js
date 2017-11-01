/**
    Collection of public information from a user,
    holded on different models

    TODO: Some fields introduced to help the ServiceProfessionalInfo component, but may require refactor
**/
'use strict';

var ko = require('knockout');
var Model = require('./Model');
var PublicUserProfile = require('./PublicUserProfile');
var PublicUserRating = require('./PublicUserRating');
var PublicUserVerificationsSummary = require('./PublicUserVerificationsSummary');
var PublicUserJobTitle = require('./PublicUserJobTitle');
var PublicUserStats = require('./PublicUserStats');
var UserEducation = require('./UserEducation');
var UserVerification = require('./UserVerification');
var UserWeeklySchedule = require('./WeeklySchedule');
var UserSchedulingPreferences = require('./SchedulingPreferences');

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
        stats: { Model: PublicUserStats },
        education: {
            Model: UserEducation,
            isArray: true
        },
        verifications: {
            Model: UserVerification,
            isArray: true
        },
        // TODO To implement on server, REST API
        backgroundCheckPassed: null, // null, true, false
        // Utility data for ServiceProfessionalInfo; used to at /listing
        selectedJobTitleID: null,
        isClientFavorite: false,
        weeklySchedule: { Model: UserWeeklySchedule },
        schedulingPreferences: { Model: UserSchedulingPreferences }
    }, values);

    // Utilities for ServiceProfessionalInfo; used to at /listing
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

    // Utilities for /listing
    /**
        Get an array of the non-selected job titles.
    **/
    this.otherJobTitles = ko.pureComputed(function() {
        var jid = this.selectedJobTitleID();
        var jp = this.jobProfile();
        return jp.filter(function(jt) {
            return jt.jobTitleID() !== jid;
        });
    }, this);
    this.otherJobTitleNames = ko.pureComputed(function() {
        return this.otherJobTitles().map(function(jd) {
            return jd.jobTitleSingularName();
        }).join(', ');
    }, this);
}

module.exports = PublicUser;
