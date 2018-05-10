/**
 * Manages the user postings. GIG Postings made by the logged user.
 *
 * IMPORTANT: Using DUMMY DATA rather than connected to the REST API for now
 */
import CachedDataProvider from './helpers/CachedDataProvider';
import LocalForageIndexedListDataProviderDriver from './helpers/LocalForageIndexedListDataProviderDriver';
import LocalForageItemDataProviderDriver from './helpers/LocalForageItemDataProviderDriver';
import RestItemDataProviderDriver from './helpers/RestItemDataProviderDriver';
import RestSingleDataProviderDriver from './helpers/RestSingleDataProviderDriver';
import localforage from './drivers/localforage';
import rest from './drivers/restClient';

const API_NAME = 'me/postings';
const LOCAL_KEY = 'userPostings';
const ID_PROPERTY_NAME = 'userPostingID';

const localListDriver = new LocalForageIndexedListDataProviderDriver(localforage, LOCAL_KEY, ID_PROPERTY_NAME);

/**
 * Provides access to the list of user postings.
 * @returns {CachedDataProvider<Array<rest/UserPosting>>}
 * Usage:
 * - list.onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - list.onLoadError.subscribe(fn) to get notified of errors happening as of onData
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
 * - const dataProvider = item(userPostingID);
 * - dataProvider.onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - dataProvider.onLoadError.subscribe(fn) to get notified of errors happening as of onData
 */
export function item(id) {
    const localItemDriver = new LocalForageItemDataProviderDriver(localforage, LOCAL_KEY, id, ID_PROPERTY_NAME);
    const itemProvider = new CachedDataProvider({
        // 1 minutes
        ttl: 1 * 60 * 1000,
        remote: new RestItemDataProviderDriver(rest, API_NAME, id),
        local: localItemDriver
    });
    /**
     * Close a posting so will not appear active and no accept messages.
     * @returns {Promise<rest/UserPosting>}
     */
    itemProvider.close = () => rest.post(API_NAME + '/' + id + '/close').then(itemProvider.pushSavedData.bind(itemProvider));

    // List is dirty once an item is updated on cache directly. We can not
    // update the list correctly because of the list order or elements limits
    const invalidateList = list.invalidateCache.bind(list);
    itemProvider.onRemoteLoaded.subscribe(invalidateList);
    itemProvider.onDeleted.subscribe(invalidateList);
    itemProvider.onSaved.subscribe(invalidateList);

    /* **Same problem as in userExternalListings**
     In theory, if an updated load of the list happens in the meantime with
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
