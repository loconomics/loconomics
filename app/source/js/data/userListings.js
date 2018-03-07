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
 * - dataProvider.onData.subscribe(fn) to get the record, fn keeps being triggered on incoming updated data
 * - dataProvider.onDataError.subscribe(fn) to get notified of errors happening as of onData
 *
 * - dataProvider.onceLoaded.then(fn).catch(fn) as alternative to previous ones when just
 * want one notification of data (and ensure this is up-to-date), returns Promise. Good for editors.
 *
 * - dataProvider.save(data).then(fn).catch(fn) to save data, returns Promise
 * - dataProvider.delete().then(fn).catch(fn) to delete a listing from the profile, returns Promise
 * - dataprovider.deactivate().then(fn).catch(fn) to change status of the listing to user-inactive,
 * returns Promise and triggers onSaved event
 * - dataprovider.reactivate().then(fn).catch(fn) to change status of the listing to user-active (automatic activation enabled),
 * returns Promise and triggers onSaved event
 */
export function item(id) {
    const localItemDriver = new LocalForageItemDataProviderDriver(localforage, LOCAL_KEY, id, ID_PROPERTY_NAME);
    const itemProvider = new CachedDataProvider({
        // 1 minutes
        ttl: 1 * 60 * 1000,
        remote: new RestItemDataProviderDriver(rest, API_NAME, id),
        local: localItemDriver
    });

    // API additions, specific to userListing management
    /**
     * Change listing status to user-inactive
     * @returns {Promise<Object>} Gives a copy of the server data
     */
    itemProvider.deactivate = () => rest.post(API_NAME + '/' + id + '/deactivate').then(itemProvider.pushSavedData);
    /**
     * Change listing status to user-active
     * @returns {Promise<Object>} Gives a copy of the server data
     */
    itemProvider.reactivate = () => rest.post(API_NAME + '/' + id + '/reactivate').then(itemProvider.pushSavedData);

    // Keep list notified because of item updates
    itemProvider.onRemoteLoaded.subscribe((itemData) => {
        // ensure the fresh item is registered in the index (then, included in the list)
        localListDriver.registerID(itemData[ID_PROPERTY_NAME]);
        localListDriver.invalidateCache();
    });
    itemProvider.onSaved.subscribe((itemData) => {
        // ensure the item (maybe new) is registered in the index (then, included in the list)
        localListDriver.registerID(itemData[ID_PROPERTY_NAME]);
        localListDriver.invalidateCache();
    });
    itemProvider.onDeleted.subscribe((itemData) => {
        // the item needs to be removed from the index
        localListDriver.unregisterID(itemData[ID_PROPERTY_NAME]);
        // On delete, the current list without the item is OK and don't require list revalidation
        // but needs notification to anyone listening to data changes:
        if (list.onLoaded.count) {
            // We need to notify them, but we need the full list
            // and we just have an item, load it from cache and provide it
            localListDriver.fetch().then((cache) => list.onLoaded.emit(cache.data));
        }
    });

    /* See note at userExternalListings at this point about list.onRemoteLoaded */

    // Return the instance
    return itemProvider;
}

// Invalidate this data on data updates at userJobProfile that has it's own
// copy of the same data and implements the editing capabilities
userJobProfile.cacheChangedNotice.subscribe(() => list.invalidateCache());
