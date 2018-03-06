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
            description: '',
            image: '',
            displayRank: 100
        },
        {
            searchSubCategoryID: 2,
            searchCategoryID: 1,
            name: 'Everyday',
            description: '',
            image: '',
            displayRank: 90
        },
        {
            searchSubCategoryID: 3,
            searchCategoryID: 1,
            name: 'Improvement',
            description: '',
            image: '',
            displayRank: 80
        },
        {
            searchSubCategoryID: 4,
            searchCategoryID: 1,
            name: 'Transportation',
            description: '',
            image: '',
            displayRank: 70
        },
        {
            searchSubCategoryID: 5,
            searchCategoryID: 1,
            name: 'Technology',
            description: '',
            image: '',
            displayRank: 60
        },
        {
            searchSubCategoryID: 6,
            searchCategoryID: 1,
            name: 'Legal and Finances',
            description: '',
            image: '',
            displayRank: 50
        }
    ],
    2: [
        {
            searchSubCategoryID: 7,
            searchCategoryID: 2,
            name: 'Most Used',
            description: '',
            image: '',
            displayRank: 100
        },
        {
            searchSubCategoryID: 8,
            searchCategoryID: 2,
            name: 'Body',
            description: '',
            image: '',
            displayRank: 90
        },
        {
            searchSubCategoryID: 9,
            searchCategoryID: 2,
            name: 'Mind',
            description: '',
            image: '',
            displayRank: 80
        },
        {
            searchSubCategoryID: 10,
            searchCategoryID: 2,
            name: 'Soul',
            description: '',
            image: '',
            displayRank: 70
        },
        {
            searchSubCategoryID: 11,
            searchCategoryID: 2,
            name: 'Lessons and Tutoring',
            description: '',
            image: '',
            displayRank: 60
        },
        {
            searchSubCategoryID: 12,
            searchCategoryID: 2,
            name: 'Legal and Finances',
            description: '',
            image: '',
            displayRank: 50
        }
    ],
    3: [
        {
            searchSubCategoryID: 13,
            searchCategoryID: 3,
            name: 'Most Used',
            description: '',
            image: '',
            displayRank: 100
        },
        {
            searchSubCategoryID: 14,
            searchCategoryID: 3,
            name: 'Wellness',
            description: '',
            image: '',
            displayRank: 90
        },
        {
            searchSubCategoryID: 15,
            searchCategoryID: 3,
            name: 'Caretaking',
            description: '',
            image: '',
            displayRank: 80
        },
        {
            searchSubCategoryID: 16,
            searchCategoryID: 3,
            name: 'Lessons and Tutoring',
            description: '',
            image: '',
            displayRank: 70
        },
        {
            searchSubCategoryID: 17,
            searchCategoryID: 3,
            name: 'Legal and Finances',
            description: '',
            image: '',
            displayRank: 60
        }
    ],
    4: [
        {
            searchSubCategoryID: 18,
            searchCategoryID: 4,
            name: 'Most Used',
            description: '',
            image: '',
            displayRank: 100
        },
        {
            searchSubCategoryID: 19,
            searchCategoryID: 4,
            name: 'Cats',
            description: '',
            image: '',
            displayRank: 90
        },
        {
            searchSubCategoryID: 20,
            searchCategoryID: 4,
            name: 'Dogs',
            description: '',
            image: '',
            displayRank: 80
        },
        {
            searchSubCategoryID: 21,
            searchCategoryID: 4,
            name: 'Other Pets',
            description: '',
            image: '',
            displayRank: 70
        }
    ],
    5: [
        {
            searchSubCategoryID: 22,
            searchCategoryID: 5,
            name: 'Most Used',
            description: '',
            image: '',
            displayRank: 100
        },
        {
            searchSubCategoryID: 23,
            searchCategoryID: 5,
            name: 'Legal and Finances',
            description: '',
            image: '',
            displayRank: 90
        },
        {
            searchSubCategoryID: 24,
            searchCategoryID: 5,
            name: 'App and Web Development',
            description: '',
            image: '',
            displayRank: 80
        },
        {
            searchSubCategoryID: 25,
            searchCategoryID: 5,
            name: 'IT and Networking',
            description: '',
            image: '',
            displayRank: 70
        },
        {
            searchSubCategoryID: 26,
            searchCategoryID: 5,
            name: 'Data and Analytics',
            description: '',
            image: '',
            displayRank: 60
        },
        {
            searchSubCategoryID: 27,
            searchCategoryID: 5,
            name: 'Creative and Design',
            description: '',
            image: '',
            displayRank: 50
        },
        {
            searchSubCategoryID: 28,
            searchCategoryID: 5,
            name: 'Writing, Editing, and Translation',
            description: '',
            image: '',
            displayRank: 40
        },
        {
            searchSubCategoryID: 29,
            searchCategoryID: 5,
            name: 'Engineering and Architecture',
            description: '',
            image: '',
            displayRank: 30
        },
        {
            searchSubCategoryID: 30,
            searchCategoryID: 5,
            name: 'Marketing',
            description: '',
            image: '',
            displayRank: 20
        },
        {
            searchSubCategoryID: 31,
            searchCategoryID: 5,
            name: 'Operations',
            description: '',
            image: '',
            displayRank: 10
        },
        {
            searchSubCategoryID: 32,
            searchCategoryID: 5,
            name: 'Events',
            description: '',
            image: '',
            displayRank: 0
        }
    ],
    6: [
        {
            searchSubCategoryID: 33,
            searchCategoryID: 6,
            name: 'Most Used',
            description: '',
            image: '',
            displayRank: 100
        },
        {
            searchSubCategoryID: 34,
            searchCategoryID: 6,
            name: 'Food and Drink',
            description: '',
            image: '',
            displayRank: 90
        },
        {
            searchSubCategoryID: 35,
            searchCategoryID: 6,
            name: 'Entertainment',
            description: '',
            image: '',
            displayRank: 80
        },
        {
            searchSubCategoryID: 36,
            searchCategoryID: 6,
            name: 'Planning and Decorations',
            description: '',
            image: '',
            displayRank: 70
        },
        {
            searchSubCategoryID: 37,
            searchCategoryID: 6,
            name: 'Officiation',
            description: '',
            image: '',
            displayRank: 60
        },
        {
            searchSubCategoryID: 38,
            searchCategoryID: 6,
            name: 'Wedding',
            description: '',
            image: '',
            displayRank: 50
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
