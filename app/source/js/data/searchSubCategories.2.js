/**
 * Manages the user postings. GIG Postings made by the logged user.
 *
 * IMPORTANT: Using DUMMY DATA rather than connected to the REST API for now
 */
import CachedDataProvider from './helpers/CachedDataProvider';
import LocalForageIndexedListDataProviderDriver from './helpers/LocalForageIndexedListDataProviderDriver';
import LocalForageItemDataProviderDriver from './helpers/LocalForageItemDataProviderDriver';
//import RestItemDataProviderDriver from './helpers/RestItemDataProviderDriver';
//import RestSingleDataProviderDriver from './helpers/RestSingleDataProviderDriver';
import localforage from './drivers/localforage';
//import rest from './drivers/restClient';

//const API_NAME = 'me/postings';
const LOCAL_KEY = 'userPostings';
const ID_PROPERTY_NAME = 'userPostingID';

const localListDriver = new LocalForageIndexedListDataProviderDriver(localforage, LOCAL_KEY, ID_PROPERTY_NAME);

/// DUMMY DATA
// Note: more data can be added, keeping the IDs consecutive
const DUMMY_DATA_LIST = [{
    SearchSubCategoryID: 1,
    SearchCategoryID: 1,
    name: 'Most Used',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 100,
    active: 1
  },
  {
    SearchSubCategoryID: 2,
    SearchCategoryID: 1,
    name: 'Everyday',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 90,
    active: 1
  },
  {
    SearchSubCategoryID: 3,
    SearchCategoryID: 1,
    name: 'Improvement',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 80,
    active: 1
  },
  {
    SearchSubCategoryID: 4,
    SearchCategoryID: 1,
    name: 'Transportation',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 70,
    active: 1
  },
  {
    SearchSubCategoryID: 5,
    SearchCategoryID: 1,
    name: 'Technology',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 60,
    active: 1
  },
  {
    SearchSubCategoryID: 6,
    SearchCategoryID: 1,
    name: 'Legal and Finances',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 50,
    active: 1
  },
  {
    SearchSubCategoryID: 7,
    SearchCategoryID: 2,
    name: 'Most Used',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 100,
    active: 1
  },
  {
    SearchSubCategoryID: 8,
    SearchCategoryID: 2,
    name: 'Body',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 90,
    active: 1
  },
  {
    SearchSubCategoryID: 9,
    SearchCategoryID: 2,
    name: 'Mind',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 80,
    active: 1
  },
  {
    SearchSubCategoryID: 10,
    SearchCategoryID: 2,
    name: 'Soul',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 70,
    active: 1
  },
  {
    SearchSubCategoryID: 11,
    SearchCategoryID: 2,
    name: 'Lessons and Tutoring',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 60,
    active: 1
  },
  {
    SearchSubCategoryID: 12,
    SearchCategoryID: 2,
    name: 'Legal and Finances',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 50,
    active: 1
  },
  {
    SearchSubCategoryID: 13,
    SearchCategoryID: 3,
    name: 'Most Used',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 100,
    active: 1
  },
  {
    SearchSubCategoryID: 14,
    SearchCategoryID: 3,
    name: 'Wellness',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 90,
    active: 1
  },
  {
    SearchSubCategoryID: 15,
    SearchCategoryID: 3,
    name: 'Caretaking',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 80,
    active: 1
  },
  {
    SearchSubCategoryID: 16,
    SearchCategoryID: 3,
    name: 'Lessons and Tutoring',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 70,
    active: 1
  },
  {
    SearchSubCategoryID: 17,
    SearchCategoryID: 3,
    name: 'Legal and Finances',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 60,
    active: 1
  },
  {
    SearchSubCategoryID: 18,
    SearchCategoryID: 4,
    name: 'Most Used',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 100,
    active: 1
  },
  {
    SearchSubCategoryID: 19,
    SearchCategoryID: 4,
    name: 'Cats',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 90,
    active: 1
  },
  {
    SearchSubCategoryID: 20,
    SearchCategoryID: 4,
    name: 'Dogs',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 80,
    active: 1
  },
  {
    SearchSubCategoryID: 21,
    SearchCategoryID: 4,
    name: 'Other Pets',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 70,
    active: 1
  },
  {
    SearchSubCategoryID: 22,
    SearchCategoryID: 5,
    name: 'Most Used',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 100,
    active: 1
  },
  {
    SearchSubCategoryID: 23,
    SearchCategoryID: 5,
    name: 'Legal and Finances',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 90,
    active: 1
  },
  {
    SearchSubCategoryID: 24,
    SearchCategoryID: 5,
    name: 'App and Web Development',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 80,
    active: 1
  },
  {
    SearchSubCategoryID: 25,
    SearchCategoryID: 5,
    name: 'IT and Networking',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 70,
    active: 1
  },
  {
    SearchSubCategoryID: 26,
    SearchCategoryID: 5,
    name: 'Data and Analytics',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 60,
    active: 1
  },
  {
    SearchSubCategoryID: 27,
    SearchCategoryID: 5,
    name: 'Creative and Design',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 50,
    active: 1
  },
  {
    SearchSubCategoryID: 28,
    SearchCategoryID: 5,
    name: 'Writing, Editing, and Translation',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 40,
    active: 1
  },
  {
    SearchSubCategoryID: 29,
    SearchCategoryID: 5,
    name: 'Engineering and Architecture',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 30,
    active: 1
  },
  {
    SearchSubCategoryID: 30,
    SearchCategoryID: 5,
    name: 'Marketing',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 20,
    active: 1
  },
  {
    SearchSubCategoryID: 31,
    SearchCategoryID: 5,
    name: 'Operations',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 10,
    active: 1
  },
  {
    SearchSubCategoryID: 32,
    SearchCategoryID: 5,
    name: 'Events',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 0,
    active: 1
  },
  {
    SearchSubCategoryID: 33,
    SearchCategoryID: 6,
    name: 'Most Used',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 100,
    active: 1
  },
  {
    SearchSubCategoryID: 34,
    SearchCategoryID: 6,
    name: 'Food and Drink',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 90,
    active: 1
  },
  {
    SearchSubCategoryID: 35,
    SearchCategoryID: 6,
    name: 'Entertainment',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 80,
    active: 1
  },
  {
    SearchSubCategoryID: 36,
    SearchCategoryID: 6,
    name: 'Planning and Decorations',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 70,
    active: 1
  },
  {
    SearchSubCategoryID: 37,
    SearchCategoryID: 6,
    name: 'Officiation',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 60,
    active: 1
  },
  {
    SearchSubCategoryID: 38,
    SearchCategoryID: 6,
    name: 'Wedding',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 50,
    active: 1
  }];
