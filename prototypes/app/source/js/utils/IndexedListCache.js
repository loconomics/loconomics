/**
    IndexedListCache manages a in-memory cache for a list
    of objects, with indexed access to items
    and cache control.
    
    Settings object as unique parameter:
    listTtl: ttl type constructor. TimeToLife for each group list cache.
    FUTURE: itemTtl: ttl type constructor. TimeToLife for each item cache.
    ttl: ttl type constructor. TimeToLife to use for list and item cache if there is no a more explicit one
    itemIdField: string Name of the field used to uniquely identify each item
    Model: constructor of type Model.
    
    Note: 'ttl type constructor' can be a number of milliseconds or a value to pass to moment.duration constructor (momentjs module).
**/
'use strict';

var CacheControl = require('./CacheControl'),
    jsPropertiesTools = require('./jsPropertiesTools'),
    ko = require('knockout');

function createItemIndexEntry(list, itemIndex) {
    return {
        index: itemIndex,
        get item() {
            return list[this.index];
        }
    };
}

function createIndex(list, byField) {
    var index = {};
    
    list.forEach(function(item, itemIndex) {
        index[ko.unwrap(item[byField])] = createItemIndexEntry(list, itemIndex);
    });

    return index;
}

function required(val, msg) {
    if (val === null || typeof(val) === 'undefined') throw new Error(msg || 'Required parameter');
    else return val;
}

/**
    An item adapter receives the old and the new item data and returns
    the item to hold in the list. The returning object can be a reference
    to the same existent object (oldItem) that gets updated with the 
    new values (newItem), or just the newItem or any conversion over the
    raw newItem data.
    This allows to perform changes, add properties, or keep references,
    like creating observables, Models.
    
    This default implementation just returns the newItem.
**/
function defaultItemAdapter(oldItem, newItem) {
    return newItem;
}

function IndexedListCache(settings) {
    
    settings = settings || {};
    settings.ttl = settings.ttl || 0;
    settings.listTtl = settings.listTtl || settings.ttl || 0;
    //FUTURE: settings.itemTtl = settings.itemTtl || settings.ttl || 0;
    settings.itemIdField = required(settings.itemIdField, 'itemIdField is required');
    settings.itemAdapter = typeof(settings.itemAdapter) === 'function' ? settings.itemAdapter : defaultItemAdapter;

    // Internal flag to notify if the cache was not used still (no data set)
    // since its instantiation. On first setList will change to false and keep in that state.
    var unused = true;
    // Internal cache management
    var cache = {
        control: new CacheControl({ ttl: settings.listTtl }),
        list: ko.observableArray([]),
        index: {/*
            itemIdField: {
                index: Integer (index in the list array),
                item: Object (property referencing to the item object in the array by its index)
                // Maybe future: control: CacheControl per item
            },
            ..
        */}
    };

    /**
        Get the cache entry from the Item
    **/
    function getItemCache(itemID) {
        return cache.index[itemID] || null;
    }

    this.getItemCache = getItemCache;

    // Adapt a new item using the itemAdapter and getting the old reference.
    function adaptItem(newItem) {
        var oldItem = getItemCache(ko.unwrap(newItem[settings.itemIdField]));
        return settings.itemAdapter(oldItem, newItem);
    }
    
    // Adapt the each element in the list with the itemAdapter,
    // passing an old reference and the new item on each, and ensuring
    // to return ever an array, even if empty.
    function adaptList(list) {
        return (list || []).map(adaptItem);
    }

    function setList(list) {
        cache.list(adaptList(list));
        cache.index = createIndex(cache.list(), settings.itemIdField);
        cache.control.latest = new Date();
        unused = false;
    }

    // Public, read-only, access to cache info (objects are mutable, but almost the reference
    // cannot be broken; a change in the list instance updates the cache properly).
    jsPropertiesTools.defineGetter(this, 'control', function() { return cache.control; });
    jsPropertiesTools.defineGetter(this, 'list', function() { return cache.list; });
    jsPropertiesTools.defineSetter(this, 'list', function(list) { return setList(list); });
    jsPropertiesTools.defineGetter(this, 'index', function() { return cache.index; });
    jsPropertiesTools.defineGetter(this, 'unused', function() { return unused; });

    function setItemCache(item) {
        var itemID = ko.unwrap(item[settings.itemIdField]);
        // Look for the entry, to update or insert a new one
        var itemEntry = cache.index[itemID];
        if (itemEntry) {
            // Update entry
            cache.list()[itemEntry.index] = adaptItem(item);
        }
        else {
            // Add to the list
            var itemIndex = cache.list.push(adaptItem(item)) - 1;
            cache.index[itemID] = createItemIndexEntry(cache.list(), itemIndex);
        }
    }

    this.setItemCache = setItemCache;

    function delItemCache(itemID) {
        var itemEntry = cache.index[itemID];
        if (itemEntry) {
            // Update list removing the element in place, without holes
            cache.list.splice(itemEntry.index, 1);
            // Update index by:
            // - Remove itemID entry
            delete cache.index[itemID];
            // - Update every entry with an ID greater than the updated,
            // since they are now one position less in the updated list
            Object.keys(cache.index).forEach(function(key) {
                if (cache.index[key] > itemEntry.index)
                    cache.index[key]--;
            });
        }
    }
    
    this.delItemCache = delItemCache;
}

module.exports = IndexedListCache;
