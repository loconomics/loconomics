/**
 * Shows the information about the external platform to the
 * professional to help them decide if they should list
 * themselves.
 *
 * @module kocomponents/external-platform/info
 *
 */

import '../../utilities/icon-dec.js';
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import { item as platformsItem } from '../../../data/platforms';
import { show as showError } from '../../../modals/error';

import template from './template.html';

const TAG_NAME = 'external-platform-info';

/**
 * Component
 */
export default class ExternalPlatformInfo extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {(string|KnockoutObservable<string>)} [params.platformName]
     * @param {(string|KnockoutObservable<string>)} [params.platformSignInURL]
     * @param {(number|KnockoutObservable<number>)}  [params.platformID]
     * @param {(boolean|KnockoutObservable<boolean>)} [params.showAddListing]
     **/
    constructor(params) {
        super();

        /**
         * The ID of the external platform we're displaying
         * information for.
         * @member {KnockoutObservable<number>}
         */
        this.platformID = getObservable(params.platformID);

        /**
         * Determines whether or not to display the add link.
         * @member {KnockoutObservable<boolean>}
         */
        this.hideAddListing = getObservable(params.hideAddListing || false);

        /**
         * An object containging information about the external
         * platform.
         * @member {KnockoutObservable<object>}
         */
        this.externalPlatform = ko.observable();

        /**
         * An "out" parameter that fills the platform name
         * for use in the title of the activity.
         * @member {KnockoutObservable<string>}
         */
        this.platformName = params.platformName;

        /**
         * An "out" parameter that fills the platform signInURL
         * for use in showing in the external listing activity.
         * @member {KnockoutObservable<string>}
         */
        this.platformSignInURL = params.platformSignInURL;

        /**
         * Creates a link to the 'add external listing' activity for current
         * platform, setting back link to here with proper label
         * @member {KnockoutComputed<string>}
         */
        this.linkToAdd = ko.pureComputed(() => {
            const platform = this.externalPlatform();
            if (platform) {
                const text = encodeURIComponent(`${platform.name} info`);
                return `/external-listing-add/${platform.platformID}?mustReturn=external-platform-view/${platform.platformID}&returnText=${text}`;
            }
            else {
                return '';
            }
        });

        /**
         * Holds a subscription to updates about data for a specific platform
         * @private {SingleEvent/Subscription}
         */
        let dataSubscription;
        /**
         * Holds a subscription to error notifications load data for a specific platform
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
            this.externalPlatform(null);
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
            const id = this.platformID();
            // reset data and previous ID notifications
            resetData();
            if (id) {
                const item = platformsItem(id);
                // Load platform data
                dataSubscription = this.subscribeTo(item.onData, (data) => {
                    this.externalPlatform(data);
                    this.platformName(data.name);
                    this.platformSignInURL(data.signInURL);
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

ko.components.register(TAG_NAME, ExternalPlatformInfo);
