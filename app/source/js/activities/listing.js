/**
    Listing Editor activity
    TO-DO: create components and combine with listing activity
    Visualizes a listing of a user, or current user
**/
'use strict';

var ko = require('knockout');
var $ = require('jquery');
var Activity = require('../components/Activity');
var PublicUser = require('../models/PublicUser');
var user = require('../data/userProfile').data;
var users = require('../data/users');
var MessageBar = require('../components/MessageBar');
var PublicUserJobTitle = require('../models/PublicUserJobTitle');
var ReviewsVM = require('../viewmodels/ReviewsVM');
var showError = require('../modals/error').show;

var A = Activity.extend(function ListingActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = null;
    this.viewModel = new ViewModel(this.app);
    // null for logo
    this.navBar = Activity.createSectionNavBar(null);
    this.title = ko.pureComputed(function() {
        var user = this.user();
        if (user) {
            return user.profile().firstNameLastInitial() + ', ' + (user.selectedJobTitle() && user.selectedJobTitle().jobTitleSingularName());
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

A.prototype.loadData = function(userID, jobTitleID) {
    this.viewModel.reset();
    if (userID) {
        this.viewModel.isLoading(true);
        users.getUser(userID, { includeFullJobTitleID: -1 })
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
                this.viewModel.user().selectedJobTitleID(jobTitleID);
                // Load extra job data (reviews)
                this.viewModel.reviews.load({ limit: 2 });
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
    Parameters: /{userID:int}/{jobTitleID:int}
    Both are optional.
    If no userID, the current user profile is showed
    If not jobTitleID, the first one is returned
**/
A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);

    var params = options.route && options.route.segments;
    // Get requested userID or the current user profile
    var userID = (params[0] |0) || user.userID();
    var jobTitleID = params[1] |0;
    this.loadData(userID, jobTitleID);
    this.viewModel.reviews.reset(userID, jobTitleID);
    this.viewModel.refreshTs(new Date());
    this.viewModel.userID(userID);
    this.viewModel.showMessageBar(true);
};

A.prototype.hide = function() {
    Activity.prototype.hide.call(this);

    this.viewModel.showMessageBar(false);
};


function ViewModel(app) {
    /* eslint max-statements:"off" */
    this.isLoading = ko.observable(false);
    this.user = ko.observable(null);
    this.userID = ko.observable(null);
    this.reviews = new ReviewsVM();
    this.showMessageBar = ko.observable(false);
    this.timeZone = ko.pureComputed(function(){
        var tz = this.user() && this.user().weeklySchedule() && this.user().weeklySchedule().timeZone();
        return tz && tz.replace('US/', '') || '';
    }, this);

    // Just a timestamp to notice that a request to refresh UI happens
    // Is updated on 'show' and layoutUpdate (when inside this UI) currently
    // just to notify app-address-map elements
    this.refreshTs = ko.observable(new Date());

    this.reset = function() {
        this.user(null);
        this.userID(null);
        this.showMessageBar(false);
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
        this.reviews.reset(undefined, jobTitle.jobTitleID());
        this.reviews.load({ limit: 2 });
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

    this.hasVIPOfferingsForClient = ko.pureComputed(function(){
        return this.selectedJobTitle() && this.selectedJobTitle().clientSpecificServices().length;
    }, this);

    this.hasCredentials = ko.pureComputed(function(){
        var hasEducation = this.user() && this.user().education().length;
        var hasLicenseCertification = this.selectedJobTitle() && this.selectedJobTitle().licensesCertifications().length;
        return hasEducation || hasLicenseCertification;
    }, this);

    this.jobTitleSingularName = ko.pureComputed(function() {
        return this.selectedJobTitle().jobTitleSingularName();
    }, this);

    this.selectedJobTitle = ko.pureComputed(function() {
        return (this.user() && this.user().selectedJobTitle()) || new PublicUserJobTitle();
    }, this);

    this.editListing = function() {
        app.shell.go('/listingEditor/' + this.selectedJobTitle().jobTitleID());
    }.bind(this);

    this.listingIsActive = ko.pureComputed(function() {
        return this.selectedJobTitle().isActive();
    }, this);

    this.isOwnProfile = ko.pureComputed(function() {
        var profileOwnerUserID = this.userID();

        if(user.isAnonymous() || profileOwnerUserID === null) {
            return false;
        }
        else {
            return profileOwnerUserID == user.userID();
        }
    }, this);

    this.isMessageBarVisible = ko.pureComputed(function() {
        return this.isOwnProfile() && this.showMessageBar();
    }, this);

    this.messageBarTone = ko.pureComputed(function() {
        return this.listingIsActive() ? MessageBar.tones.success : MessageBar.tones.warning;
    }, this);
}
