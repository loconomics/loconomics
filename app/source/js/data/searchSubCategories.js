/**
 * Access the search subcategories list available by searchCategoryID.
 *
 * IMPORTANT: Using DUMMY DATA rather than connected to the REST API for now
 */
import CachedDataProvider from './helpers/CachedDataProvider';
import LocalForageSingleDataProviderDriver from './helpers/LocalForageSingleDataProviderDriver';
//import RestItemDataProviderDriver from './helpers/RestItemDataProviderDriver';
import localforage from './drivers/localforage';
//import rest from './drivers/restClient';

//const API_NAME = 'searchSubCategories';
const LOCAL_KEY = 'searchSubCategories';

/// DUMMY DATA
// Note: It's a dictionary grouping subcategories by categoryID
const DUMMY_DATA_DICTIONARY = {
    1: [
        {
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
        }
    ],
    2: [
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
        }
    ],
    3: [
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
        }
    ],
    4: [
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
        }
    ],
    5: [
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
        }
    ],
    6: [
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
        }
    ]
};

// Dummy driver for data grouped by an id
const remoteGroupDriver = (id) => ({
    fetch: () => {
        if (DUMMY_DATA_DICTIONARY.hasOwnProperty(id)) {
            return Promise.resolve(DUMMY_DATA_DICTIONARY[id]);
        }
        else {
            return Promise.reject('Not Found');
        }
    },
    push: (data) => {
        if (DUMMY_DATA_DICTIONARY.hasOwnProperty(id)) {
          DUMMY_DATA_DICTIONARY[id] = data;
            return Promise.resolve(DUMMY_DATA_DICTIONARY[id]);
        }
        else {
            return Promise.reject('Not Found');
        }
    },
    delete: () => {
        if (DUMMY_DATA_DICTIONARY.hasOwnProperty(id)) {
            const deletedCopy = DUMMY_DATA_DICTIONARY[id];
            delete DUMMY_DATA_DICTIONARY[id];
            return Promise.resolve(deletedCopy);
        }
        else {
            return Promise.reject('Not Found');
        }
    }
});

/// Public API

/**
 * Provides an API to fetch all subcategories under a categoryID.
 * @param {number} id The searchCategoryID
 * @returns {CachedDataProvider<rest/SearchSubCategory>}
 * Usage:
 * - const dataProvider = byCategoryID(searchCategoryID);
 * - dataProvider.onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - dataProvider.onLoadError.subscribe(fn) to get notified of errors happening as of onData
 */
export function byCategoryID(id) {
    const localItemDriver = new LocalForageSingleDataProviderDriver(localforage, LOCAL_KEY + '/' + id);
    return new CachedDataProvider({
        // 1 minutes
        ttl: 1 * 60 * 1000,
        remote: remoteGroupDriver(id),
        local: localItemDriver
    });
}
