/** Home Address
**/
'use strict';

var Address = require('../models/Address'),
    ko = require('knockout'),
    localforage = require('localforage'),
    IndexedGroupListCache = require('../utils/IndexedGroupListCache');

exports.create = function create(appModel) {
    var api = {
        state: {
            isLoading: ko.observable(false),
            isSyncing: ko.observable(false),
            isSaving: ko.observable(false)
        }
    };
    var cache = new IndexedGroupListCache({
        // Conservative cache, just 1 minute
        listTtl: { minutes: 1 },
        groupIdField: 'jobTitleID',
        itemIdField: 'addressID'
    });

    api.state.isLocked = ko.pureComputed(function() {
        return this.isLoading() || this.isSaving();
    }, api.state);


    /** Data Stores Management **/

    function fetchFromLocal(jobTitleID) {
        return localforage.getItem('addresses/service/' + jobTitleID);
    }
    
    function fetchFromRemote(jobTitleID) {
        return appModel.rest.get('addresses/service/' + jobTitleID);
    }

    function pushToLocal(jobTitleID, data) {
        return localforage.setItem('addresses/service/' + jobTitleID, data);
    }
    
    function pushToRemote(data) {
        
        var method = data.addressID ? 'put' : 'post';
        var url = 'addresses/service/' + data.jobTitleID + (
            data.addressID ? '/' + data.addressID : ''
        );
        return appModel.rest[method](url, data);
    }


    /** API definition **/

    api.getList = function getList(jobTitleID) {
        var cacheEntry = cache.getGroupCache(jobTitleID);

        if (cacheEntry.control.mustRevalidate()) {
            // No cache data, is first load, try from local
            if (!cacheEntry.list) {
                api.state.isLoading(true);
                // From local
                return fetchFromLocal(jobTitleID)
                .then(function(data) {
                    // launch remote for sync
                    api.state.isSyncing(true);
                    var remotePromise = fetchFromRemote(jobTitleID)
                    .then(function(serverData) {
                        cache.setGroupCache(jobTitleID, serverData);
                        pushToLocal(jobTitleID, serverData);
                        api.state.isSyncing(false);
                    });
                    // Remote fallback: If no local, wait for remote
                    return data ? data : remotePromise;
                })
                .then(function(data) {
                    cache.setGroupCache(jobTitleID, data);
                    pushToLocal(jobTitleID, data);
                    api.state.isLoading(false);
                    
                    return data;
                })
                .catch(function(err) {
                    api.state.isLoading(false);
                    api.state.isSyncing(false);
                    // rethrow error
                    return err;
                });
            } else {
                api.state.isSyncing(true);
                // From remote
                return fetchFromRemote(jobTitleID)
                .then(function(data) {
                    cache.setGroupCache(jobTitleID, data);
                    pushToLocal(jobTitleID, data);
                    api.state.isLoading(false);
                    api.state.isSyncing(false);
                    
                    return data;
                })
                .catch(function(err) {
                    api.state.isLoading(false);
                    api.state.isSyncing(false);
                    // rethrow error
                    return err;
                });
            }
        }
        else {
            // From cache
            return Promise.resolve(cacheEntry.list);
        }
    };
    
    api.getItem = function getItem(jobTitleID, addressID) {
        // IMPORTANT: To simplify, load all the list (is a short list)
        // and look from its cached index
        // TODO Implement item server look-up. Be careful with cache update,
        // list sorting and state flags.
        return api.getList(jobTitleID)
        .then(function() {
            // Get from cached index
            var cacheItem = cache.getItemCache(jobTitleID, addressID);

            // TODO: Enhance on future with actual look-up by API addressID
            // if not cached, throwing not found from the server (just to avoid
            // minor cases when a new item is not still in the cache if linked
            // from other app data). And keep updated list cache with that
            // items lookup
            if (!cacheItem) throw new Error('Not Found');
            return cacheItem.item;
        });
    };

    /**
        Save an item in cache, local and remote.
        Can be new or updated.
        The IDs goes with all the other data, being
        jobTitleID required, addressID required for updates
        but falsy for insertions.
        @param data:object Plain object
    **/
    api.setItem = function setItem(data) {
        api.state.isSaving(true);
        // Send to remote first
        return pushToRemote(data)
        .then(function(serverData) {
            // Success! update local copy with returned data
            // IMPORTANT: to use server data here so we get values set
            // by the server, as updates dates and addressID when creating
            // a new address.
            if (serverData) {
                // Save in cache
                cache.setItemCache(serverData.jobTitleID, serverData.addressID, serverData);
                // Save in local storage
                // In local need to be saved all the grouped data, not just
                // the item; since we have the cache list updated, use that
                // full list to save local
                pushToLocal(serverData.jobTitleID, cache.getGroupCache(serverData.jobTitleID).list);
            }
            api.state.isSaving(false);

            return serverData;
        })
        .catch(function(err) {
            api.state.isSaving(false);
            // Rethrow error
            return err;
        });
    };
    
    function removeFromRemote(jobTitleID, addressID) {
        return appModel.rest.delete('addresses/service/' + jobTitleID + '/' + addressID);
    }
    
    api.delItem = function delItem(jobTitleID, addressID) {
        // Remove in remote first
        return removeFromRemote(jobTitleID, addressID)
        .then(function(removedData) {
            // Update cache
            cache.delItemCache(jobTitleID, addressID);
            // Save in local storage
            // In local need to be saved all the grouped data;
            // since we have the cache list updated, use that
            // full list to save local
            pushToLocal(jobTitleID, cache.getGroupCache(jobTitleID).list);
            
            return removedData;
        });
    };
    
    /** Some Utils **/
    
    api.asModel = function asModel(object) {
        // if is an array, return a list of models
        if (Array.isArray(object)) {
            return object.map(function(item) {
                return new Address(item);
            });
        }
        else {
            return new Address(object);
        }
    };
    
    api.getItemModel = function getItemModel(jobTitleID, addressID) {
        return api.getItem(jobTitleID, addressID)
        .then(function(data) {
            return data ? api.asModel(data) : null;
        });
    };
    
    var ModelVersion = require('../utils/ModelVersion');
    api.getItemVersion = function getItemVersion(jobTitleID, addressID) {
        return api.getItemModel(jobTitleID, addressID)
        .then(function(model) {
            return model ? new ModelVersion(model) : null;
        });
    };
    
    api.newItemVersion = function newItemVersion(values) {
        // New original and version for the model
        var version = new ModelVersion(new Address(values));
        // To be sure that the version appear as something 'new', unsaved,
        // we update its timestamp to be different to the original.
        version.version.model.touch();
        return version;
    };
    
    return api;
};
