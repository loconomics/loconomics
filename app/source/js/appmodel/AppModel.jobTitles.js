/** Fetch Job Titles and Pricing Types information
**/
'use strict';

var localforage = require('localforage'),
    JobTitle = require('../models/JobTitle'),
    ko = require('knockout');
var CacheControl = require('../utils/CacheControl');

exports.create = function create(appModel) {

    var api = {
            state:  {
                isLoading: ko.observable(false)
            }
        },
        cache = {
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

    api.clearCache = function clearCache() {
        cache.jobTitles = {};
    };

    appModel.on('clearLocalData', function() {
        api.clearCache();
    });

    /**
        Public API
        Get a Job Title information by ID
    **/
    api.getJobTitle = function getJobTitle(id) {
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
            api.state.isLoading(true);
            // Second, local storage
            c.request = localforage.getItem('jobTitles/' + id)
            .then(function(jobTitle) {
                if (jobTitle) {
                    c.latest = new Date(jobTitle.updatedDate);
                }
                // if the local copy must revalidate, get from remote
                if (c.mustRevalidate()) {
                    // Third and last, remote loading
                    return appModel.rest.get('job-titles/' + id)
                    .then(function (raw) {
                        // Cache in local storage
                        localforage.setItem('jobTitles/' + id, raw);
                        api.state.isLoading(false);
                        c.request = null;
                        // cache in memory and return the Model
                        return setCacheItem(id, raw).data;
                    });
                }
                else {
                    api.state.isLoading(false);
                    c.request = null;
                    // The local copy is valid, set in memory and returns
                    return setCacheItem(id, jobTitle).data;
                }
            })
            .catch(function(err) {
                api.state.isLoading(false);
                c.request = null;
                // Rethrow error
                throw err;
            });

            return c.request;
        }
    };

    return api;
};
