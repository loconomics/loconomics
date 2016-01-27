/**
    GroupRemoteModel
    Utility class for common code that has remote entities grouped
    by a value but accesed all the time individually.
    It has local copy and cache.
    Difference with GroupListRemoteModel its that the content is NOT
    a list, but an entity.
**/
'use strict';

var ko = require('knockout');
var CacheControl = require('./CacheControl');

function required(val, msg) {
    if (val === null || typeof(val) === 'undefined') throw new Error(msg || 'Required parameter');
    else return val;
}

function GroupRemoteModel(settings) {
    
    settings = settings || {};
    settings.ttl = required(settings.ttl, 'ttl is required');
    settings.itemIdField = required(settings.itemIdField, 'itemIdField is required');
    settings.Model = required(settings.Model, 'Model is required');
    // Required for API additions
    this.settings = settings;

    this.state = {
        isLoading: ko.observable(false),
        isSyncing: ko.observable(false),
        isSaving: ko.observable(false),
        isDeleting: ko.observable(false)
    };

    var cache = {
        // 'indexID': { data, control:CacheControl }
    };
    var setItemCache = function(itemID, data) {
        if (cache[itemID]) {
            cache[itemID].data.model.updateWith(data);
            cache[itemID].control.touch();
        }
        else {
            cache[itemID] = {
                data: new settings.Model(data),
                control: new CacheControl({
                    ttl: settings.ttl
                })
            };
        }
        return cache[itemID];
    };

    this.clearCache = function() {
        cache = {};
    };

    this.state.isLocked = ko.pureComputed(function() {
        return this.isLoading() || this.isSaving() || this.isDeleting();
    }, this.state);

    /** Data Stores Management: implementation must be replaced, with custom code or using
        the helpers added to the class (see addXxSupport prototype methods).
    **/
    function notImplemented() { throw new Error('Not Implemented'); }
    this.fetchItemFromLocal = notImplemented;
    this.fetchItemFromRemote = notImplemented;
    this.pushItemToLocal = notImplemented;
    this.pushItemToRemote = notImplemented;
    this.removeItemFromLocal = notImplemented;
    this.removeItemFromRemote = notImplemented;

    /** API definition **/
    var api = this;

    api.getItem = function getItem(itemID, forceRemoteLoad) {
        var cacheEntry = cache[itemID];

        if (forceRemoteLoad || !cacheEntry || cacheEntry.control.mustRevalidate()) {
            // No cache data, is first load, try from local
            if (!cacheEntry || !cacheEntry.data) {
                api.state.isLoading(true);
                // From local
                return this.fetchItemFromLocal(itemID)
                .then(function(data) {
                    // launch remote for sync
                    api.state.isSyncing(true);
                    var remotePromise = this.fetchItemFromRemote(itemID)
                    .then(function(serverData) {
                        var cached = setItemCache(itemID, serverData);
                        this.pushItemToLocal(itemID, serverData);
                        api.state.isSyncing(false);
                        return cached.data;
                    }.bind(this));
                    // Remote fallback: If no local, wait for remote
                    return data ? data : remotePromise;
                }.bind(this))
                .then(function(data) {
                    var cached = setItemCache(itemID, data);
                    api.state.isLoading(false);
                    return cached.data;
                }.bind(this))
                .catch(function(err) {
                    api.state.isLoading(false);
                    api.state.isSyncing(false);
                    // rethrow error
                    throw err;
                });
            } else {
                api.state.isSyncing(true);
                // From remote
                return this.fetchItemFromRemote(itemID)
                .then(function(data) {
                    var cached = setItemCache(itemID, data);
                    this.pushItemToLocal(itemID, data);
                    api.state.isLoading(false);
                    api.state.isSyncing(false);

                    return cached.data;
                }.bind(this))
                .catch(function(err) {
                    api.state.isLoading(false);
                    api.state.isSyncing(false);
                    // rethrow error
                    throw err;
                });
            }
        }
        else {
            // From cache
            return Promise.resolve(cacheEntry.data);
        }
    };

    /**
        Save an item in cache, local and remote.
        Can be new or updated.
        The IDs goes with all the other data, being
        itemID required for updates
        but falsy for insertions.
        @param data:object Plain object
    **/
    api.setItem = function setItem(data) {
        
        // Get plain data if is model
        data = data && data.model && data.model.toPlainObject(true) || data;
        
        api.state.isSaving(true);
        // Send to remote first
        return this.pushItemToRemote(data[settings.itemIdField], data)
        .then(function(serverData) {
            var cached;
            // Success! update local copy with returned data
            // IMPORTANT: to use server data here so we get values set
            // by the server, as updates dates and itemID when creating
            // a new item.
            if (serverData) {
                var itemID = serverData[settings.itemIdField];
                // Save in cache
                cached = setItemCache(serverData[settings.itemIdField], serverData);
                // Save in local storage
                // In local need to be saved all the grouped data, not just
                // the item; since we have the cache list updated, use that
                // full list to save local
                this.pushItemToLocal(itemID, cached.data.model.toPlainObject(true));
            }
            api.state.isSaving(false);

            return cached && cached.data;
        }.bind(this))
        .catch(function(err) {
            api.state.isSaving(false);
            // Rethrow error
            throw err;
        });
    };
    
    api.delItem = function delItem(itemID) {
        
        api.state.isDeleting(true);
        
        // Remove in remote first
        return this.removeItemFromRemote(itemID)
        .then(function(removedData) {
            // Update cache
            delete cache[itemID];
            // Update local storage
            this.removeItemFromLocal(itemID);

            api.state.isDeleting(false);
            
            return removedData;
        }.bind(this))
        .catch(function(err) {
            api.state.isDeleting(false);
            // Rethrow error
            throw err;
        });
    };
    
    /** Some Utils **/
    var ModelVersion = require('../utils/ModelVersion');
    /**
        Gets immediately an object based on ModelVersion
        with the original and version being the cached version
        if any or an empty Model (instance without data).
        If there is no data, it triggers a load automatically
        setting its state flag isLoading to true until ends.
        If there are data but is obsolete, it triggers a 
        load automatically settings its state  flag isSyncing
        to true until ends.
        It adds a load method to trigger loading of the original
        from remote, and it triggers ModelVersion.sync on finishing
        (isSyncing is flagged); returns Promise
        It adds a save method to trigger saving the version
        to remote, and it push the changes to the original on success
        (isSaving is flagged); returns Promise.
    **/
    api.getItemVersion = function getItemVersion(itemID) {
        
        var cached = cache[itemID],
            initialModel = cached && cached.data || new settings.Model(),
            version = new ModelVersion(initialModel);
        
        // Extend with state flags
        version.state = {
            isLoading: ko.observable(false),
            isSyncing: ko.observable(false),
            isSaving: ko.observable(false),
            // Not just a flag, it contains any error
            // on loading/saving. It no value/null, no error
            lastError: ko.observable(null)
            //isDeleting: ko.observable(false)
        };

        // First time load, if needed:
        if (itemID && (!cached || cached.mustRevalidate())) {
            version.state.isLoading(true);
            api.getItem(itemID)
            .then(function(model) {
                version.state.lastError(null);
                version.state.isLoading(false);
                version.original.model.updateWith(model, true);
                version.version.model.updateWith(model, true);
            })
            .catch(function(err) {
                version.state.lastError(err);
                version.state.isLoading(false);
            });
        }
        
        version.load = function load(newItemID, forceRemoteLoad) {
            version.state.isSyncing(true);
            // Use the new itemID, OR use the one at the original model.
            // Why not the closure itemID?
            // The ID could get updated in a save process,
            // because autogenerating one for a new item.
            var oItemID = newItemID || version.original[settings.itemIdField]();
            return api.getItem(oItemID, forceRemoteLoad)
            .then(function(model) {
                version.state.lastError(null);
                version.state.isSyncing(false);
                version.original.model.updateWith(model, true);
                //// Try sync, if original is newer will replace version
                //version.sync();
                // pull changes from the new original
                version.pull({ eventIfNewer: true });
                return model;
            })
            .catch(function(err) {
                version.state.lastError(err);
                version.state.isSyncing(false);
                // rethrow error
                throw err;
            });
        };
        
        version.reset = function reset() {
            version.original.model.reset();
            version.version.model.reset();
        };
        
        version.save = function save() {
            version.state.isSaving(true);
            return api.setItem(version.version)
            .then(function(model) {
                version.state.lastError(null);
                version.state.isSaving(false);
                version.version.model.updateWith(model, true);
                // push changes to the original
                version.push({ evenIfObsolete: true });
                return model;
            })
            .catch(function(err) {
                version.state.lastError(err);
                version.state.isSaving(false);
                // rethrow error
                throw err;
            });
        };

        return version;
    };
    
    api.newItemVersion = function newItemVersion(values) {
        var version = api.getItemVersion();
        // Initial data
        if (values)
            version.version.model.updateWith(values, true);
        // To be sure that the version appear as something 'new', unsaved,
        // we update its timestamp to be different to the original.
        version.version.model.touch();
        return version;
    };
}

module.exports = GroupRemoteModel;

GroupRemoteModel.prototype.addLocalforageSupport = function addLocalforageSupport(baseName) {
    var localforage = require('localforage');

    this.fetchItemFromLocal = function fetchFromLocal(itemID) {
        return localforage.getItem(baseName + itemID);
    };
    this.pushItemToLocal = function pushToLocal(itemID, data) {
        return localforage.setItem(baseName + itemID, data);
    };
    this.remoteItemFromLocal = function remoteFromLocal(itemID) {
        return localforage.removeItem(baseName + itemID);
    };
};

GroupRemoteModel.prototype.addRestSupport = function addRestSupport(restClient, baseUrl) {

    this.fetchItemFromRemote = function fetchFromRemote(itemID) {
        return restClient.get(baseUrl + itemID);
    };
    this.pushItemToRemote = function pushToRemote(itemID, data) {

        var method = itemID ? 'put' : 'post';

        var url = baseUrl + (
            itemID ? '/' + itemID : ''
        );
        return restClient[method](url, data);
    };
    this.removeItemFromRemote = function removeItemFromRemote(itemID) {
        return restClient.delete(baseUrl + itemID);
    };
};
