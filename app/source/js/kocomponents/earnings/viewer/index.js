/**
 * Used to view the details of an earnings entry.
 *
 * @module kocomponents/earnings/viewer
 *
 */
import Komponent from '../../helpers/KnockoutComponent';
import clients from '../../../data/clients';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import { show as showError } from '../../../modals/error';
import template from './template.html';
import { item as userEarningsItem } from '../../../data/userEarnings';

const TAG_NAME = 'earnings-viewer';

/**
 * Component
 */
export default class EarningsViewer extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {(number|KnockoutObservable<number>)}
     * [params.earningsEntryID]
     */
    constructor(params) {
        super();

        /**
         * Holds the ID for the earnings entry being viewed.
         * @member {KnockoutObservable<number>}
         */
        this.earningsEntryID = getObservable(params.earningsEntryID || null);

        /**
         * Earnings entry returned for a given ID.
         * @member {KnockoutObservable<object>}
         */
        this.earningsEntry = ko.observable();

        /**
         * Gets a (aria) label for the edit link
         * @param {object} item Earnings entry plain object
         * @returns {string}
         */
        this.getEditLinkLabel = (item) => `Edit earnings entry ${item.earningsEntryID}`;

        /**
         * Build a link to edit the item
         * @param {object} item Earnings entry plain object
         * @returns {string}
         */
        this.linkToEdit = (item) => `/earnings-edit/${item.earningsEntryID}?mustReturn=earnings-view/${item.earningsEntryID}&returnText=View Earnings`;

        /**
         * Display the duration of an entry
         * @param {object} item Earnings entry plain object
         * @returns {string}
         */
        this.displayDuration = (item) => {
            const hours = Math.floor(item.durationMinutes / 60);
            const minutes = item.durationMinutes - (hours * 60);
            return `${hours} hours ${minutes} minutes`;
        };

        /**
         * Holds an object with the client information
         * @member {KnockoutObservable<models/Client>}
         */
        this.client = ko.observable(null);

        /**
         * Display the client name/info of the current earning entry
         * @member {KnockoutComputed<string>}
         */
        this.displayClient = ko.pureComputed(() => {
            const c = this.client();
            if (c) {
                return c.fullName();
            }
            else {
                return '';
            }
        });

        /**
         * Holds a subscription to updates about data for a specific item
         * @private {SingleEvent/Subscription}
         */
        let dataSubscription;
        /**
         * Holds a subscription to error notifications load data for a specific item
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
            this.earningsEntry(null);
            this.client(null);
            if (dataSubscription) {
                dataSubscription.dispose();
            }
            if (dataErrorSubscription) {
                dataErrorSubscription.dispose();
            }
        };

        /**
         * When the ID changes, the information is
         * updated for the specific platform.
         */
        this.observeChanges(() => {
            const id = this.earningsEntryID();
            // reset data and previous ID notifications
            resetData();
            if (id) {
                const item = userEarningsItem(id);
                // Load item data
                dataSubscription = this.subscribeTo(item.onData, (data) => {
                    this.earningsEntry(data);
                    // Load info about the client of this entry
                    // It's optional, so careful since can be null
                    if (data.clientUserID) {
                        clients.getItem(data.clientUserID)
                        .then((client) => {
                            this.client(client);
                        })
                        .catch((error) => {
                            showError({
                                title: 'There was an error loading the client information at the entry',
                                error
                            });
                        });
                    }
                });
                // Notify data load errors
                dataErrorSubscription = this.subscribeTo(item.onDataError, (error) => {
                    showError({
                        title: 'There was an error loading the earning entry',
                        error
                    });
                });
            }
        });
    }
}

ko.components.register(TAG_NAME, EarningsViewer);

