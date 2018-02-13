/**
 * Provides read-only access to a list of platforms suggested.
 *
 * That's a list of known platforms for GIGs, based on ones available to
 * the user depending on its listing/job-titles, but excluding ones already
 * added as external listing
 * @member {KnockoutComputed<Array<rest/Platform>>}
 */

import AggregatedEvent from '../utils/SingleEvent/AggregatedEvent';
import SingleEvent from '../utils/SingleEvent';
import ko from 'knockout';
import { list as platformsList } from './platforms';
import { list as userExternalListingList } from './userExternalListings';

/**
 * Filters a list of platforms by removing ones included in the given listings.
 * @param {Array<rest/Platform>} platforms
 * @param {Array<rest/UserExternalListing>} listings
 * @returns {Array</rest/Platform>}
 */
const filter = function(platforms, listings) {
    if (platforms && platforms.length && listings) {
        // Filter platforms by one already registered as a listing
        const platformsAdded = listings.map((l) => l.platformID);
        return platforms.filter((platform) => platformsAdded.indexOf(platform.platformID) === -1);
    }
    else {
        // No platforms
        return [];
    }
};

/**
 * Notifies when an error happens processing the data.
 */
const onProcessingError = new SingleEvent();

/**
 * Notifies when errors happens loading the data sources (any of them),
 * or processing the data
 */
export const onDataError = new AggregatedEvent([
    platformsList.onDataError,
    userExternalListingList.onDataError,
    onProcessingError
]);

/**
 * We expose the onData event, that request data to be loaded and notifies
 * whenever new data is available
 *
 * NOTE: It behaves like an ReactiveEvent, is disposable, but has not other interface
 * members like 'emit' or 'unsubscribe' (the returned Subscription object must
 * be used to unsubscribe, calling the 'dispose' method it has)
 *
 * NOTE: It relies on data available at other data modules, filtering it,
 * rather than duplicate stored data. Has no need for methods to clear or
 * invalidate cache because does not stores it's own data, and no other
 * usual members as in CachedDataProvider since are not useful.
 */
export const onData = {
    subscribe: (callback) => {
        /**
         * List of all platforms available.
         * @member {KnockoutObservable<Array<rest/Platform>>}
         */
        const platforms = ko.observableArray();

        /**
         * List of external listings the user has. Used to filter out
         * the suggested list of platforms
         * @member {KnockoutObservable<Array<rest/UserExternalListing>>}
         */
        const externalListings = ko.observableArray();

        // Get all platforms data
        const pSub = platformsList.onData.subscribe(platforms);
        // Get external listings data
        const lSub = userExternalListingList.onData.subscribe(externalListings);

        // Create computed that filters the data producing a new set
        // whenever source data changes, and notify the result
        // to the external callback
        var cSub = ko.computed(() => {
            // Just in case there is an error (wrong data or anything)
            try {
                return filter(platforms(), externalListings());
            } catch (ex) {
                onProcessingError.emit(ex);
            }
        })
        // Prevents too much executions, specially when both datasets comes immediatly
        // that would trigger two consecutive processing, we force it to be just one
        // with rateLimit
        .extend({ rateLimit: { timeout: 100, method: 'notifyWhenChangesStop' } })
        // Subscribe with external callback
        .subscribe(callback);

        // We return a disposable object, that disposes all our internal subscriptions
        return {
            dispose: () => {
                pSub.dispose();
                lSub.dispose();
                cSub.dispose();
            }
        };
    }
};
