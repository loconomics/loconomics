/**
    Model API to manage the collection of Job Titles assigned
    to the current user and its working data.
**/
'use strict';

var UserJobTitle = require('../models/UserJobTitle'),
    CacheControl = require('../utils/CacheControl'),
    localforage = require('localforage');

exports.create = function create(appModel) {

    var api = {},
        defaultTtl = { minutes: 1 },
        cache = {
            // Array of user job titles making
            // its profile
            userJobProfile: {
                cache: new CacheControl({ ttl: defaultTtl }),
                list: null
            },
            // Indexed list by jobTitleID to the user job titles models
            // in the list and cache information
            userJobTitles: {}
        };
    
    /**
        Convert raw array of pricing types records into
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
                cache.userJobProfile.list.push(m);
                // Saving and indexed copy and per item cache info
                setGetUserJobTitleToCache(rawItem);
            });
        }

        // Update cache state
        cache.userJobProfile.cache.latest = new Date();
        
        return cache.userJobProfile.list;
    }
    
    /**
        Get the full jobProfile from local copy, throwing a Promise reject exception if nothing
    **/
    function getUserJobProfileFromLocal() {
        return localforage.getItem('userJobProfile')
        .then(function(userJobProfile) {
            if (userJobProfile) {
                return mapToUserJobProfile(userJobProfile);
            }
            // Throw error, so use catch to detect it
            throw { name: 'NotFoundLocal', message: 'Not found on local storage' };
        });
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
        }
        // Update cache control
        if (c.cache) {
            c.cache.latest = new Date();
        }
        else {
            c.cache = new CacheControl({ ttl: defaultTtl });
        }
        
        // Return the model, updated or just created
        return c.model;
    }
    
    /**
        Get the content from the cache, for full profile
        and save it in local storage
    **/
    function saveCacheInLocal() {
        var plain = cache.userJobProfile.list.map(function(item) {
            // Each item is a model, get it in plain:
            return item.model.toPlainObject();
        });
        localforage.setItem('userJobProfile', plain);
    }
    
    /**
        Public API
        Get the complete list of UserJobTitle for
        all the JobTitles assigned to the current user
    **/
    api.getUserJobProfile = function () {
        // First, in-memory cache
        if (cache.userJobProfile.list) {
            return Promise.resolve(cache.userJobProfile.list);
        }
        else {
            // Second, local storage
            return getUserJobProfileFromLocal()
            .catch(function() {
                // Third and last, remote loading
                return appModel.rest.get('user-job-profile')
                .then(function (raw) {
                    // Cache in local storage
                    localforage.setItem('userJobProfile', raw);
                    return mapToUserJobProfile(raw);
                });
            });
        }
    };
    
    /**
        Public API
        Get a UserJobTitle record for the given
        JobTitleID and the current user.
    **/
    api.getUserJobTitle = function (jobTitleID) {
        // Quick error
        if (!jobTitleID) return Promise.reject('Job Title ID required');
        
        // First, in-memory cache, and still valid
        if (cache.userJobTitles[jobTitleID] &&
            !cache.userJobTitles[jobTitleID].cache.mustRevalidate()) {
            cache.userJobTitles[jobTitleID].model;
        }
        else {
            // Second, local storage, where is the full job profile
            return getUserJobProfileFromLocal()
            .then(function(/*userJobProfile*/) {
                // Not need for the parameter, the data is
                // in memory and indexed
                return cache.userJobTitles[jobTitleID].model;
            })
            .catch(function() {
                // If no local copy (error on promise),
                // or that does not contains the job title (error on 'then'):
                // Third and last, remote loading
                return appModel.rest.get('user-job-profile/' + jobTitleID)
                .then(function(raw) {
                    // Save to cache and get model
                    var m = setGetUserJobTitleToCache(raw);
                    // Save in local
                    saveCacheInLocal();
                    // Return model
                    return m;
                });
            });
        }
    };
    
    return api;
};
