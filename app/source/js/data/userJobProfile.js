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
var local = require('./drivers/localforage');
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

// Observable list
exports.list = ko.observableArray([]);
// NOTE: Basic implementation, to enhance
exports.syncList = function syncList() {
    return exports.getUserJobProfile().then(function(list) {
        exports.list(list);
        return list;
    });
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
    Convert raw array of job titles records into
    an indexed array of models, actually an object
    with ID numbers as properties,
    and cache it in memory.
**/
function mapToUserJobProfile(rawItems) {
    cache.userJobProfile.list = [];
    cache.userJobTitles = {};

    if (rawItems) {
        rawItems.forEach(function(rawItem) {
            var m = new UserJobTitle(rawItem);
            // Extended feature: to know when is in background deletion process
            m.isBeingDeleted = ko.observable(false);
            cache.userJobProfile.list.push(m);
            // Saving and indexed copy and per item cache info
            setGetUserJobTitleToCache(rawItem);
        });
    }
    // Update observable
    exports.list(cache.userJobProfile.list);

    // Update cache state
    cache.userJobProfile.cache.latest = new Date();

    return cache.userJobProfile.list;
}

/**
    Get the full jobProfile from local copy, throwing a Promise reject exception if nothing
**/
function getUserJobProfileFromLocal() {
    return local.getItem('userJobProfile')
    .then(function(userJobProfile) {
        if (userJobProfile) {
            return mapToUserJobProfile(userJobProfile);
        }
        // Return null since there is no data, the promise can catch
        // there is no data and attempt a remote
        return null;
    });
}

function deleteUserJobTitleFromCache(jobTitleID) {
    // Delete from index
    delete cache.userJobTitles[jobTitleID];

    // Remove from profile list: do from observable, that modifies plain cache
    // and notify observers too
    exports.list.remove(function(j) { return j.jobTitleID() === jobTitleID; });
    cache.userJobProfile.cache.touch();
    exports.cacheChangedNotice.emit();
}

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

// Private, fetch from remote
var fetchUserJobProfile = function () {
    // Third and last, remote loading
    return remote.get('me/user-job-profile')
    .then(function (raw) {
        // Cache in local storage
        local.setItem('userJobProfile', raw);
        return mapToUserJobProfile(raw);
    });
};

var saveCacheToLocal = function() {
    var raw = cache.userJobProfile.list.map(function(j) {
        return j.model.toPlainObject(true);
    });
    local.setItem('userJobProfile', raw);
};

/**
    Public API
    Get the complete list of UserJobTitle for
    all the JobTitles assigned to the current user
**/
exports.getUserJobProfile = function () {
    // If no cache or must revalidate, go remote
    // (the first loading is ever 'must revalidate')
    if (cache.userJobProfile.cache.mustRevalidate()) {
        // If no cache, is first load, so try local
        if (!cache.userJobProfile.list) {
            // Local storage
            return getUserJobProfileFromLocal()
            .then(function(data) {
                // launch remote for sync
                var remotePromise = fetchUserJobProfile();
                // Remote fallback: If no local, wait for remote
                return data ? data : remotePromise;
            });
        }
        else {
            // No cache, no local, or obsolete, go remote:
            return fetchUserJobProfile();
        }
    }
    else {
        // There is cache and is still valid:
        return Promise.resolve(cache.userJobProfile.list);
    }
};

// Private, fetch from remote
var fetchUserJobTitle = function(jobTitleID) {
    return remote.get('me/user-job-profile/' + jobTitleID)
    .then(function(raw) {
        // Save to cache and get model
        var m = setGetUserJobTitleToCache(raw);

        // TODO implement cache saving for single job-titles, currently
        // it needs to save the profile cache, that may not exists if
        // the first request is for a single job title.
        // Next lines are to save full profile, not valid here.
        // Save in local
        //saveCacheInLocal();

        // Return model
        return m;
    });
};

var pushNewUserJobTitle = function(values) {
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

/**
    Public API
    Get a UserJobTitle record for the given
    JobTitleID and the current user.
**/
exports.getUserJobTitle = function (jobTitleID) {
    // Quick error
    if (!jobTitleID) return Promise.reject('Job Title ID required');

    // If no cache or must revalidate, go remote
    if (!cache.userJobTitles[jobTitleID] ||
        cache.userJobTitles[jobTitleID].cache.mustRevalidate()) {
        return fetchUserJobTitle(jobTitleID);
    }
    else {
        // First, try cache
        if (cache.userJobTitles[jobTitleID] &&
            cache.userJobTitles[jobTitleID].model) {
            return Promise.resolve(cache.userJobTitles[jobTitleID].model);
        }
        else {
            // Second, local storage, where we have the full job profile
            return getUserJobProfileFromLocal()
            .then(function(/*userJobProfile*/) {
                // Not need for the parameter, the data is
                // in memory and indexed, look for the job title
                return cache.userJobTitles[jobTitleID].model;
            })
            // If no local copy (error on promise),
            // or that does not contains the job title (error on 'then'):
            // Third and last, remote loading
            .catch(fetchUserJobTitle.bind(null, jobTitleID));
        }
    }
};

/**
    Push changes to remote. StatusID can NOT be modified with this API, use specific
    deactivate/reactivate methods
**/
exports.setUserJobTitle = function (values) {
    return remote.put('me/user-job-profile/' + values.jobTitleID, values)
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

exports.createUserJobTitle = function (values) {
    return pushNewUserJobTitle(values);
};

exports.deactivateUserJobTitle = function(jobTitleID) {
    return remote.post('me/user-job-profile/' + (jobTitleID|0) + '/deactivate')
    .then(function(raw) {
        // Save to cache and get model
        var m = setGetUserJobTitleToCache(raw);
        exports.cacheChangedNotice.emit();
        return m;
    });
};

exports.reactivateUserJobTitle = function(jobTitleID) {
    return remote.post('me/user-job-profile/' + (jobTitleID|0) + '/reactivate')
    .then(function(raw) {
        // Save to cache and get model
        var m = setGetUserJobTitleToCache(raw);
        exports.cacheChangedNotice.emit();
        return m;
    });
};

exports.deleteUserJobTitle = function(jobTitleID) {
    var found = exports.list().filter(function(j) {
        if (j.jobTitleID() === jobTitleID)
            j.isBeingDeleted(true);
    });
    return remote.delete('me/user-job-profile/' + (jobTitleID|0))
    .then(function() {
        // Remove from cache
        deleteUserJobTitleFromCache(jobTitleID);
        saveCacheToLocal();
        exports.cacheChangedNotice.emit();
        return null;
    })
    .catch(function(err) {
        // Uncheck deletion flag
        found.forEach(function(j) {
            j.isBeingDeleted(false);
        });
        // Propagate error
        throw err;
    });
};
