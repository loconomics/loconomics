/**
 * Access to the list of external listings for the user.
 */

import CachedDataProvider from './helpers/CachedDataProvider';
import LocalForageIndexedListDataProviderDriver from './helpers/LocalForageIndexedListDataProviderDriver';
import LocalForageItemDataProviderDriver from './helpers/LocalForageItemDataProviderDriver';
import RestItemDataProviderDriver from './helpers/RestItemDataProviderDriver';
import RestSingleDataProviderDriver from './helpers/RestSingleDataProviderDriver';
import localforage from './drivers/localforage';
import rest from './drivers/restClient';

const API_NAME = 'me/external-listings';
const LOCAL_KEY = 'external-listings';

/**
 * Provides access to the list of all external listings.
 * @returns {CachedDataProvider<Array<rest/UserExternalListing>>}
 * Usage:
 * - list.onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - list.onLoadError.subscribe(fn) to get notified of errors happening as of onData
 */
export const list = new CachedDataProvider({
    // 1 minute
    ttl: 1 * 60 * 1000,
    remote: new RestSingleDataProviderDriver(rest, API_NAME),
    local: new LocalForageIndexedListDataProviderDriver(localforage, LOCAL_KEY, 'userExternalListingID')
});

/**
 * Provides access to an API to fetch a specific record.
 * @param {number} id The userExternalListingID
 * @returns {CachedDataProvider<rest/UserExternalListing>}
 * Usage:
 * - item(platformID).onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - item(platformID).onLoadError.subscribe(fn) to get notified of errors happening as of onData
 */
export function item(id) {
    return new CachedDataProvider({
        // 1 minutes
        ttl: 1 * 60 * 1000,
        remote: new RestItemDataProviderDriver(rest, API_NAME, id),
        local: new LocalForageItemDataProviderDriver(localforage, LOCAL_KEY, id)
    });
}
