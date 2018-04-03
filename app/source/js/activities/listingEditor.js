/**
    Listing Editor activity
    TO-DO: create components and combine with listing activity
    Visualizes a listing of a user, or current user
**/
'use strict';

import { byListing as badgesByListing, expandUserBadges } from '../data/userBadges';
import UserJobTitle from '../models/UserJobTitle';
import { item as userListingItem } from '../data/userListings';

var ko = require('knockout');
var $ = require('jquery');
var Activity = require('../components/Activity');
var PublicUser = require('../models/PublicUser');
var user = require('../data/userProfile').data;
var users = require('../data/users');
var PublicUserJobTitle = require('../models/PublicUserJobTitle');
var showConfirm = require('../modals/confirm').show;
var showError = require('../modals/error').show;
var showNotification = require('../modals/notification').show;
var userLicensesCertifications = require('../data/userLicensesCertifications');
var AlertLink = require('../viewmodels/AlertLink');
require('../kocomponents/badge/viewer');

var A = Activity.extend(function ListingEditorActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.serviceProfessional;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('Your listings', {
        backLink: '/listings' , helpLink: this.viewModel.helpLink
    });
    this.title = ko.pureComputed(function() {
        var user = this.user();
        if (user) {
            return 'Edit your ' + (user.selectedJobTitle() && user.selectedJobTitle().title()) + ' listing';
        }
    }, this.viewModel);

    this.registerHandler({
        event: 'layoutUpdate',
        target: $(window),
        handler: function() {
            this.viewModel.refreshTs(new Date());
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.loadData = function(jobTitleID) {
    this.viewModel.reset();
    if (user.userID()) {
        this.viewModel.isLoading(true);
        users.getUser(user.userID(), { includeFullJobTitleID: -1 })
        .then(function(data) {
            var pu = new PublicUser(data);
            this.viewModel.user(pu);
            if (!jobTitleID)
                return pu.jobProfile() && pu.jobProfile()[0] && pu.jobProfile()[0].jobTitleID();
            else
                return jobTitleID;
        }.bind(this))
        .then(function(jobTitleID) {
            // For service professionals:
            if (jobTitleID) {
                ////////////
                // User Job Title
                userListingItem(jobTitleID).onceLoaded()
                .then((listing) => {
                    // Fill the job title record
                    this.viewModel.listingTitle(listing.title);
                    this.viewModel.userJobTitle(new UserJobTitle(listing));
                    // Load badges
                    return badgesByListing(listing.userListingID)
                    .onceLoaded()
                    .then(expandUserBadges)
                    .then(this.viewModel.userBadges);
                })
                .catch(function(error) {
                    showError({
                        title: 'There was an error loading your listing.',
                        error
                    });
                });
                ////////////
                // Submitted Licenses
                userLicensesCertifications.getList(jobTitleID)
                .then(function(list) {
                    // Save for use in the view
                    this.viewModel.submittedUserLicensesCertifications(userLicensesCertifications.asModel(list));
                }.bind(this))
                .catch(function (err) {
                    showError({
                        title: 'There was an error while loading.',
                        error: err
                    });
                });
                ////////////
                // Active title
                this.viewModel.user().selectedJobTitleID(jobTitleID);
            }
        }.bind(this))
        .catch(function(err) {
            showError({ error: err, title: 'The user profile could not be loaded.' });
        }.bind(this))
        .then(function() {
            // always
            this.viewModel.isLoading(false);
        }.bind(this));
    }
};

/**
    Parameters: /{jobTitleID:int}
    Both are optional.
    If not jobTitleID, the first one is returned
**/
A.prototype.show = function show(options) {
    // reset
    this.viewModel.listingTitle('Job Title');

    Activity.prototype.show.call(this, options);

    var params = options.route && options.route.segments;
    var jobTitleID = params[0] |0;
    this.loadData(jobTitleID);
    this.viewModel.refreshTs(new Date());
    this.viewModel.jobTitleID(jobTitleID);
};

function ViewModel(app) {
    /* eslint max-statements:"off" */
    this.helpLink = '/help/relatedArticles/202034083-managing-your-marketplace-profile';
    this.isLoading = ko.observable(false);
    this.user = ko.observable(null);
    this.jobTitleID = ko.observable(0);
    this.userJobTitle = ko.observable(null);
    this.userBadges = ko.observableArray([]);

    this.listingTitle = ko.observable();

    this.timeZone = ko.pureComputed(function(){
        var tz = this.user() && this.user().weeklySchedule() && this.user().weeklySchedule().timeZone();
        return tz && tz.replace('US/', '') || '';
    }, this);

    this.returnLinkGeneralActivity = ko.pureComputed(function(){
        return this.user() && this.selectedJobTitle() && '?mustReturn=listingEditor/' + this.selectedJobTitle().jobTitleID() + '&returnText=Edit listing';
    }, this);

    /**
     * Generates the final path to link a jobTitleID based URL, adding parameters
     * for the 'return back' link so points to this activity with proper labeling.
     * @member {KnockoutComputed<string>}
     */
    this.returnLinkJobTitleActivity = ko.pureComputed(function(){
        const jobTitleID = this.user() && this.selectedJobTitle() && this.selectedJobTitle().jobTitleID();
        return jobTitleID ? `${jobTitleID}?mustReturn=listingEditor/${jobTitleID}&returnText=${encodeURIComponent('Edit listing')}` : '';
    }, this);

     /// Related models information
     this.submittedUserLicensesCertifications = ko.observableArray([]);

    // Just a timestamp to notice that a request to refresh UI happens
    // Is updated on 'show' and layoutUpdate (when inside this UI) currently
    // just to notify app-address-map elements
    this.refreshTs = ko.observable(new Date());

    this.reset = function() {
        this.user(null);
    };

    /// Work Photos utils
    var DEFAULT_WORKPHOTOS_LIMIT = 2;
    this.isShowingAllPhotos = ko.observable(false);
    this.workPhotos = ko.pureComputed(function() {
        var u = this.user();
        var ph = u && u.selectedJobTitle() && u.selectedJobTitle().workPhotos();
        if (!ph) {
            return [];
        }
        else if (this.isShowingAllPhotos()) {
            return ph;
        }
        else {
            // Filter by 2 first photos:
            var firsts = [];
            ph.some(function(p, i) {
                if (i > DEFAULT_WORKPHOTOS_LIMIT - 1)
                    return true;
                firsts.push(p);
            });
            return firsts;
        }
    }, this);
    this.viewMoreWorkPhotosLabel = ko.pureComputed(function() {
        var imgCount = this.user() && this.user().selectedJobTitle() && this.user().selectedJobTitle().workPhotos();
        imgCount = imgCount && imgCount.length || 0;
        if (this.isShowingAllPhotos() || imgCount === 0 || imgCount <= DEFAULT_WORKPHOTOS_LIMIT)
            return '';
        else
            return 'View all ' + imgCount + ' images';
    }, this);
    this.viewAllPhotos = function() {
        this.isShowingAllPhotos(true);
    }.bind(this);

    /// Addresses
    this.serviceAddresses = ko.pureComputed(function() {
        var u = this.user();
        var adds = u && u.selectedJobTitle() && u.selectedJobTitle().serviceAddresses();
        return adds || [];
    }, this);

    this.changeJobTitle = function(jobTitle, event) {
        this.user().selectedJobTitleID(jobTitle.jobTitleID());
        if (event) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
        var url = event.target.getAttribute('href');
        app.shell.pushState(null, null, url);
    }.bind(this);

    /// Social links
    this.getEmailLink = ko.pureComputed(function() {
        var u = this.user();
        if (!u) return '';
        var url = encodeURIComponent(u.profile().serviceProfessionalProfileUrl());
        return 'mailto:?body=' + encodeURIComponent(u.profile().fullName() + ': ') + url;
    }, this);
    this.getFacebookLink = ko.pureComputed(function() {
        var u = this.user();
        if (!u) return '';
        var url = encodeURIComponent(u.profile().serviceProfessionalProfileUrl());
        return 'http://www.facebook.com/share.php?u=' + url + '&t=' + encodeURIComponent(u.profile().fullName());
    }, this);
    this.getTwitterLink = ko.pureComputed(function() {
        var u = this.user();
        if (!u) return '';
        var url = encodeURIComponent(u.profile().serviceProfessionalProfileUrl());
        return 'http://twitter.com/intent/tweet?text=' + encodeURIComponent(u.profile().fullName() + ': ' + url);
    }, this);
    this.getGooglePlusLink = ko.pureComputed(function() {
        var u = this.user();
        if (!u) return '';
        var url = encodeURIComponent(u.profile().serviceProfessionalProfileUrl());
        return 'https://plus.google.com/share?url=' + url;
    }, this);
    this.getPinterestLink = ko.pureComputed(function() {
        var u = this.user();
        if (!u) return '';
        var url = encodeURIComponent(u.profile().serviceProfessionalProfileUrl());
        var photo = encodeURIComponent(u.profile().photoUrl());
        return 'http://pinterest.com/pin/create/button/?url=' + url + '&media=' + photo + '&description=' + encodeURIComponent(u.profile().fullName() + ': ' + url);
    }, this);

    this.getBookLink = ko.pureComputed(function() {
        var u = this.user();
        if (!u) return '';
        return '#!booking/' + u.profile().userID() + '/' + u.selectedJobTitleID();
    }, this);
    this.getSendMessageLink = ko.pureComputed(function() {
        var u = this.user();
        if (!u) return '';
        return '#!inbox/new/' + u.profile().userID();
    }, this);

    this.hasServicesOverview = ko.pureComputed(function() {
        var jobTitle = this.user() && this.user().selectedJobTitle();
        var hasIntro = jobTitle && jobTitle.hasIntro();
        var hasAttributes = jobTitle && jobTitle.serviceAttributes().hasAttributes();
        return hasIntro || hasAttributes;
    }, this);

    this.selectedJobTitle = ko.pureComputed(function() {
        return (this.user() && this.user().selectedJobTitle()) || new PublicUserJobTitle();
    }, this);

    this.deleteJobTitle = function() {
        var jid = this.jobTitleID();
        var jname = this.listingTitle();
        if (jid) {
            showConfirm({
                title: 'Delete ' + jname + ' listing',
                message: 'Are you sure you really want to delete your ' + jname +' listing?',
                yes: 'Delete',
                no: 'Keep'
            })
            .then(() => userListingItem(jid).delete())
            .then(() => app.shell.go('/listings'))
            .catch(function(err) {
                if (err) {
                    showError({ error: err, title: 'Error while deleting your listing' });
                }
            });
        }
    }.bind(this);

    var UserJobTitle = require('../models/UserJobTitle');

    this.isToggleReady = ko.pureComputed(function() {
        return this.userJobTitle() && this.userJobTitle().isComplete();
    }, this);

    this.isActiveStatus = ko.pureComputed({
        read: function() {
            var j = this.userJobTitle();
            return j && j.statusID() === UserJobTitle.status.on || false;
        },
        write: function(v) {
            var status = this.userJobTitle() && this.userJobTitle().statusID();
            if (v === true && status === UserJobTitle.status.off) {
                this.userJobTitle().statusID(UserJobTitle.status.on);
                // Push change to back-end
                userListingItem(this.jobTitleID()).reactivate()
                .catch(function(err) {
                    showError({ title: 'Error enabling your listing', error: err });
                });
            }
            else if (v === false && status === UserJobTitle.status.on) {
                this.userJobTitle().statusID(UserJobTitle.status.off);
                // Push change to back-end
                userListingItem(this.jobTitleID()).deactivate()
                .catch(function(err) {
                    showError({ title: 'Error disabling your listing', error: err });
                });
                // Per #1001, notify user about availability of bookMeNow button even with public marketplace profile
                // disabled/hidden
                showNotification({
                    message: 'Clients will no longer be able to find you in the marketplace. However, any "book me now" links you have posted will still be active.',
                    buttonText: 'Got it!'
                });
            }
        },
        owner: this
    });

    this.statusLabel = ko.pureComputed(function() {
        var statusID = this.userJobTitle() && this.userJobTitle().statusID();
        switch (statusID) {
            case UserJobTitle.status.on:
                return 'This listing is active';
            case UserJobTitle.status.off:
                return 'This listing is inactive';
            //case UserJobTitle.status.incomplete:
            default:
                return "You're almost there!";
        }
    }, this);
    this.requiredAlertLinks = ko.pureComputed(function() {
        var userJobTitle = this.userJobTitle();
        var jobTitleID = userJobTitle && userJobTitle.jobTitleID();
        var requiredAlerts = (userJobTitle && userJobTitle.requiredAlerts()) || [];

        return requiredAlerts.map(function(profileAlert) {
            return AlertLink.fromProfileAlert(profileAlert, { jobTitleID: jobTitleID });
        });
    }, this);

    /**
     * Returns a URL to where to edit the badge assigned to the user, with a return
     * link to the listing editor.
     * @param {rest/UserBadge} userBadge record for a badge assigned to a user (AKA 'assertion' in OpenBadges naming)
     * @returns {string}
     */
    this.getBadgeEditURL = (userBadge) => {
        if (userBadge.createdBy !== 'user') return null;
        else return `/badge-edit/${userBadge.userBadgeID}?jobTitleID=${this.jobTitleID()}&mustReturn=listingEditor/${this.jobTitleID()}&returnText=${encodeURIComponent('Listing Editor')}`;
    };

    /**
     * Returns a URL to where to view details of the badge assigned to the user, with a return
     * link to the listing editor.
     * @param {OpenBadgesV2/Assertion} assertion data for an assertion
     * @returns {string}
     */
    this.getBadgeDetailsURL = (assertion) => `/badge-view/${encodeURIComponent(assertion.id)}?mustReturn=listingEditor/${this.jobTitleID()}&returnText=${encodeURIComponent('Listing Editor')}`;
}
