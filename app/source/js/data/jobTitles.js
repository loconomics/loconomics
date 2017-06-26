/**
 * Access to the list of job titles available,
 * including related information like allowed pricing types,
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var JobTitle = require('../models/JobTitle');
var ko = require('knockout');
var CacheControl = require('../utils/CacheControl');
var session = require('./session');
var local = require('./drivers/localforage');
var remote = require('./drivers/restClient');

exports.state = {
    isLoading: ko.observable(false)
};

var cache = {
    jobTitles: {}
};

var getCacheItem = function(id) {
    var c = cache.jobTitles[id];
    if (!c) {
        c = cache.jobTitles[id] = new CacheControl({
            ttl: { minutes: 60 }
        });
    }
    return c;
};

var setCacheItem = function(id, rawData) {
    var c = getCacheItem(id);
    if (c.data)
        c.data.model.updateWith(rawData, true);
    else
        c.data = new JobTitle(rawData);

    c.touch();
    return c;
};

exports.clearCache = function clearCache() {
    cache.jobTitles = {};
};

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});

/**
    Public API
    Get a Job Title information by ID
**/
exports.getJobTitle = function getJobTitle(id) {
    if (!id) return Promise.reject('Needs an ID to get a Job Title');

    // Get cache control object
    var c = getCacheItem(id);
    // Zero, there is a running request?
    if (c.request) {
        return c.request;
    }
    else if (!c.mustRevalidate()) {
        // First, in-memory cache
        return Promise.resolve(c.data);
    }
    else {
        exports.state.isLoading(true);
        // Second, local storage
        c.request = local.getItem('jobTitles/' + id)
        .then(function(jobTitle) {
            if (jobTitle) {
                c.latest = new Date(jobTitle.updatedDate);
            }
            // if the local copy must revalidate, get from remote
            if (c.mustRevalidate()) {
                // Third and last, remote loading
                return remote.get('job-titles/' + id)
                .then(function (raw) {
                    // Cache in local storage
                    local.setItem('jobTitles/' + id, raw);
                    exports.state.isLoading(false);
                    c.request = null;
                    // cache in memory and return the Model
                    return setCacheItem(id, raw).data;
                });
            }
            else {
                exports.state.isLoading(false);
                c.request = null;
                // The local copy is valid, set in memory and returns
                return setCacheItem(id, jobTitle).data;
            }
        })
        .catch(function(err) {
            exports.state.isLoading(false);
            c.request = null;
            // Rethrow error
            throw err;
        });

        return c.request;
    }
};
