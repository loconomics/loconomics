/**
    IndexedGroupListCache manages a in-memory cache for a list
    of objects, grouped by a field and with indexed access to groups
    and items, with cache control.
    
    Settings object as unique parameter:
    listTtl: ttl type constructor. TimeToLife for each group list cache.
    FUTURE: itemTtl: ttl type constructor. TimeToLife for each item cache.
    ttl: ttl type constructor. TimeToLife to use for list and item cache if there is no a more explicit one
    groupIdField: string Name of the field used to group objects
    itemIdField: string Name of the field used to uniquely identify each item
    FUTURE: Model: constructor of type Model.
    
    Note: 'ttl type constructor' can be a number of milliseconds or a value to pass to moment.duration constructor (momentjs module).
**/
'use strict';

var CacheControl = require('./CacheControl');

function createIndex(list, byField) {
    var index = {};
    
    list.forEach(function(item, itemIndex) {
        index[item[byField]] = {
            index: itemIndex,
            item: item
            // Direct referenc, could be a property too auto resolving as
            // something like get item() { return list[itemIndex[item[byField]]] || null; }
        };
    });

    return index;
}

function required(val, msg) {
    if (val === null || typeof(val) === 'undefined') throw new Error(msg || 'Required parameter');
    else return val;
}

function IndexedGroupListCache(settings) {
    
    settings = settings || {};
    settings.ttl = settings.ttl || 0;
    settings.listTtl = settings.listTtl || settings.ttl || 0;
    //FUTURE: settings.itemTtl = settings.itemTtl || settings.ttl || 0;
    settings.groupIdField = required(settings.groupIdField, 'groupIdField is required');
    settings.itemIdField = required(settings.itemIdField, 'itemIdField is required');
    //FUTURE: settings.Model = settings.Model || throw new Error('A Model is required');
    
    var cache = {/*
        groupIdField: {
            control: CacheControl,
            list: Array,
            index: {
                itemIdField: {
                    index: Integer (index in the list array),
                    item: Object (reference to the item object in the array)
                    // Maybe future: control: CacheControl per item
                },
                ..
            }
        },
        ..
    */};
    
    this.clearCache = function clearCache() {
        cache = {};
    };

    function newCacheEntry(list) {
        return {
            control: new CacheControl({ ttl: settings.listTtl }),
            list: list || null,
            index: list && createIndex(list, settings.itemIdField) || {}
        };
    }

    function setGroupCache(groupID, list) {
        var cacheEntry = cache[groupID];
        if (cacheEntry) {
            cacheEntry.list = list || [];
            cacheEntry.index = createIndex(list || [], settings.itemIdField);
        }
        else {
            cacheEntry = cache[groupID] = newCacheEntry(list);
        }
        cacheEntry.control.latest = new Date();
    }
    
    this.setGroupCache = setGroupCache;

    /**
        Get the cache entry for the Group
    **/
    function getGroupCache(groupID) {
        var cacheEntry = cache[groupID];
        return cacheEntry || newCacheEntry();
    }
    
    this.getGroupCache = getGroupCache;

    /**
        Get the cache entry from the Item
    **/
    function getItemCache(groupID, itemID) {
        var cacheEntry = cache[groupID];
        if (cacheEntry) {
            return cacheEntry.index[itemID] || null;
        }
        else {
            return null;
        }
    }
    
    this.getItemCache = getItemCache;

    function setItemCache(groupID, itemID, item) {
        var cacheEntry = cache[groupID] || newCacheEntry([]);
        
        // Loof for the entry, to update or insert a new one
        var itemEntry = cacheEntry.index[itemID];
        if (itemEntry) {
            // Update entry
            cacheEntry.list[itemEntry.index] = item;
            // Update reference in the index too (is not computed right now)
            itemEntry.item = item;
        }
        else {
            // Add to the list
            var itemIndex = cacheEntry.list.push(item) - 1;
            cacheEntry.index[itemID] = {
                index: itemIndex,
                item: item
            };
        }
    }
    
    this.setItemCache = setItemCache;

    function delItemCache(groupID, itemID) {
        var groupEntry = cache[groupID] || null;
        if (groupEntry) {
            var itemEntry = groupEntry.index[itemID];
            if (itemEntry) {
                // Update list removing the element in place, without holes
                groupEntry.list.splice(itemEntry.index, 1);
                // Update index by:
                // - Remove itemID entry
                delete groupEntry.index[itemID];
                // - Update every entry with an ID greater than the updated,
                // since they are now one position less in the updated list
                Object.keys(groupEntry.index).forEach(function(key) {
                    if (groupEntry.index[key].index > itemEntry.index)
                        groupEntry.index[key].index--;
                });
            }
        }
    }
    
    this.delItemCache = delItemCache;
    
    function delGroupCache(groupID) {
        var groupEntry = cache[groupID] || null;
        if (groupEntry) {
            // Delete the entry/property
            delete cache[groupID];
        }
    }
    
    this.delGroupCache = delGroupCache;
}

module.exports = IndexedGroupListCache;
