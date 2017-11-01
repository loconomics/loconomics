/**
 * ViewModel to display Reviews for a user and job title.
 * Used at public profile/listing
 */
'use stritct';
var ko = require('knockout');
var users = require('../data/users');
var PublicUserReview = require('../models/PublicUserReview');

module.exports = function ReviewsVM() {
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
};
