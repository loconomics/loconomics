/**
    Utility to manage a Remote collection of Models
**/
'use strict';

// COMMENTED, TRIALS AND COPY-PASTED-MODIFIED CODE, NOT COMPLETE, TRYING OTHER
// APPROACHES (see Appmodel.serviceAddresses), MAYBE REUSE OR DELETE IN FUTURE.

//var CachedData = require('../utils/CachedData');
//
//function A(settings) {
//    
//    if (!settings) throw new Error('Settings are required');
//
//    var loadSources = [];
//    if (settings.loadStorageName)
//        loadSources.push(loadFromLocal);
//    loadSources.push(loadFromRemote);
//    
//    var cache = new CachedData({
//        ttl: settings.ttl,
//        loadSources: loadSources
//    });
//
//    function loadFromLocal() {
//        if (this.data) {
//            // If there is data, throw 'obsolete' to comunicate
//            // that load from local is only valid first time and let
//            // it continue with a remote load/sync
//            throw new Error('Obsolete');
//        }
//        else {
//            // First time load, from local:
//            return localforage.getItem(settings.localStorageName);
//        }
//    }
//    
//    function loadFromRemote(params) {
//        return settings.fetchRemoteData(params);
//    }
//    
//    this.isLoading = ko.observable(false);
//    this.isSyncing = ko.observable(false);
//    this.isSaving = ko.observable(false);
//    
//    this.getData = function getData() {
//        if (this.data) {
//            // return and launchs sync
//            this.isSyncing(true);
//            this.load();
//            return Promise.resolve(this.data)
//            .then(function(data) {
//                this.isSyncing(false);
//                return data;
//            }.bind(this));
//        }
//        else {
//            this.isLoading(true);
//            return this.load()
//            .then(function(data) {
//                this.isLoading(false);
//                return data;
//            }.bind(this));
//        }
//    };
//    
//    this.load = function load(params) {
//        return cache.load(params);
//    };
//    
//    this.save = function save() {
//        this.isSaving(true);
//        
//        var promises = [];
//
//        // Save on local
//        if (settings.localStorageName)
//            promises.push(localforage.setItem(settings.localStorageName, cache.data));
//        // Without wait (can be async), save on remote
//        // if there is one
//        if (settings.pushRemoteData)
//            promises.push(settings.pushRemoteData(cache.data));
//
//        return Promise.all(promises)
//        .then(function(d1, d2) {
//            this.isSaving(false);
//            
//            // Return data returned by remote only
//            return settings.localStorageName ? d2 : d1;            
//        }.bind(this));
//    };
//}
//
//var byDate = {};
//function GetByDate(date) {
//    
//    var sdate = (date || new Date()) && date.toISOString();
//    
//    if (byDate[sdate]) {
//        return byDate[sdate].getData();
//    }
//    else {
//        var a = new A({
//            ttl: { minutes: 1 },
//            localStorageName: 'apts[' + sdate + ']',
//            fetchRemoteData: function() {
//                return app.model.getAppointmentsByDate(date);
//            },
//            pushRemoteData: null
//        });
//        byDate[sdate] = a;
//        return a.getData();
//    }
//}
//
//
//var byJobTitle = {};
//function GetByJobTitle(jobTitleID) {
//    
//    if (byJobTitle[jobTitleID]) {
//        return byJobTitle[jobTitleID].getData();
//    }
//    else {
//        var a = new A({
//            ttl: { minutes: 10 },
//            localStorageName: 'ServiceLocations[' + jobtitleID + ']',
//            fetchRemoteData: function() {
//                return app.model.rest.put('addresses/service/' + jobTitleID);
//            },
//            pushRemoteData: function(addressID) {
//                return app.model.rest.put('addresses/service/' + jobTitleID + '/' + addressID);
//            }
//        });
//        byJobTitle[jobTitleID] = a;
//        return a.getData();
//    }
//}
//
//
//
//
//var ModelVersion = require('../utils/ModelVersion'),
//    CacheControl = require('../utils/CacheControl'),
//    ko = require('knockout'),
//    localforage = require('localforage'),
//    EventEmitter = require('events').EventEmitter;
//
//function RemoteModelList(options) {
//
//    EventEmitter.call(this);
//    
//    options = options || {};
//    
//    var firstTimeLoad = true;
//    
//    // Marks a lock loading is happening, any user code
//    // must wait for it
//    this.isLoading = ko.observable(false);
//    // Marks a lock saving is happening, any user code
//    // must wait for it
//    this.isSaving = ko.observable(false);
//    // Marks a background synchronization: load or save,
//    // user code knows is happening but can continue
//    // using cached data
//    this.isSyncing = ko.observable(false);
//    // Utility to know whether any locking operation is
//    // happening.
//    // Just loading or saving
//    this.isLocked = ko.pureComputed(function(){
//        return this.isLoading() || this.isSaving();
//    }, this);
//    
//    if (!options.data)
//        throw new Error('RemoteModel data must be set on constructor and no changed later');
//    this.data = options.data;
//    
//    this.cache = new CacheControl({
//        ttl: options.ttl
//    });
//    
//    // Optional name used to persist a copy of the data as plain object
//    // in the local storage on every successfully load/save operation.
//    // With no name, no saved (default).
//    // It uses 'localforage', so may be not saved using localStorage actually,
//    // but any supported and initialized storage system, like WebSQL, IndexedDB or LocalStorage.
//    // localforage must have a set-up previous use of this option.
//    this.localStorageName = options.localStorageName || null;
//    
//    // Recommended way to get the instance data
//    // since it ensures to launch a load of the
//    // data each time is accessed this way.
//    this.getData = function getData() {
//        this.load();
//        return this.data;
//    };
//
//    this.fetch = options.fetch || function fetch() { throw new Error('Not implemented'); };
//    this.push = options.push || function push() { throw new Error('Not implementd'); };
//
//    var loadFromRemote = function loadFromRemote() {
//        return this.fetch()
//        .then(function (serverData) {
//            if (serverData) {
//                // Ever deepCopy, since plain data from the server (and any
//                // in between conversion on 'fecth') cannot have circular
//                // references:
//                this.data.model.updateWith(serverData, true);
//
//                // persistent local copy?
//                if (this.localStorageName) {
//                    localforage.setItem(this.localStorageName, serverData);
//                }
//            }
//            else {
//                throw new Error('Remote model did not returned data, response must be a "Not Found"');
//            }
//
//            // Event
//            if (this.isLoading()) {
//                this.emit('loaded', serverData);
//            }
//            else {
//                this.emit('synced', serverData);
//            }
//
//            // Finally: common tasks on success or error
//            this.isLoading(false);
//            this.isSyncing(false);
//
//            this.cache.latest = new Date();
//            return this.data;
//        }.bind(this))
//        .catch(function(err) {
//
//            var wasLoad = this.isLoading();
//
//            // Finally: common tasks on success or error
//            this.isLoading(false);
//            this.isSyncing(false);
//
//            // Event
//            var errPkg = {
//                task: wasLoad ? 'load' : 'sync',
//                error: err
//            };
//            // Be careful with 'error' event, is special and stops execution on emit
//            // if no listeners attached: overwritting that behavior by just
//            // print on console when nothing, or emit if some listener:
//            if (EventEmitter.listenerCount(this, 'error') > 0) {
//                this.emit('error', errPkg);
//            }
//            else {
//                // Log it when not handled (even if the promise error is handled)
//                console.error('RemoteModel Error', errPkg);
//            }
//
//            // Rethrow error
//            throw err;
//        }.bind(this));
//    }.bind(this);
//    
//    this.load = function load() {
//        if (this.cache.mustRevalidate()) {
//            
//            if (firstTimeLoad)
//                this.isLoading(true);
//            else
//                this.isSyncing(true);
//            
//            var promise = null;
//            
//            // If local storage is set for this, load first
//            // from local, then follow with syncing from remote
//            if (firstTimeLoad &&
//                this.localStorageName) {
//
//                promise = localforage.getItem(this.localStorageName)
//                .then(function(localData) {
//                    if (localData) {
//                        this.data.model.updateWith(localData, true);
//                        
//                        // Load done:
//                        this.isLoading(false);
//                        this.isSyncing(false);
//                        
//                        // Local load done, do a background
//                        // remote load
//                        loadFromRemote();
//                        // just don't wait, return current
//                        // data
//                        return this.data;
//                    }
//                    else {
//                        // When no data, perform a remote
//                        // load and wait for it:
//                        return loadFromRemote();
//                    }
//                }.bind(this));
//            }
//            else {
//                // Perform the remote load:
//                promise = loadFromRemote();
//            }
//            
//            // First time, blocking load:
//            // it returns when the load returns
//            if (firstTimeLoad) {
//                firstTimeLoad = false;
//                // Returns the promise and will wait for the first load:
//                return promise;
//            }
//            else {
//                // Background load: is loading still
//                // but we have cached data so we use
//                // that for now. If anything new from outside
//                // versions will get notified with isObsolete()
//                return Promise.resolve(this.data);
//            }
//        }
//        else {
//            // Return cached data, no need to load again for now.
//            return Promise.resolve(this.data);
//        }
//    };
//    
//    /**
//        Launch a syncing request. Returns nothing, the
//        way to track any result is with events or 
//        the instance observables.
//        IMPORTANT: right now is just a request for 'load'
//        that avoids promise errors from throwing.
//    **/
//    this.sync = function sync() {
//        // Call for a load, that will be treated as 'syncing' after the
//        // first load
//        this.load()
//        // Avoid errors from throwing in the console,
//        // the 'error' event is there to track anyone.
//        .catch(function() {});
//    };
//}
//
//module.exports = RemoteModelList;
//
//RemoteModelList._inherits(EventEmitter);
//
//
////////////////////////
//
//var CacheControl = require('../utils/CacheControl'),
//    localforage = require('localforage');
//
//exports.create = function create(appModel) {
//
//    var api = {},
//        defaultTtl = { minutes: 1 },
//        cache = {
//            // Array of user job titles making
//            // its profile
//            userJobProfile: {
//                cache: new CacheControl({ ttl: defaultTtl }),
//                list: null
//            },
//            // Indexed list by jobTitleID to the user job titles models
//            // in the list and cache information
//            userJobTitles: {}
//        };
//    
//    /**
//        Convert raw array of pricing types records into
//        an indexed array of models, actually an object
//        with ID numbers as properties,
//        and cache it in memory.
//    **/
//    function mapToUserJobProfile(rawItems) {
//        cache.userJobProfile.list = [];
//        cache.userJobTitles = {};
//
//        if (rawItems) {
//            rawItems.forEach(function(rawItem) {
//                var m = new UserJobTitle(rawItem);
//                cache.userJobProfile.list.push(m);
//                // Saving and indexed copy and per item cache info
//                setGetUserJobTitleToCache(rawItem);
//            });
//        }
//
//        // Update cache state
//        cache.userJobProfile.cache.latest = new Date();
//        
//        return cache.userJobProfile.list;
//    }
//    
//    /**
//        Get the full jobProfile from local copy, throwing a Promise reject exception if nothing
//    **/
//    function getUserJobProfileFromLocal() {
//        return localforage.getItem('userJobProfile')
//        .then(function(userJobProfile) {
//            if (userJobProfile) {
//                return mapToUserJobProfile(userJobProfile);
//            }
//            // Throw error, so use catch to detect it
//            throw { name: 'NotFoundLocal', message: 'Not found on local storage' };
//        });
//    }
//    
//    /**
//        Set a raw userJobProfile record (from server) and set it in the
//        cache, creating or updating the model (so all the time the same model instance
//        is used) and cache control information.
//        Returns the model instance.
//    **/
//    function setGetUserJobTitleToCache(rawItem) {
//        var c = cache.userJobTitles[rawItem.jobTitleID] || {};
//        // Update the model if exists, so get reflected to anyone consuming it
//        if (c.model) {
//            c.model.model.updateWith(rawItem);
//        }
//        else {
//            // First time, create model
//            c.model = new UserJobTitle(rawItem);
//        }
//        // Update cache control
//        if (c.cache) {
//            c.cache.latest = new Date();
//        }
//        else {
//            c.cache = new CacheControl({ ttl: defaultTtl });
//        }
//        
//        // Return the model, updated or just created
//        return c.model;
//    }
//    
//    /**
//        Get the content from the cache, for full profile
//        and save it in local storage
//    **/
//    function saveCacheInLocal() {
//        var plain = cache.userJobProfile.list.map(function(item) {
//            // Each item is a model, get it in plain:
//            return item.model.toPlainObject();
//        });
//        localforage.setItem('userJobProfile', plain);
//    }
//    
//    // Private, fetch from remote
//    var fetchUserJobProfile = function () {
//        // Third and last, remote loading
//        return appModel.rest.get('user-job-profile')
//        .then(function (raw) {
//            // Cache in local storage
//            localforage.setItem('userJobProfile', raw);
//            return mapToUserJobProfile(raw);
//        });
//    };
//    
//    /**
//        Public API
//        Get the complete list of UserJobTitle for
//        all the JobTitles assigned to the current user
//    **/
//    api.getUserJobProfile = function () {
//        // If no cache or must revalidate, go remote
//        if (cache.userJobProfile.cache.mustRevalidate()) {
//            return fetchUserJobProfile();
//        }
//        else {
//            // First, try cache
//            if (cache.userJobProfile.list)
//                return Promise.resolve(cache.userJobProfile.list);
//            else
//                // Second, local storage
//                return getUserJobProfileFromLocal()
//                // Fallback to remote if not found in local
//                .catch(fetchUserJobProfile);
//        }
//    };
//    
//    // Private, fetch from remote
//    var fetchUserJobTitle = function(jobTitleID) {
//        return appModel.rest.get('user-job-profile/' + jobTitleID)
//        .then(function(raw) {
//            // Save to cache and get model
//            var m = setGetUserJobTitleToCache(raw);
//            // Save in local
//            saveCacheInLocal();
//            // Return model
//            return m;
//        });
//    };
//    
//    /**
//        Public API
//        Get a UserJobTitle record for the given
//        JobTitleID and the current user.
//    **/
//    api.getUserJobTitle = function (jobTitleID) {
//        // Quick error
//        if (!jobTitleID) return Promise.reject('Job Title ID required');
//        
//        // If no cache or must revalidate, go remote
//        if (!cache.userJobTitles[jobTitleID] ||
//            cache.userJobTitles[jobTitleID].cache.mustRevalidate()) {
//            return fetchUserJobTitle(jobTitleID);
//        }
//        else {
//            // First, try cache
//            if (cache.userJobTitles[jobTitleID] &&
//                cache.userJobTitles[jobTitleID].model) {
//                return Promise.resolve(cache.userJobTitles[jobTitleID].model);
//            }
//            else {
//                // Second, local storage, where we have the full job profile
//                return getUserJobProfileFromLocal()
//                .then(function(/*userJobProfile*/) {
//                    // Not need for the parameter, the data is
//                    // in memory and indexed, look for the job title
//                    return cache.userJobTitles[jobTitleID].model;
//                })
//                // If no local copy (error on promise),
//                // or that does not contains the job title (error on 'then'):
//                // Third and last, remote loading
//                .catch(fetchUserJobTitle.bind(null, jobTitleID));
//            }
//        }
//    };
//    
//    return api;
//};
//
//var ko = require('knockout');
//
//function UserJobProfileViewModel(app) {
//    
//    this.userJobProfile = ko.observableArray([]);
//
//    this.isFirstTime = ko.observable(true);
//    this.isLoading = ko.observable(false);
//    this.isSyncing = ko.observable(false);
//    this.thereIsError = ko.observable(false);
//
//    var showLoadingError = function showLoadingError(err) {
//        app.modals.showError({
//            title: 'An error happening when loading your job profile.',
//            error: err && err.error || err
//        });
//        
//        this.isLoading(false);
//        this.isSyncing(false);
//        this.thereIsError(true);
//    }.bind(this);
//
//    // Loading and sync of data
//    this.sync = function sync() {
//        var firstTime = this.isFirstTime();
//        this.isFirstTime(false);
//
//        if (firstTime) {
//            this.isLoading(true);
//        }
//        else {
//            this.isSyncing(true);
//        }
//
//        // Keep data updated:
//        app.model.userJobProfile.getUserJobProfile()
//        .then(function(userJobProfile) {
//            
//            // We need the job titles info before end
//            Promise.all(userJobProfile.map(function(userJobTitle) {
//                return syncJobTitle(userJobTitle.jobTitleID());
//            }))
//            .then(function() {
//
//                // Create jobTitle property before update
//                // observable with the profile
//                userJobProfile.forEach(attachJobTitle);
//                
//                this.userJobProfile(userJobProfile);
//
//                this.isLoading(false);
//                this.isSyncing(false);
//                this.thereIsError(false);
//            }.bind(this))
//            .catch(showLoadingError);
//        }.bind(this))
//        .catch(showLoadingError);
//
//    }.bind(this);
//}
