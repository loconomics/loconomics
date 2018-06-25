/**
 * Access to the list of known platforms for GIGs, based on ones available to
 * the user depending on its listing/job-titles.
 */

import CachedDataProvider from './helpers/CachedDataProvider';
import LocalForageIndexedListDataProviderDriver from './helpers/LocalForageIndexedListDataProviderDriver';
import LocalForageItemDataProviderDriver from './helpers/LocalForageItemDataProviderDriver';
import LocalForageSingleDataProviderDriver from './helpers/LocalForageSingleDataProviderDriver';
import RestItemDataProviderDriver from './helpers/RestItemDataProviderDriver';
import RestSingleDataProviderDriver from './helpers/RestSingleDataProviderDriver';
import localforage from './drivers/localforage';
import rest from './drivers/restClient';

const API_NAME = 'me/platforms';
const LOCAL_KEY = 'platforms';

/**
 * Provides access to the list of all platforms available.
 * @returns {CachedDataProvider<Array<rest/Platform>>}
 * Usage:
 * - list.onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - list.onDataError.subscribe(fn) to get notified of errors happening as of onData
 */
export const list = new CachedDataProvider({
    // 10 minutes
    ttl: 10 * 60 * 1000,
    remote: new RestSingleDataProviderDriver(rest, API_NAME),
    local: new LocalForageIndexedListDataProviderDriver(localforage, LOCAL_KEY, 'platformID')
});

/**
 * Provides access to an API to fetch a specific platform data.
 * @param {number} id The platformID
 * @returns {CachedDataProvider<rest/Platform>}
 * Usage:
 * - item(platformID).onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - item(platformID).onDataError.subscribe(fn) to get notified of errors happening as of onData
 */
export function item(id) {
    return new CachedDataProvider({
        // 10 minutes
        ttl: 10 * 60 * 1000,
        remote: new RestItemDataProviderDriver(rest, API_NAME, id),
        local: new LocalForageItemDataProviderDriver(localforage, LOCAL_KEY, id)
    });
}

const API_ALL_PUBLIC_NAME = 'platforms';
const LOCAL_ALL_PUBLIC_KEY = 'all-platforms';

/**
 * Provides access to the list of all platforms registed in the system and
 * publicly available.
 * IMPORTANT: does NOT provides the smart and convenient filtering by user
 * that 'list' has.
 * @returns {CachedDataProvider<Array<rest/Platform>>}
 * Usage:
 * - list.onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - list.onDataError.subscribe(fn) to get notified of errors happening as of onData
 */
export const allRegisteredPlatforms = new CachedDataProvider({
    // 1 day
    ttl: 24 * 60 * 60 * 1000,
    remote: new RestSingleDataProviderDriver(rest, API_ALL_PUBLIC_NAME),
    local: new LocalForageSingleDataProviderDriver(localforage, LOCAL_ALL_PUBLIC_KEY)
});
