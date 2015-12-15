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
                // TODO Load extra job data (reviews)
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
    this.viewModel.refreshTs(new Date());
};

function ViewModel() {
    this.isLoading = ko.observable(false);
    this.user = ko.observable(null);
    this.reviews = ko.observableArray([]);
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
}
