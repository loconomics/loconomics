/**
    Provile activity
    
    Visualizes the public profile of a user, or current user
**/
'use strict';

var ko = require('knockout');
var $ = require('jquery');
var Activity = require('../components/Activity');
var PublicUser = require('../models/PublicUser');

var A = Activity.extend(function ProfileActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = null;
    this.viewModel = new ViewModel(this.app);
    // null for logo
    this.navBar = Activity.createSectionNavBar(null);
    
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
        this.app.model.users.getUser(userID, { includeFullJobTitleID: -1 })
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
            this.app.modals.showError({ error: err, title: 'The user profile could not be loaded.' });
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
    var userID = (params[0] |0) || this.app.model.user().userID();
    var jobTitleID = params[1] |0;
    this.loadData(userID, jobTitleID);
    this.viewModel.reviews.reset(userID, jobTitleID);
    this.viewModel.refreshTs(new Date());
};

function ViewModel(app) {
    this.isLoading = ko.observable(false);
    this.user = ko.observable(null);
    this.reviews = new ReviewsVM(app);
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
}

var PublicUserReview = require('../models/PublicUserReview');
function ReviewsVM(app) {
    this.userID = ko.observable(null);
    this.jobTitleID = ko.observable(null);
    this.list = ko.observableArray([]);
    this.isLoading = ko.observable(false);
    this.endReached = ko.observable(false);
    var currentXhr = null;

    this.reset = function reset(userID, jobTitleID) {
        this.list([]);
        if (userID)
            this.userID(userID);
        this.jobTitleID(jobTitleID);
        this.endReached(false);
        if (currentXhr && currentXhr.abort) {
            currentXhr.abort();
        }
    };

    this.load = function loadReviews(options) {
        options = options || {};
        if (this.isLoading() || this.endReached() || !this.userID()) return;
        this.isLoading(true);
        var task = app.model.users.getReviews(this.userID(), this.jobTitleID(), options)
        .then(function(newData) {
            //jshint maxcomplexity:8
            if (newData && newData.length) {
                if (newData.length < (options.limit || 20)) {
                    this.endReached(true);
                }
                // convert the newData to Model instances
                newData = newData.map(function(d) { return new PublicUserReview(d); });
                var list = this.list();
                if (options.since && options.until) {
                    // Insert in the middle
                    // TODO Unused situation right now, not supported in the UI
                    throw new Error('UNSUPPORTED SET-UP: since and until parameters at the same time');
                }
                else if (options.since) {
                    // We 'suppose' that a 'since' request from the previous first item (descending order) was performed
                    // so we add the newData to the beggining of the list
                    list = newData.concat.apply(newData, list);
                }
                else if (options.until) {
                    // We 'suppose' that an 'until' request from the previous last item  (descending order) was performed
                    // so we add the newData to the ending of the list
                    list.push.apply(list, newData);
                }
                else {
                    // Just new, to replace, data
                    list = newData;
                }
                this.list(list);
            }
            else {
                this.endReached(true);
            }
            this.isLoading(false);
            currentXhr = null;
        }.bind(this))
        .catch(function(err) {
            this.isLoading(false);
            currentXhr = null;
            if (err && err.statusText !== 'abort') {
                console.error('Error loading user reviews', err);
                throw err;
            }
        }.bind(this));
        currentXhr = task.xhr;
        return task;
    }.bind(this);
    
    this.loadOlder = function loadOlderReviews() {
        var l = this.list();
        var last = l[l.length - 1];
        return this.load({ limit: 10, until: last && last.updatedDate() });
    }.bind(this);

    this.loadNewer = function loadOlderReviews() {
        var first = this.list()[0];
        return this.load({ limit: 10, since: first && first.updatedDate() });
    }.bind(this);
}
