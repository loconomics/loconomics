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

//const API_NAME = 'userListingSolutions';
const LOCAL_KEY = 'userListingSolutions';
const SUGGESTED_SOLUTIONS_LOCAL_KEY = 'suggestedSolutionsByJobTitle';

/// DUMMY DATA
// Note: It's a dictionary grouping solutions by a user's listing (jobTitleID)
const DUMMY_DATA_DICTIONARY = {
    49: [
        {
            solutionID: 44,
            displayRank: 500
        },
        {
            solutionID: 45,
            displayRank: 100
        }
    ],
    37: [
        {
            solutionID: 118,
            displayRank: 500
        }
    ]
};

/// DUMMY DATA
// Note: It's a dictionary grouping suggested solutions by jobTitleID
const DUMMY_SUGGESTED_DATA_DICTIONARY = {
    14: [
        {
            solutionID: 44,
            defaultSelected: 1,
            displayRank: 500
        },
        {
            solutionID: 45,
            defaultSelected: 0,
            displayRank: 100
        }
    ],
    37: [
        {
            solutionID: 118,
            defaultSelected: 1,
            displayRank: 500
        },
        {
            solutionID: 119,
            defaultSelected: 1,
            displayRank: 100
        },
        {
            solutionID: 147,
            defaultSelected: 0,
            displayRank: 100
        },
        {
            solutionID: 149,
            defaultSelected: 0,
            displayRank: 100
        },
        {
            solutionID: 218,
            defaultSelected: 0,
            displayRank: 100
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

// Dummy driver for data grouped by an id
const remoteSuggestedGroupDriver = (id) => ({
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
        if (DUMMY_SUGGESTED_DATA_DICTIONARY.hasOwnProperty(id)) {
            const deletedCopy = DUMMY_SUGGESTED_DATA_DICTIONARY[id];
            delete DUMMY_SUGGESTED_DATA_DICTIONARY[id];
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
export function bySuggestedByJobTitle(id) {
    const localItemDriver = new LocalForageSingleDataProviderDriver(localforage, SUGGESTED_SOLUTIONS_LOCAL_KEY + '/' + id);
    return new CachedDataProvider({
        // 1 minutes
        ttl: 1 * 60 * 1000,
        remote: remoteSuggestedGroupDriver(id),
        local: localItemDriver
    });
}
export function byUserListing(id) {
    const localItemDriver = new LocalForageSingleDataProviderDriver(localforage, LOCAL_KEY + '/' + id);
    return new CachedDataProvider({
        // 1 minutes
        ttl: 1 * 60 * 1000,
        remote: remoteGroupDriver(id),
        local: localItemDriver
    });
}