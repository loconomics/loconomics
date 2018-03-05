/**
 * Access to the list of listings for the user.
 *
 * IMPORTANT: Exists a duplication with this same data being managed at the
 * module userJobProfile, that one should be replaced with this when fully
 * implements the needed APIs accordingly to new patterns.
 *
 * IMPORTANT: This module follows the same design as userExternalListing, with
 * code that still can be enhanced (mainly the item management) and code
 * duplication that can fit into a helper.
 */

import CachedDataProvider from './helpers/CachedDataProvider';
import LocalForageIndexedListDataProviderDriver from './helpers/LocalForageIndexedListDataProviderDriver';
import LocalForageItemDataProviderDriver from './helpers/LocalForageItemDataProviderDriver';
import RestItemDataProviderDriver from './helpers/RestItemDataProviderDriver';
import RestSingleDataProviderDriver from './helpers/RestSingleDataProviderDriver';
import localforage from './drivers/localforage';
import rest from './drivers/restClient';
import userJobProfile from './userJobProfile';

const API_NAME = 'me/user-job-profile';
const LOCAL_KEY = 'listings';
const ID_PROPERTY_NAME = 'jobTitleID';

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
 * @param {number} id The jobTitleID
 * @returns {CachedDataProvider<rest/UserListing>} formerly the type is <rest/UserJobTitle>
 * Usage:
 * - const dataProvider = item(jobTitleID)
 * - dataProvider.onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - dataProvider.onDataError.subscribe(fn) to get notified of errors happening as of onData
 */
export function item(id) {
    const localItemDriver = new LocalForageItemDataProviderDriver(localforage, LOCAL_KEY, id, ID_PROPERTY_NAME);
    const itemProvider = new CachedDataProvider({
        // 1 minutes
        ttl: 1 * 60 * 1000,
        remote: new RestItemDataProviderDriver(rest, API_NAME, id),
        local: localItemDriver
    });
    const notifyList = function() {
        // If someone subscribed to new list data
        if (list.onLoaded.count) {
            // We need to notify them, but we need the full list
            // and we just have an item, load it from cache and provide it
            localListDriver.fetch().then((cache) => list.onLoaded.emit(cache.data));
        }
    };
    // Keep list notified because of item updates
    itemProvider.onRemoteLoaded.subscribe((itemData) => {
        // ensure the fresh item is registered in the index (then, included in the list)
        localListDriver.registerID(itemData[ID_PROPERTY_NAME]);
        notifyList();
    });
    itemProvider.onDeleted.subscribe((itemData) => {
        // the item needs to be removed from the index
        localListDriver.unregisterID(itemData[ID_PROPERTY_NAME]);
        notifyList();
    });
    itemProvider.onSaved.subscribe((itemData) => {
        // ensure the item (maybe new) is registered in the index (then, included in the list)
        localListDriver.registerID(itemData[ID_PROPERTY_NAME]);
        notifyList();
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

// Invalidate this data on data updates at userJobProfile that has it's own
// copy of the same data and implements the editing capabilities
userJobProfile.cacheChangedNotice.subscribe(() => list.invalidateCache());
