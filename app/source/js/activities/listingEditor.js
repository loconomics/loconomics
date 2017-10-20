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
var PublicUserJobTitle = require('../models/PublicUserJobTitle');
var userJobProfile = require('../data/userJobProfile');
var showConfirm = require('../modals/confirm').show;
var showError = require('../modals/error').show;
var showNotification = require('../modals/notification').show;
var userLicensesCertifications = require('../data/userLicensesCertifications');
var AlertLink = require('../viewmodels/AlertLink');

var A = Activity.extend(function ListingEditorActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.serviceProfessional;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('Your listings', {
        backLink: '/marketplaceProfile' , helpLink: this.viewModel.helpLink
    });
    this.title = ko.pureComputed(function() {
        var user = this.user();
        if (user) {
            return 'Edit your ' + (user.selectedJobTitle() && user.selectedJobTitle().jobTitleSingularName()) + ' listing';
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
                ////////////
                // User Job Title
                // Get data for the Job Title and User Profile
                userJobProfile.getUserJobTitleAndJobTitle(jobTitleID)
                //jobTitles.getJobTitle(jobTitleID)
                .then(function(job) {
                    // Fill the job title record
                    this.viewModel.jobTitle(job.jobTitle);
                    this.viewModel.userJobTitle(job.userJobTitle);
                }.bind(this))
                .catch(function(err) {
                    showError({
                        title: 'There was an error loading your listing.',
                        error: err
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
    this.viewModel.jobTitleID(jobTitleID);
};

function ViewModel(app) {
    //jshint maxstatements:50
    this.helpLink = '/help/relatedArticles/202034083-managing-your-marketplace-profile';
    this.isLoading = ko.observable(false);
    this.user = ko.observable(null);
    this.userID = ko.observable(null);
    this.jobTitleID = ko.observable(0);
    this.jobTitle = ko.observable(null);
    this.userJobTitle = ko.observable(null);

    this.jobTitleName = ko.pureComputed(function() {
        return this.jobTitle() && this.jobTitle().singularName() || 'Job Title';
    }, this);
    this.reviews = new ReviewsVM();

    this.timeZone = ko.pureComputed(function(){
        return this.user() && this.user().weeklySchedule() && this.user().weeklySchedule().timeZone().replace('US/','');
    }, this);

    this.returnLinkGeneralActivity = ko.pureComputed(function(){
        return this.user() && this.selectedJobTitle() && '?mustReturn=listingEditor/' + this.userID() + '/' + this.selectedJobTitle().jobTitleID() + '&returnText=Edit listing';
    }, this);

    this.returnLinkJobTitleActivity = ko.pureComputed(function(){
        return this.user() && this.selectedJobTitle() && this.selectedJobTitle().jobTitleID() + '?mustReturn=listingEditor/' + this.userID() + '/' + this.selectedJobTitle().jobTitleID() + '&returnText=Edit listing';
    }, this);

     /// Related models information
     this.submittedUserLicensesCertifications = ko.observableArray([]);

    // Just a timestamp to notice that a request to refresh UI happens
    // Is updated on 'show' and layoutUpdate (when inside this UI) currently
    // just to notify app-address-map elements
    this.refreshTs = ko.observable(new Date());

    this.reset = function() {
        this.user(null);
        this.userID(null);
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

    this.jobTitleSingularName = ko.pureComputed(function() {
        return this.selectedJobTitle().jobTitleSingularName();
    }, this);

    this.selectedJobTitle = ko.pureComputed(function() {
        return (this.user() && this.user().selectedJobTitle()) || new PublicUserJobTitle();
    }, this);

    this.deleteJobTitle = function() {
        var jid = this.jobTitleID();
        var jname = this.jobTitleName();
        if (jid) {
            showConfirm({
                title: 'Delete ' + jname + ' listing',
                message: 'Are you sure you really want to delete your ' + jname +' listing?',
                yes: 'Delete',
                no: 'Keep'
            }).then(function() {
                app.shell.goBack();
                return userJobProfile.deleteUserJobTitle(jid);
            })
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
                userJobProfile.reactivateUserJobTitle(this.jobTitleID())
                .catch(function(err) {
                    showError({ title: 'Error enabling your listing', error: err });
                });
            }
            else if (v === false && status === UserJobTitle.status.on) {
                this.userJobTitle().statusID(UserJobTitle.status.off);
                // Push change to back-end
                userJobProfile.deactivateUserJobTitle(this.jobTitleID())
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
        var userJobTitle = this.userJobTitle(),
            jobTitleID = userJobTitle && userJobTitle.jobTitleID(),
            requiredAlerts = (userJobTitle && userJobTitle.requiredAlerts()) || [];

        return requiredAlerts.map(function(profileAlert) {
            return AlertLink.fromProfileAlert(profileAlert, { jobTitleID: jobTitleID });
        });
    }, this);
}

var PublicUserReview = require('../models/PublicUserReview');
function ReviewsVM() {
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
        var task = users.getReviews(this.userID(), this.jobTitleID(), options)
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
