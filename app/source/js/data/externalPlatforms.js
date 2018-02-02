/**
 * Access to the list of known external platforms for GIGs.
 */

import CachedDataProvider from './helpers/CachedDataProvider';
import LocalForageIndexedListDataProviderDriver from './helpers/LocalForageIndexedListDataProviderDriver';
import LocalForageItemDataProviderDriver from './helpers/LocalForageItemDataProviderDriver';
import RestItemDataProviderDriver from './helpers/RestItemDataProviderDriver';
import RestSingleDataProviderDriver from './helpers/RestSingleDataProviderDriver';
import localforage from './drivers/localforage';
import rest from './drivers/restClient';

const API_NAME = 'external-platforms';

/**
 * Provides access to the list of all external platforms available.
 * @returns {CachedDataProvider<Array<PlainExternalPlatform>>}
 * Usage:
 * - list.onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - list.onLoadError.subscribe(fn) to get notified of errors happening as of onData
 */
export const list = new CachedDataProvider({
    // 1 hour
    ttl: 1 * 60 * 60 * 1000,
    remote: new RestSingleDataProviderDriver(rest, API_NAME),
    local: new LocalForageIndexedListDataProviderDriver(localforage, API_NAME, 'externalPlatformID')
});

/**
 * Provides access to an API to fetch a specific platform data.
 * @param {number} id The externalPlatformID
 * @returns {CachedDataProvider<PlainExternalPlatform>}
 * Usage:
 * - item(externalPlatformID).onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - item(externalPlatformID).onLoadError.subscribe(fn) to get notified of errors happening as of onData
 */
export function item(id) {
    return new CachedDataProvider({
        // 1 hour
        ttl: 1 * 60 * 60 * 1000,
        remote: new RestItemDataProviderDriver(rest, API_NAME, id),
        local: new LocalForageItemDataProviderDriver(localforage, API_NAME, id)
    });
}
