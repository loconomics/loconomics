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
    /*jshint maxstatements:50*/

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
    
    // Items are managed as plain object by default, but as permanent, updated
    // model instances if the Model class was specified.
    // This adapter is passed to the cache constructor too keep the in-memory
    // objects up to date with the correct structure.
    function itemAdapter(oldItem, newItem) {
        if (settings.Model) {
            // If the model item already exists, update with new values
            if (oldItem && oldItem instanceof settings.Model) {
                oldItem.model.updateWith(newItem);
                return oldItem;
            }
            else {
                // New created item.
                // If there was a previous, no-model, value, they are discarded
                // (that situation can only happens if there are irregular modifications
                // of the internal behavior).
                return new settings.Model(newItem);
            }
        }
        else {
            return newItem;
        }
    }
    
    var cache = new IndexedListCache({
        listTtl: settings.listTtl,
        itemIdField: settings.itemIdField,
        itemAdapter: itemAdapter
    });

    this.state.isLocked = ko.pureComputed(function() {
        return this.isLoading() || this.isSaving() || this.isDeleting();
    }, this.state);

    /** Data Stores Management: implementation must be replaced, with custom code or using
        the helpers added to the class (see addXxSupport prototype methods).
    **/
    function notImplemented() { throw new Error('Not Implemented'); }
    this.fetchListFromLocal = notImplemented;
    this.fetchListFromRemote = notImplemented;
    this.pushListToLocal = notImplemented;
    this.pushListToRemote = notImplemented;
    this.removeItemFromRemote = notImplemented;
    
    /**
        Retrieves a plain array-objects from the cached list
    **/
    function getPlainCachedList() {
        var arr = cache.list();
        return arr.map(function(item) {
            if (item && settings.Model && item instanceof settings.Model) {
                return item.model.toPlainObject();
            }
            else {
                return item;
            }
        });
    }

    /** API definition **/
    var api = this;
    
    // Direct access to the observable cached list.
    api.list = cache.list;
    
    api.sync = function sync() {
        api.getList();
    };

    /**
        Promise based request to get the list (from cache, local or remote).
        It updates the observable list if new data is fetched.
        A general approach is to use the observable list and call the 'sync' method
        rather than wait this promise to finish ('sync' performs this load really).
    **/
    api.getList = function getList() {

        if (cache.control.mustRevalidate()) {
            // Cache still not used, then is first load, try load from local
            if (cache.unused) {
                api.state.isLoading(true);
                // From local
                return this.fetchListFromLocal()
                .then(function(data) {
                    // launch remote for sync
                    api.state.isSyncing(true);
                    var remotePromise = this.fetchListFromRemote()
                    .then(function(serverData) {
                        cache.list = serverData;
                        this.pushListToLocal(serverData);
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
                    this.pushListToLocal(data);
                    api.state.isLoading(false);

                    return cache.list;
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
                return this.fetchListFromRemote()
                .then(function(data) {
                    // Ever a list, even if empty
                    data = data || [];
                    cache.list = data;
                    this.pushListToLocal(data);
                    api.state.isLoading(false);
                    api.state.isSyncing(false);

                    return cache.list;
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
        Generates and returns an observable inmediately,
        launching an item load that will update the observable
        on ready.
    **/
    api.getObservableItem = function getObservableItem(itemID) {
        var obs = ko.observable(undefined);
        api.getItem(itemID)
        .then(function(itemModel) {
            obs(itemModel);
        });
        return obs;
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
        return this.pushListToRemote(data)
        .then(function(serverData) {
            // Success! update local copy with returned data
            // IMPORTANT: to use server data here so we get values set
            // by the server, as updates dates and itemID when creating
            // a new item.
            if (serverData) {
                // Save in cache
                cache.setItemCache(serverData);
                // Save in local storage
                // In local need to be saved all the list, not just
                // the item; since we have the cache list updated, use that
                // full list to save local
                this.pushListToLocal(getPlainCachedList());
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
            this.pushListToLocal(getPlainCachedList());

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

    var ModelVersion = require('../utils/ModelVersion');
    /**
        It creates a new ModelVersion for the requested item ID
        after load the item.
        The promise returns the ModelVersion ready, or null
        if the item does not exists.
    **/
    api.createItemVersion = function createItemVersion(itemID) {
        return api.getItem(itemID)
        .then(function(model) {
            return model ? new ModelVersion(model) : null;
        });
    };

    /**
        It creates a new Model instance with the given initial values,
        returning a ModelVersion object.
        The versioning allows to track the initial
        state (if comes from a set of defaults or clone) with
        the changes done; the internal version notifies itself
        as 'unsaved' ever.
        Its useful to keep the same ModelVersion aware code for
        editions and additions.
    **/
    api.newItem = function newItem(values) {
        // New original and version for the model
        var version = new ModelVersion(new settings.Model(values));
        // To be sure that the version appear as something 'new', unsaved,
        // we update its timestamp to be different to the original.
        version.version.model.touch();
        return version;
    };
}

module.exports = ListRemoteModel;

ListRemoteModel.prototype.addLocalforageSupport = function addLocalforageSupport(baseName) {
    var localforage = require('localforage');

    this.fetchListFromLocal = function fetchListFromLocal() {
        return localforage.getItem(baseName);
    };
    this.pushListToLocal = function pushListToLocal(data) {
        return localforage.setItem(baseName, data);
    };
};

ListRemoteModel.prototype.addRestSupport = function addRestSupport(restClient, baseUrl) {
    
    this.fetchListFromRemote = function fetchListFromRemote() {
        return restClient.get(baseUrl);
    };
    this.pushListToRemote = function pushListToRemote(data) {

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
