/**
 * A list of suggested external platforms for a
 * professional to list themselves on based on their job
 * titles. It lists only platforms they don't already have
 * an external listing created.
 *
 * @module kocomponents/external-platform/suggestions-list
 *
 */
import '../../utilities/icon-dec.js';
import Komponent from '../../helpers/KnockoutComponent';
import ko from 'knockout';
import { list as platformsList } from '../../../data/platforms';
import { show as showError } from '../../../modals/error';
import template from './template.html';
import { list as userExternalListingList } from '../../../data/userExternalListings';

const TAG_NAME = 'external-platform-suggestions-list';

/**
 * Component
 */
export default class ExternalPlatformSuggestionsList extends Komponent {

    static get template() { return template; }

    constructor() {
        super();

        /**
         * List of all platforms available.
         * @member {KnockoutObservable<Array<rest/Platform>>}
         */
        this.platforms = ko.observableArray();

        /**
         * List of external listings the user has. Used to filter out
         * the suggested list of platforms
         * @member {KnockoutObservable<Array<rest/UserExternalListing>>}
         */
        this.externalListings = ko.observableArray();

        /**
         * List of platforms suggested.
         * @member {KnockoutComputed<Array<rest/Platform>>}
         */
        this.suggestedPlatforms = ko.pureComputed(() => {
            const platforms = this.platforms();
            const listings = this.externalListings();
            if (platforms && platforms.length && listings) {
                // Filter platforms by one already registered as a listing
                const platformsAdded = listings.map((l) => l.platformID);
                return platforms.filter((platform) => platformsAdded.indexOf(platform.platformID) === -1);
            }
            else {
                // No platforms
                return [];
            }
        });

        /**
         * Load platforms data.
         */
        this.subscribeTo(platformsList.onData, this.platforms);

        /**
         * Load listing data.
         */
        this.subscribeTo(userExternalListingList.onData, this.externalListings);

        /// Notify data load errors
        const notifyError = (err) => {
            showError({
                title: 'There was an error loading the platforms',
                error: err
            });
        };
        this.subscribeTo(platformsList.onDataError, notifyError);
        this.subscribeTo(userExternalListingList.onDataError, notifyError);
    }
}

ko.components.register(TAG_NAME, ExternalPlatformSuggestionsList);
