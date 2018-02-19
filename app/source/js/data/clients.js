/**
 * Management of the user clients list,
 * local and remote.
 * It allows to make a public search of known clients
 */
import CachedDataProvider from './helpers/CachedDataProvider';
import LocalForageIndexedListDataProviderDriver from './helpers/LocalForageIndexedListDataProviderDriver';
import LocalForageItemDataProviderDriver from './helpers/LocalForageItemDataProviderDriver';
import RestItemDataProviderDriver from './helpers/RestItemDataProviderDriver';
import RestSingleDataProviderDriver from './helpers/RestSingleDataProviderDriver';
import localforage from './drivers/localforage';
import rest from './drivers/restClient';
import session from './session';

const API_NAME = 'me/clients';
const LOCAL_KEY = 'clients';
const ID_PROPERTY_NAME = 'clientUserID';

const localListDriver = new LocalForageIndexedListDataProviderDriver(localforage, LOCAL_KEY, ID_PROPERTY_NAME);

/**
 * Provides access to the list with all records.
 * @returns {CachedDataProvider<Array<rest/Client>>}
 * Usage:
 * - list.onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - list.onDataError.subscribe(fn) to get notified of errors happening as of onData
 */
export const list = new CachedDataProvider({
    // 1 minute
    ttl: 1 * 60 * 1000,
    remote: new RestSingleDataProviderDriver(rest, API_NAME),
    local: localListDriver
});

session.on.cacheCleaningRequested.subscribe(function() {
    list.clearCache();
});

/**
 * Provides access to an API to fetch a specific record.
 * @param {number} id The clientUserID
 * @returns {CachedDataProvider<rest/Client>}
 * Usage:
 * - item(itemID).onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - item(itemID).onDataError.subscribe(fn) to get notified of errors happening as of onData
 * - item(itemID).save(newData)->Promise
 * - item(itemID).delete()->Promise
 */
export function item(id) {
    const localItemDriver = new LocalForageItemDataProviderDriver(localforage, LOCAL_KEY, id, ID_PROPERTY_NAME);
    const itemProvider = new CachedDataProvider({
        // 1 minutes
        ttl: 1 * 60 * 1000,
        remote: new RestItemDataProviderDriver(rest, API_NAME, id),
        local: localItemDriver
    });
    // List is dirty once an item is updated on cache directly.
    const invalidateList = list.invalidateCache.bind(list);
    itemProvider.onCacheChanged.subscribe(invalidateList);
    itemProvider.onCacheInvalidated.subscribe(invalidateList);
    /* Inverse notifications, list->item: not possible still see details at similar userExternalListings */

    // Return the instance
    return itemProvider;
}

/**
 * @private {XHR} Reference to current public search request instance, to prevent concurrent
 * requests, previous one is cancelled.
*/
let publicSearchRequest = null;

/**
 * Public search of users, possible clients by well
 * know fields, with full value match.
 * @param {Object} search
 * @returns {Promise<Array<rest/Client>>}
 */
export function publicSearch(search) {

    // Only one request at a time
    if (publicSearchRequest &&
        publicSearchRequest.abort) {
        try {
            publicSearchRequest.abort();
        } catch (abortErr) {
            console.error('Error aborting request', abortErr);
        }
    }

    var request = rest.get('me/clients/public-search', search);
    publicSearchRequest = request.xhr;

    // Catch 'abort' to avoid communicate a fake error in the promise; the
    // promise will just solve as success with empty array.
    request = request.catch(function(err) {
        if (err && err.statusText === 'abort')
            return [];
        else
            // Rethrow only if is not an 'abort'
            throw err;
    });
    // Set again, removed by the catch returned promise
    request.xhr = publicSearchRequest;

    return request;
}
