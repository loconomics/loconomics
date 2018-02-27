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

//const API_NAME = 'searchSubCategories';
const LOCAL_KEY = 'searchSubCategories';
const ID_PROPERTY_NAME = 'searchSubCategoryID';

const localListDriver = new LocalForageIndexedListDataProviderDriver(localforage, LOCAL_KEY, ID_PROPERTY_NAME);

/// DUMMY DATA
// Note: more data can be added, keeping the IDs consecutive
const DUMMY_DATA_LIST = [{
    searchSubCategoryID: 1,
    searchCategoryID: 1,
    name: 'Most Used',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 100,
    active: 1
  },
  {
    searchSubCategoryID: 2,
    searchCategoryID: 1,
    name: 'Everyday',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 90,
    active: 1
  },
  {
    searchSubCategoryID: 3,
    searchCategoryID: 1,
    name: 'Improvement',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 80,
    active: 1
  },
  {
    searchSubCategoryID: 4,
    searchCategoryID: 1,
    name: 'Transportation',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 70,
    active: 1
  },
  {
    searchSubCategoryID: 5,
    searchCategoryID: 1,
    name: 'Technology',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 60,
    active: 1
  },
  {
    searchSubCategoryID: 6,
    searchCategoryID: 1,
    name: 'Legal and Finances',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 50,
    active: 1
  },
  {
    searchSubCategoryID: 7,
    searchCategoryID: 2,
    name: 'Most Used',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 100,
    active: 1
  },
  {
    searchSubCategoryID: 8,
    searchCategoryID: 2,
    name: 'Body',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 90,
    active: 1
  },
  {
    searchSubCategoryID: 9,
    searchCategoryID: 2,
    name: 'Mind',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 80,
    active: 1
  },
  {
    searchSubCategoryID: 10,
    searchCategoryID: 2,
    name: 'Soul',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 70,
    active: 1
  },
  {
    searchSubCategoryID: 11,
    searchCategoryID: 2,
    name: 'Lessons and Tutoring',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 60,
    active: 1
  },
  {
    searchSubCategoryID: 12,
    searchCategoryID: 2,
    name: 'Legal and Finances',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 50,
    active: 1
  },
  {
    searchSubCategoryID: 13,
    searchCategoryID: 3,
    name: 'Most Used',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 100,
    active: 1
  },
  {
    searchSubCategoryID: 14,
    searchCategoryID: 3,
    name: 'Wellness',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 90,
    active: 1
  },
  {
    searchSubCategoryID: 15,
    searchCategoryID: 3,
    name: 'Caretaking',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 80,
    active: 1
  },
  {
    searchSubCategoryID: 16,
    searchCategoryID: 3,
    name: 'Lessons and Tutoring',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 70,
    active: 1
  },
  {
    searchSubCategoryID: 17,
    searchCategoryID: 3,
    name: 'Legal and Finances',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 60,
    active: 1
  },
  {
    searchSubCategoryID: 18,
    searchCategoryID: 4,
    name: 'Most Used',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 100,
    active: 1
  },
  {
    searchSubCategoryID: 19,
    searchCategoryID: 4,
    name: 'Cats',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 90,
    active: 1
  },
  {
    searchSubCategoryID: 20,
    searchCategoryID: 4,
    name: 'Dogs',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 80,
    active: 1
  },
  {
    searchSubCategoryID: 21,
    searchCategoryID: 4,
    name: 'Other Pets',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 70,
    active: 1
  },
  {
    searchSubCategoryID: 22,
    searchCategoryID: 5,
    name: 'Most Used',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 100,
    active: 1
  },
  {
    searchSubCategoryID: 23,
    searchCategoryID: 5,
    name: 'Legal and Finances',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 90,
    active: 1
  },
  {
    searchSubCategoryID: 24,
    searchCategoryID: 5,
    name: 'App and Web Development',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 80,
    active: 1
  },
  {
    searchSubCategoryID: 25,
    searchCategoryID: 5,
    name: 'IT and Networking',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 70,
    active: 1
  },
  {
    searchSubCategoryID: 26,
    searchCategoryID: 5,
    name: 'Data and Analytics',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 60,
    active: 1
  },
  {
    searchSubCategoryID: 27,
    searchCategoryID: 5,
    name: 'Creative and Design',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 50,
    active: 1
  },
  {
    searchSubCategoryID: 28,
    searchCategoryID: 5,
    name: 'Writing, Editing, and Translation',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 40,
    active: 1
  },
  {
    searchSubCategoryID: 29,
    searchCategoryID: 5,
    name: 'Engineering and Architecture',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 30,
    active: 1
  },
  {
    searchSubCategoryID: 30,
    searchCategoryID: 5,
    name: 'Marketing',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 20,
    active: 1
  },
  {
    searchSubCategoryID: 31,
    searchCategoryID: 5,
    name: 'Operations',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 10,
    active: 1
  },
  {
    searchSubCategoryID: 32,
    searchCategoryID: 5,
    name: 'Events',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 0,
    active: 1
  },
  {
    searchSubCategoryID: 33,
    searchCategoryID: 6,
    name: 'Most Used',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 100,
    active: 1
  },
  {
    searchSubCategoryID: 34,
    searchCategoryID: 6,
    name: 'Food and Drink',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 90,
    active: 1
  },
  {
    searchSubCategoryID: 35,
    searchCategoryID: 6,
    name: 'Entertainment',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 80,
    active: 1
  },
  {
    searchSubCategoryID: 36,
    searchCategoryID: 6,
    name: 'Planning and Decorations',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 70,
    active: 1
  },
  {
    searchSubCategoryID: 37,
    searchCategoryID: 6,
    name: 'Officiation',
    shortDescription: '',
    longDescription: '',
    smallImage: '',
    bannerImage: '',
    displayRank: 60,
    active: 1
  },
  {
    searchSubCategoryID: 38,
    searchCategoryID: 6,
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
