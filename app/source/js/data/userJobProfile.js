/**
 * Management of the user job profile/listing (list of job titles
 * with their settings),
 * local and remote.
 *
 * @deprecated data/userListings must be used instead for read only tasks, when
 * it stills needs to be completed on edition APIs
 */
// TODO store-jsdocs
'use strict';

import SingleEvent from '../utils/SingleEvent';

var UserJobTitle = require('../models/UserJobTitle');
var CacheControl = require('./helpers/CacheControl');
var remote = require('./drivers/restClient');
var ko = require('knockout');
var $ = require('jquery');
var session = require('./session');

var defaultTtl = { minutes: 1 };
var cache = {
    // Array of user job titles making
    // its profile
    userJobProfile: {
        cache: new CacheControl({ ttl: defaultTtl }),
        list: null
    },
    // Indexed list by jobTitleID to the user job titles models
    // in the list and cache information
    userJobTitles: {/*
        jobTitleID: { model: object, cache: CacheControl }
    */}
};

/**
 * Notice when the cache has changed. It's a notice without data.
 * Added for interactions with data module userListing tha must invalidate data
 * on changes here, since is the same data but stored cache under different places
 * @member {SingleEvent}
 */
exports.cacheChangedNotice = new SingleEvent(exports);

exports.clearCache = function clearCache() {
    cache.userJobProfile.cache.latest = null;
    cache.userJobProfile.list = [];
    cache.userJobTitles = {};
    exports.cacheChangedNotice.emit();
};

/**
 * Tags cache as invalid, forcing a refresh next time data is accessed
*/
exports.invalidateCache = function() {
    cache.userJobProfile.cache.latest = null;
    exports.cacheChangedNotice.emit();
};

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});


/**
    Set a raw userJobProfile record (from server) and set it in the
    cache, creating or updating the model (so all the time the same model instance
    is used) and cache control information.
    Returns the model instance.
**/
function setGetUserJobTitleToCache(rawItem) {
    var c = cache.userJobTitles[rawItem.jobTitleID] || {};
    // Update the model if exists, so get reflected to anyone consuming it
    if (c.model) {
        c.model.model.updateWith(rawItem);
    }
    else {
        // First time, create model
        c.model = new UserJobTitle(rawItem);
        // Extended feature: to know when is in background deletion process
        c.model.isBeingDeleted = ko.observable(false);
    }
    // Update cache control
    if (c.cache) {
        c.cache.latest = new Date();
    }
    else {
        c.cache = new CacheControl({ ttl: defaultTtl });
    }

    // If there is a profile list, add or update:
    var fullList =  cache.userJobProfile.list;
    if (fullList) {
        var found = null;
        fullList.some(function(it) {
            if (it.jobTitleID() === rawItem.jobTitleID) {
                found = it;
                return true;
            }
        });
        if (found) {
            found.model.updateWith(rawItem);
        }
        else {
            fullList.push(c.model);
        }
    }

    // Return the model, updated or just created
    return c.model;
}

/**
    Get the content from the cache, for full profile
    and save it in local storage
    NOTE It has no sense in current implementation (problem of fetch
    job title without a full job profile in cache/local)
**/
/*function saveCacheInLocal() {
    var plain = cache.userJobProfile.list.map(function(item) {
        // Each item is a model, get it in plain:
        return item.model.toPlainObject();
    });
    localforage.setItem('userJobProfile', plain);
}*/

exports.createUserJobTitle = function(values) {
    // Create job title in remote
    return remote.post('me/user-job-profile', $.extend({
        jobTitleID: 0,
        jobTitleName: '',
        intro: '',
        cancellationPolicyID: null,
        instantBooking: false
    }, values))
    .then(function(raw) {
        // Save to cache and get model
        var m = setGetUserJobTitleToCache(raw);

        // TODO implement cache saving for single job-titles, currently
        // it needs to save the profile cache, that may not exists if
        // the first request is for a single job title.
        // Next lines are to save full profile, not valid here.
        // Save in local
        //saveCacheInLocal();

        exports.cacheChangedNotice.emit();

        // Return model
        return m;
    });
};
