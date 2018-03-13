/**
 * Access to the list of external listings for the user.
 */

import CachedDataProvider from './helpers/CachedDataProvider';
import LocalForageIndexedListDataProviderDriver from './helpers/LocalForageIndexedListDataProviderDriver';
import LocalForageItemDataProviderDriver from './helpers/LocalForageItemDataProviderDriver';
import RestItemDataProviderDriver from './helpers/RestItemDataProviderDriver';
import RestSingleDataProviderDriver from './helpers/RestSingleDataProviderDriver';
import localforage from './drivers/localforage';
import marketplaceProfile from './marketplaceProfile';
import rest from './drivers/restClient';
import userJobProfile from './userJobProfile';
import { list as userListingsList } from './userListings';

const API_NAME = 'me/external-listings';
const LOCAL_KEY = 'external-listings';
const ID_PROPERTY_NAME = 'userExternalListingID';

const localListDriver = new LocalForageIndexedListDataProviderDriver(localforage, LOCAL_KEY, ID_PROPERTY_NAME);

/**
 * Provides access to the list of all external listings.
 * @returns {CachedDataProvider<Array<rest/UserExternalListing>>}
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

/**
 * Provides access to an API to fetch a specific record.
 * @param {number} id The userExternalListingID
 * @returns {CachedDataProvider<rest/UserExternalListing>}
 * Usage:
 * - item(platformID).onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - item(platformID).onDataError.subscribe(fn) to get notified of errors happening as of onData
 */
export function item(id) {
    const localItemDriver = new LocalForageItemDataProviderDriver(localforage, LOCAL_KEY, id, ID_PROPERTY_NAME);
    const itemProvider = new CachedDataProvider({
        // 1 minutes
        ttl: 1 * 60 * 1000,
        remote: new RestItemDataProviderDriver(rest, API_NAME, id),
        local: localItemDriver
    });

    // Keep list notified because of item changes
    itemProvider.onCacheChanged.subscribe((cache) => {
        if (cache && cache.data) {
            // Data stored:
            // ensure the item (maybe new) is registered in the index (then, included in the list)
            // (we use data[prop] because the ID could have set in the server, so
            // scoped 'id' has not a relevant value)
            localListDriver.registerID(cache.data[ID_PROPERTY_NAME]);
        }
        else {
            // Data removed:
            // the item needs to be removed from the index
            localListDriver.unregisterID(id);
        }
        // If someone subscribed to new list data
        if (list.onLoaded.count) {
            // We need to notify them, but we need the full list
            // and we just have an item, load it from cache and provide it
            localListDriver.fetch()
            .then((cache) => {
                // A change is like list data was loaded and cache changed with
                // new data. All relevants events needs to be notified, preferibly
                // in same internal order.
                list.onCachedData.emit(cache);
                list.onCacheChanged.emit(cache);
                list.onLoaded.emit(cache.data);
                // take care that onData is connected to onLoaded, so already
                // triggered.
            });
        }
    });

    /* In theory, if an updated load of the list happens in the meantime with
        an item() in use, we must notify the item of that new data.
        It's very strange for this to happens because of use cases, but in theory can happens.
        Next commented code can do that, BUT it will leak memory if we don't
        add an explicit disposal of the subscription when 'itemProvider' is
        not used anymore. With subscriptions in previous lines don't happens
        because are done to the own instance, while this subscription is done on the list
        and inside it holds a reference to 'itemProvider', preventing it from GC'ed.

    list.onRemoteLoaded.subscribe((list) => {
        const found = list.some((item) => {
            if (item[ID_PROPERTY_NAME] === id) {
                itemProvider.onLoaded.emit(item);
                return true;
            }
        });
        // If not found in updated list, means was deleted in the middle, notify
        // (actual deletion of local data happens already as part of the list
        // synching process, before of this).
        if (!found) {
            itemProvider.onDeleted.emit();
        }
    });
    */
    // Return the instance
    return itemProvider;
}

// Whenever a change is know in external listings,
// we must invalidate the listings data since some job titles could have
// being added automatically as of being included in an external listing.
const invalidateListings = () => {
    userJobProfile.invalidateCache();
    marketplaceProfile.invalidateCache();
    userListingsList.invalidateCache();
};
list.onCacheChanged.subscribe(invalidateListings);
list.onCacheInvalidated.subscribe(invalidateListings);
