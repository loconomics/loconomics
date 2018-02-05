/**
 * Shows the user the information about the listing they
 * created on an external platform.
 *
 * @module kocomponents/external-listing/viewer
 *
 */
import '../../utilities/icon-dec.js';
import '../../external-platform/info';
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import { show as showError } from '../../../modals/error';
import template from './template.html';
import { item as userExternalListingItem } from '../../../data/userExternalListings';

const TAG_NAME = 'external-listing-viewer';

/**
 * Component
 */
export default class ExternalListingViewer extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {(number|KnockoutObservable<number>)} [params.externalListingID]
     */
    constructor(params) {
        super();

        /**
         * The ID of the external listing the professional
         * is viewing.
         * @member {KnockoutObservable<number>}
         */
        this.externalListingID = getObservable(params.externalListingID);

        /**
         * An "out" parameter that fills the platform name
         * for use in the title of the activity.
         * @member {KnockoutObservable<string>}
         */
        this.platformName = params.platformName;

        /**
         * An "out" parameter that fills the URL of the platform
         * for professionals to sign into their accounts.
         * @member {KnockoutObservable<string>}
         */
        this.platformSignInURL = ko.observable(null);

        /**
         * An "out" parameter that fills the platformID
         * to enable information about the platform to
         * be displayed.
         * @member {KnockoutObservable<number>}
         */
        this.platformID = ko.observable(null);

        /**
         * An object containing all the information about
         * the professionals external listing.
         * @member {KnockoutObservable<object>}
         */
        this.externalListing = ko.observable();

        /**
         * Holds a subscription to updates about data for a specific listing
         * @private {SingleEvent/Subscription}
         */
        let dataSubscription;
        /**
         * Holds a subscription to error notifications load data for a specific listing
         * @private {SingleEvent/Subscription}
         */
        let dataErrorSubscription;
        /**
         * Reset current data displayed and remove previous subscriptions
         * to data updates.
         * Useful when the ID changes, in order to prevent displaying previous ID
         * data and stop receiving notifications for that.
         * @private
         * @method
         */
        const resetData = () => {
            this.externalListing(null);
            if (dataSubscription) {
                dataSubscription.dispose();
            }
            if (dataErrorSubscription) {
                dataErrorSubscription.dispose();
            }
        };

        /**
         * When the platformID changes, the information is
         * updated for the specific platform.
         */
        this.observeChanges(() => {
            const id = this.externalListingID();
            // reset data and previous ID notifications
            resetData();
            if (id) {
                const item = userExternalListingItem(id);
                // Load platform data
                dataSubscription = this.subscribeTo(item.onData, (data) => {
                    this.externalListing(data);
                    this.platformID(data.platformID);
                });
                // Notify data load errors
                dataErrorSubscription = this.subscribeTo(item.onDataError, (err) => {
                    showError({
                        title: 'There was an error loading the platform info',
                        error: err
                    });
                });
            }
        });
    }
}

ko.components.register(TAG_NAME, ExternalListingViewer);