// Dummy driver for the whole list
const remoteListDriver = {
    fetch: () =>  Promise.resolve(DUMMY_DATA_LIST),
    /* The whole list cannot be replaced, only item by item */
    push: (/*data*/) => Promise.resolve(),
    /* The whole list cannot be removed, only item by item */
    delete: () => Promise.resolve()
};
// Dummy driver for items by id
const remoteItemDriver = (id) => ({
    fetch: () => {
        if (DUMMY_DATA_LIST.length < id) {
            return Promise.resolve(DUMMY_DATA_LIST[id - 1]);
        }
        else {
            return Promise.reject('Not Found');
        }
    },
    push: (data) => {
        if (DUMMY_DATA_LIST.length < id) {
            DUMMY_DATA_LIST[id - 1] = data;
            return Promise.resolve(DUMMY_DATA_LIST[id - 1]);
        }
        else {
            return Promise.reject('Not Found');
        }
    },
    delete: () => {
        if (DUMMY_DATA_LIST.length < id) {
            const deletedCopy = DUMMY_DATA_LIST[id - 1];
            DUMMY_DATA_LIST.splice(id - 1, 1);
            return Promise.resolve(deletedCopy);
        }
        else {
            return Promise.reject('Not Found');
        }
    }
});

/// Public API

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
    remote: remoteListDriver,
    local: localListDriver
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
    const localItemDriver = new LocalForageItemDataProviderDriver(localforage, LOCAL_KEY, id, ID_PROPERTY_NAME);
    const itemProvider = new CachedDataProvider({
        // 1 minutes
        ttl: 1 * 60 * 1000,
        remote: remoteItemDriver(id),
        local: localItemDriver
    });
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
