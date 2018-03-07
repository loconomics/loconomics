/**
 * Management of the user job profile/listing (list of job titles
 * with their settings),
 * local and remote.
 *
 * @deprecated data/userListings must be used instead for read only tasks, when
 * it stills needs to be completed on edition APIs
 */
// TODO store-jsdocs
'use strict';

import SingleEvent from '../utils/SingleEvent';

var CacheControl = require('./helpers/CacheControl');
var session = require('./session');

var defaultTtl = { minutes: 1 };
var cache = {
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

/**
 * Notice when the cache has changed. It's a notice without data.
 * Added for interactions with data module userListing tha must invalidate data
 * on changes here, since is the same data but stored cache under different places
 * @member {SingleEvent}
 */
exports.cacheChangedNotice = new SingleEvent(exports);

exports.clearCache = function clearCache() {
    cache.userJobProfile.cache.latest = null;
    cache.userJobProfile.list = [];
    cache.userJobTitles = {};
    exports.cacheChangedNotice.emit();
};

/**
 * Tags cache as invalid, forcing a refresh next time data is accessed
*/
exports.invalidateCache = function() {
    cache.userJobProfile.cache.latest = null;
    exports.cacheChangedNotice.emit();
};

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});

