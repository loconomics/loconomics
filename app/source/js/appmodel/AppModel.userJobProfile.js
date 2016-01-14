/**
    Model API to manage the collection of Job Titles assigned
    to the current user and its working data.
**/
'use strict';

var UserJobTitle = require('../models/UserJobTitle'),
    CacheControl = require('../utils/CacheControl'),
    localforage = require('localforage'),
    ko = require('knockout'),
    $ = require('jquery');

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
            userJobTitles: {/*
                jobTitleID: { model: object, cache: CacheControl }
            */}
        };
    
    // Observable list
    api.list = ko.observableArray([]);
    // NOTE: Basic implementation, to enhance
    api.syncList = function syncList() {
        return api.getUserJobProfile().then(function(list) {
            api.list(list);
            return list;
        });
    };
    
    api.clearCache = function clearCache() {
        cache.userJobProfile.cache.latest = null;
        cache.userJobProfile.list = [];
        cache.userJobTitles = {};
    };
    
    appModel.on('clearLocalData', function() {
        api.clearCache();
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
        api.list(cache.userJobProfile.list);

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
        api.list.remove(function(j) { return j.jobTitleID() === jobTitleID; });
        cache.userJobProfile.cache.touch();
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
        return appModel.rest.get('me/user-job-profile')
        .then(function (raw) {
            // Cache in local storage
            localforage.setItem('userJobProfile', raw);
            return mapToUserJobProfile(raw);
        });
    };
    
    var saveCacheToLocal = function() {
        var raw = cache.userJobProfile.list.map(function(j) {
            return j.model.toPlainObject(true);
        });
        localforage.setItem('userJobProfile', raw);
    };
    
    /**
        Public API
        Get the complete list of UserJobTitle for
        all the JobTitles assigned to the current user
    **/
    api.getUserJobProfile = function () {
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
        return appModel.rest.get('me/user-job-profile/' + jobTitleID)
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
        return appModel.rest.post('me/user-job-profile', $.extend({
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
            
            // Return model
            return m;
        });
    };
    
    /**
        Public API
        Get a UserJobTitle record for the given
        JobTitleID and the current user.
    **/
    api.getUserJobTitle = function (jobTitleID) {
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
    api.setUserJobTitle = function (values) {
        return appModel.rest.put('me/user-job-profile/' + values.jobTitleID, values)
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
    
    api.createUserJobTitle = function (values) {
        return pushNewUserJobTitle(values);
    };
    
    api.deactivateUserJobTitle = function(jobTitleID) {
        return appModel.rest.post('me/user-job-profile/' + (jobTitleID|0) + '/deactivate')
        .then(function(raw) {
            // Save to cache and get model
            var m = setGetUserJobTitleToCache(raw);
            return m;
        });
    };
    
    api.reactivateUserJobTitle = function(jobTitleID) {
        return appModel.rest.post('me/user-job-profile/' + (jobTitleID|0) + '/reactivate')
        .then(function(raw) {
            // Save to cache and get model
            var m = setGetUserJobTitleToCache(raw);
            return m;
        });
    };
    
    api.deleteUserJobTitle = function(jobTitleID) {
        var found = api.list().filter(function(j) {
            if (j.jobTitleID() === jobTitleID)
                j.isBeingDeleted(true);
        });
        return appModel.rest.delete('me/user-job-profile/' + (jobTitleID|0))
        .then(function() {
            // Remove from cache
            deleteUserJobTitleFromCache(jobTitleID);
            saveCacheToLocal();
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
    
    /*************************/
    /** ADITIONAL UTILITIES **/
    api.getUserJobTitleAndJobTitle = function getUserJobTitleAndJobTitle(jobTitleID) {
        return api.getUserJobTitle(jobTitleID)
        .then(function(userJobTitle) {
            // Very unlikely error
            if (!userJobTitle) {
                throw {
                    name: 'Not Found',
                    message:
                        // LJDI:
                        'You have not this job title in your profile. ' + 
                        'Maybe was deleted from your profile recently.'
                };
            }

            // Get job title info too
            return Promise.all([
                userJobTitle,
                appModel.jobTitles.getJobTitle(jobTitleID)
            ]);
        })
        .then(function(all) {
            var jobTitle = all[1];
            // Very unlikely error
            if (!jobTitle) {
                throw {
                    name: 'Not Found',
                    // LJDI:
                    message: 'The job title does not exist.'
                };
            }
        
            return {
                jobTitleID: jobTitleID,
                userJobTitle: all[0],
                jobTitle: jobTitle
            };
        });
    };
    
    return api;
};
