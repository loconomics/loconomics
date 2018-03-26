/**
 * Access lists of badges assigned to the logged user.
 */

import CachedDataProvider from './helpers/CachedDataProvider';
import LocalForageItemDataProviderDriver from './helpers/LocalForageItemDataProviderDriver';
import LocalForageSingleDataProviderDriver from './helpers/LocalForageSingleDataProviderDriver';
import RestItemDataProviderDriver from './helpers/RestItemDataProviderDriver';
import RestSingleDataProviderDriver from './helpers/RestSingleDataProviderDriver';
import localforage from './drivers/localforage';
import rest from './drivers/restClient';

const API_NAME = 'me/badges';
const LOCAL_KEY = 'badges';

/**
 * Get and manage individual user badges entries.
 * @param {number} id The userBadgeID
 * @returns {CachedDataProvider<rest/UserBadge>}
 * Usage:
 * - const provider = item(userBadgeID);
 * - provider.onData.subscribe(fn) to fetch data, fn keeps being triggered on incoming updated data
 * - provider.onDataError.subscribe(fn) to get notified of errors happening as of onData
 * - provider.onceLoaded().then(..).catch(..) to fetch fresh data, usually slower, good for editors
 * - provider.save(data)
 * - provider.delete()
 */
export function item(id) {
    return new CachedDataProvider({
        // 5 minutes
        ttl: 5 * 60 * 1000,
        remote: new RestItemDataProviderDriver(rest, API_NAME, id),
        local: new LocalForageItemDataProviderDriver(localforage, LOCAL_KEY, id)
    });
}

/**
 * Provides access to an API to fetch a specific platform data.
 * @param {number} id The platformID
 * @returns {CachedDataProvider<rest/Platform>}
 * Usage:
 * - item(platformID).onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - item(platformID).onDataError.subscribe(fn) to get notified of errors happening as of onData
 */
export function byListing(userListingID) {
    return new CachedDataProvider({
        // 10 minutes
        ttl: 10 * 60 * 1000,
        remote: new RestSingleDataProviderDriver(rest, API_NAME + '/' + userListingID),
        local: new LocalForageSingleDataProviderDriver(localforage, LOCAL_KEY + '/' + userListingID)
    });
}
