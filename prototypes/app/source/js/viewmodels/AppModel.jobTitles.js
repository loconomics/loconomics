/** Fetch Job Titles and Pricing Types information
**/
'use strict';

var localforage = require('localforage'),
    JobTitle = require('../models/JobTitle'),
    ko = require('knockout');

exports.create = function create(appModel) {

    var api = {
            state:  {
                isLoading: ko.observable(false)
            }
        },
        cache = {
            jobTitles: {}
        };

    /**
        Public API
        Get a Job Title information by ID
    **/
    api.getJobTitle = function getJobTitle(id) {
        if (!id) return Promise.reject('Needs an ID to get a Job Title');

        // First, in-memory cache
        if (cache.jobTitles[id]) {
            return Promise.resolve(cache.jobTitles[id]);
        }
        else {
            api.state.isLoading(true);
            // Second, local storage
            return localforage.getItem('jobTitles/' + id)
            .then(function(jobTitle) {
                if (jobTitle) {
                    // cache in memory as Model instance
                    cache.jobTitles[id] = new JobTitle(jobTitle);
                    api.state.isLoading(false);
                    // return it
                    return cache.jobTitles[id];
                }
                else {
                    // Third and last, remote loading
                    return appModel.rest.get('job-titles/' + id)
                    .then(function (raw) {
                        // Cache in local storage
                        localforage.setItem('jobTitles/' + id, raw);
                        // cache in memory as Model instance
                        cache.jobTitles[id] = new JobTitle(raw);
                        api.state.isLoading(false);
                        // return it
                        return cache.jobTitles[id];
                    });
                }
            })
            .catch(function(err) {
                api.state.isLoading(false);
                // Rethrow error
                return err;
            });
        }
    };

    return api;
};
