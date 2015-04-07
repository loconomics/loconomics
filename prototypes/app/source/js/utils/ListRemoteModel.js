/**
    ListRemoteModel
    Utility class for common code for a data list entity from a remote source,
    with local copy and cache, where the list is managed will all the data,
    without paging/cursor, with indexed access to each item by its ID.
    Is good for lists that keep small in the time.
**/
'use strict';

var ko = require('knockout'),
    IndexedListCache = require('./IndexedListCache');

function required(val, msg) {
    if (val === null || typeof(val) === 'undefined') throw new Error(msg || 'Required parameter');
    else return val;
}

function ListRemoteModel(settings) {

    settings = settings || {};
    settings.listTtl = required(settings.listTtl, 'listTtl is required');
    settings.itemIdField = required(settings.itemIdField, 'itemIdField is required');
    // Optional model
    settings.Model = settings.Model || null;
    // Required for API additions
    this.settings = settings;

    this.state = {
        isLoading: ko.observable(false),
        isSyncing: ko.observable(false),
        isSaving: ko.observable(false),
        isDeleting: ko.observable(false)
    };

    var cache = new IndexedListCache({
        listTtl: settings.listTtl,
        itemIdField: settings.itemIdField
    });

    this.state.isLocked = ko.pureComputed(function() {
        return this.isLoading() || this.isSaving() || this.isDeleting();
    }, this.state);

    /** Data Stores Management: implementation must be replaced, with custom code or using
        the helpers added to the class (see addXxSupport prototype methods).
    **/
    function notImplemented() { throw new Error('Not Implemented'); }
    this.fetchFromLocal = notImplemented;
    this.fetchFromRemote = notImplemented;
    this.pushToLocal = notImplemented;
    this.pushToRemote = notImplemented;
    this.removeItemFromRemote = notImplemented;

    /** API definition **/
    var api = this;

    api.getList = function getList() {

        if (cache.control.mustRevalidate()) {
            // No cache data, is first load, try from local
            if (!cache.list) {
                api.state.isLoading(true);
                // From local
                return this.fetchFromLocal()
                .then(function(data) {
                    // launch remote for sync
                    api.state.isSyncing(true);
                    var remotePromise = this.fetchFromRemote()
                    .then(function(serverData) {
                        cache.list = serverData;
                        this.pushToLocal(serverData);
                        api.state.isSyncing(false);
                        return serverData;
                    }.bind(this));
                    // Remote fallback: If no local, wait for remote
                    return data ? data : remotePromise;
                }.bind(this))
                .then(function(data) {
                    // Ever a list, even if empty
                    data = data || [];
                    cache.list = data;
                    this.pushToLocal(data);
                    api.state.isLoading(false);

                    return data;
                }.bind(this))
                .catch(function(err) {
                    api.state.isLoading(false);
                    api.state.isSyncing(false);
                    // rethrow error
                    return err;
                });
            } else {
                api.state.isSyncing(true);
                // From remote
                return this.fetchFromRemote()
                .then(function(data) {
                    // Ever a list, even if empty
                    data = data || [];
                    cache.list = data;
                    this.pushToLocal(data);
                    api.state.isLoading(false);
                    api.state.isSyncing(false);

                    return data;
                }.bind(this))
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
            return Promise.resolve(cache.list);
        }
    };
    
    api.getItem = function getItem(itemID) {
        // IMPORTANT: To simplify, load all the list (is a short list)
        // and look from its cached index
        // TODO Implement item server look-up. Be careful with cache update,
        // list sorting and state flags.
        return api.getList()
        .then(function() {
            // Get from cached index
            var cacheItem = cache.getItemCache(itemID);

            // TODO: Enhance on future with actual look-up by API itemID
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
        groupID required, itemID required for updates
        but falsy for insertions.
        @param data:object Plain object
    **/
    api.setItem = function setItem(data) {
        api.state.isSaving(true);
        // Send to remote first
        return this.pushToRemote(data)
        .then(function(serverData) {
            // Success! update local copy with returned data
            // IMPORTANT: to use server data here so we get values set
            // by the server, as updates dates and itemID when creating
            // a new item.
            if (serverData) {
                // Save in cache
                cache.setItemCache(serverData[settings.itemIdField], serverData);
                // Save in local storage
                // In local need to be saved all the list, not just
                // the item; since we have the cache list updated, use that
                // full list to save local
                this.pushToLocal(cache.list);
            }
            api.state.isSaving(false);

            return serverData;
        }.bind(this))
        .catch(function(err) {
            api.state.isSaving(false);
            // Rethrow error
            return err;
        });
    };
    
    api.delItem = function delItem(itemID) {
        
        api.state.isDeleting(true);
        
        // Remove in remote first
        return this.removeItemFromRemote(itemID)
        .then(function(removedData) {
            // Update cache
            cache.delItemCache(itemID);
            // Save in local storage
            // In local need to be saved all the list;
            // since we have the cache list updated, use that
            // full list to save local
            this.pushToLocal(cache.list);

            api.state.isDeleting(false);
            
            return removedData;
        }.bind(this))
        .catch(function(err) {
            api.state.isDeleting(false);
            // Rethrow error
            return err;
        });
    };
    
    /** Some Utils **/
    
    api.asModel = function asModel(object) {
        var Model = this.settings.Model;
        // if is an array, return a list of models
        if (Array.isArray(object)) {
            return object.map(function(item) {
                return new Model(item);
            });
        }
        else {
            return new Model(object);
        }
    };
    
    api.getItemModel = function getItemModel(itemID) {
        return api.getItem(itemID)
        .then(function(data) {
            return data ? api.asModel(data) : null;
        });
    };
    
    var ModelVersion = require('../utils/ModelVersion');
    api.getItemVersion = function getItemVersion(itemID) {
        return api.getItemModel(itemID)
        .then(function(model) {
            return model ? new ModelVersion(model) : null;
        });
    };
    
    api.newItemVersion = function newItemVersion(values) {
        // New original and version for the model
        var version = new ModelVersion(new this.settings.Model(values));
        // To be sure that the version appear as something 'new', unsaved,
        // we update its timestamp to be different to the original.
        version.version.model.touch();
        return version;
    };
}

module.exports = ListRemoteModel;

ListRemoteModel.prototype.addLocalforageSupport = function addLocalforageSupport(baseName) {
    var localforage = require('localforage');

    this.fetchFromLocal = function fetchFromLocal() {
        return localforage.getItem(baseName);
    };
    this.pushToLocal = function pushToLocal(data) {
        return localforage.setItem(baseName, data);
    };
};

ListRemoteModel.prototype.addRestSupport = function addRestSupport(restClient, baseUrl) {
    
    this.fetchFromRemote = function fetchFromRemote() {
        return restClient.get(baseUrl);
    };
    this.pushToRemote = function pushToRemote(data) {

        var itemID = data[this.settings.itemIdField],
            method = itemID ? 'put' : 'post';

        var url = baseUrl + (
            itemID ? '/' + itemID : ''
        );
        return restClient[method](url, data);
    };
    this.removeItemFromRemote = function removeItemFromRemote(itemID) {
        return restClient.delete(baseUrl + '/' + itemID);
    };
};
