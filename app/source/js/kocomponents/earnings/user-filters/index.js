/**
 * Form with available filter options for earnings.
 *
 * @module kocomponents/earnings/filters
 */

import '../time-range-filter';
import Komponent from '../../helpers/KnockoutComponent';
import ko from 'knockout';
import { show as showError } from '../../../modals/error';
import template from './template.html';
import { list as userExternalListings } from '../../../data/userExternalListings';
import { list as userListings } from '../../../data/userListings';

const TAG_NAME = 'earnings-user-filters';

/**
 * Describes values for a set of selected filters.
 * Properties described as 'filtering value' are the actual values that must be
 * used for filtering, the rest are just information for the UI.
 * @typedef {Object} EarningsUserFilterValues
 * @property {Date} fromDate Filtering value for inclusive initial date
 * @property {Date} toDate Filtering value for inclusive final date
 * @property {number} jobTitleID Filtering value for job title
 * @property {number} userExternalListingID Fitlering value for external listing/platform
 * @property {TimeRangeOption} timeRangeOption Option used to fill
 * the fromDate and toDate properties, provided only to allow customization of
 * the display for the time range but must not be used as the actual value to
 * filter by.
 * @property {string} jobTitleText Display value, name matching the jobTitleID
 * @property {string} userExternalListingText Display value, name or title matching the
 * userExternalListingID
 */

/**
 * Component
 */
export default class EarningsUserFilter extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {Function} params.onSelect Callback executed when the user
     * changes the selected values for the filters, It includes as parameter
     * a EarningsUserFilterValues object.
     * @param {TimeRangeOption} params.defaultTimeRangeOption
     */
    constructor(params) {
        super();

        // Required Callback for external notifications on changing filters
        if (typeof(params.onSelect) !== 'function') {
            throw new Error('earnings-user-filters: onSelect param is required');
        }

        /**
         * Predefined Time Range option selected
         * @member {TimeRangeOption}
         */
        this.defaultTimeRangeOption = ko.unwrap(params.defaultTimeRangeOption);

        /**
         * @member {KnockoutObservable<./user-filters/TimeRange>}
         */
        this.timeRangeSelected = ko.observable({
            from: null,
            to: null,
            option: null
        });

        /**
         * Job title object selected.
         * @member {KnockoutObservable<rest/UserJobTitle>}
         */
        this.jobTitle = ko.observable();

        /**
         * External listing object selected.
         * @member {KnockoutObservable<rest/UserExternalListing>}
         */
        this.externalListing = ko.observable();

        /**
         * Holds the list of available user listings at Loconomics, to allow
         * filter by job title
         * @member {KnockoutObservableArray<rest/UserJobTitle>}
         */
        this.listings = ko.observableArray([]);

        /**
         * Holds the list of user external listings to allow filter by
         * the listing/platform.
         * @member {KnockoutObservableArray<rest/UserExternalListings>}
         */
        this.externalListings = ko.observableArray([]);

        /**
         * Automatically trigger onSelect on options changes
         */
        ko.computed(() => {
            const range = this.timeRangeSelected();
            const jobTitle = this.jobTitle();
            const externalListing = this.externalListing();
            params.onSelect({
                fromDate: range.from,
                toDate: range.to,
                timeRangeOption: range.option,
                jobTitleID: jobTitle && jobTitle.jobTitleID,
                userExternalListingID: externalListing && externalListing.userExternalListingID,
                jobTitleText: jobTitle && jobTitle.title,
                userExternalListingText: externalListing && externalListing.title || 'All listings/platforms'
            });
        })
        // Prevent that several, automated/related changes, trigger too much notifications.
        .extend({ rateLimit: { timeout: 100, method: 'notifyWhenChangesStop' } });

        this.__connectData();
    }

    /**
     * Define members, prepare subscriptions to work with the code
     * and start any initial request for data
     * @private
     */
    __connectData() {
        // Load listings
        this.subscribeTo(userListings.onData, this.listings);
        // Load external listings
        this.subscribeTo(userExternalListings.onData, this.externalListings);

        // Notify data load errors
        this.subscribeTo(userListings.onDataError, (err) => {
            showError({
                title: 'There was an error loading your listings',
                error: err
            });
        });
        // Notify data load errors
        this.subscribeTo(userExternalListings.onDataError, (err) => {
            showError({
                title: 'There was an error loading your external listings',
                error: err
            });
        });
    }
}

ko.components.register(TAG_NAME, EarningsUserFilter);
