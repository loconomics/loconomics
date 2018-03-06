/**
 * Access all the search categories available.
 *
 * IMPORTANT: Using DUMMY DATA rather than connected to the REST API for now
 */
import CachedDataProvider from './helpers/CachedDataProvider';
import LocalForageSingleDataProviderDriver from './helpers/LocalForageSingleDataProviderDriver';
//import RestSingleDataProviderDriver from './helpers/RestSingleDataProviderDriver';
import localforage from './drivers/localforage';
//import rest from './drivers/restClient';

//const API_NAME = 'searchCategories';
const LOCAL_KEY = 'searchCategories';

const localListDriver = new LocalForageSingleDataProviderDriver(localforage, LOCAL_KEY);

/// DUMMY DATA
// Note: more data can be added, keeping the IDs consecutive
const DUMMY_DATA_LIST = [{
    searchCategoryID: 1,
    name: 'Home Care',
    aliases: '',
    shortDescription: 'Need some help around the house? Painters, housekeepers, handymen and more await you.',
    longDescription: 'Need some help around the house? Painters, housekeepers, handymen and more await you and your home. You’ll be able to select the perfect service provider that suits your exact needs and budget. Reviews from clients like yourself will help you along.',
    smallImage: '',
    bannerImage: '',
    displayRank: 100
  },
  {
    searchCategoryID: 2,
    name: 'Self Care',
    aliases: '',
    shortDescription: 'You need a massage. Personal trainers, music teachers, and a number of therapists are here.',
    longDescription: 'You need a massage. Personal trainers, music teachers, and a number of therapists are here and ready to help you become the person you deserve to be.',
    smallImage: '',
    bannerImage: '',
    displayRank: 90
  },
  {
    searchCategoryID: 3,
    name: 'Family Care',
    aliases: '',
    shortDescription: 'Give yourself a night out on the town, help your child learn a language, or play an instrument.',
    longDescription: 'Do you or a family member need a little extra help around the house? Help your child learn a language, play an instrument, or give you a night out on the town. Make life easier with a couple clicks.',
    smallImage: '',
    bannerImage: '',
    displayRank: 80
  },
  {
    searchCategoryID: 4,
    name: 'Pet Care',
    aliases: '',
    shortDescription: 'Throw your dog a bone. Treat your pet to grooming services, walkers, sitters, and more.',
    longDescription: 'Throw your dog a bone. Better yet, treat your pet to grooming services, walkers, sitters, and more.',
    smallImage: '',
    bannerImage: '',
    displayRank: 70
  },
  {
    searchCategoryID: 5,
    name: 'Small Business',
    aliases: '',
    shortDescription: 'Tax season have you nervous? Get some help for your small business.',
    longDescription: 'Tax season got you down? Get some help for your small business from marketing to translation services.',
    smallImage: '',
    bannerImage: '',
    displayRank: 60
  },
  {
    searchCategoryID: 6,
    name: 'Celebration',
    aliases: '',
    shortDescription: 'Make your next celebration a real blowout with help from some very talented professionals.',
    longDescription: 'Make your next celebration a real blowout with help from some very talented professionals. Photographers, DJs, musicians and more.',
    smallImage: '',
    bannerImage: '',
    displayRank: 50
  }
];

// Dummy driver for the whole list
const remoteListDriver = {
    fetch: () =>  Promise.resolve(DUMMY_DATA_LIST)
};

/// Public API

/**
 * Provides access to the list of all items.
 * @returns {CachedDataProvider<Array<rest/SearchCategories>>}
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
