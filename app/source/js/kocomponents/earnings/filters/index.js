/**
 * Form with available filter options for earnings.
 *
 * @module kocomponents/earnings/filters
 */
import Komponent from '../../helpers/KnockoutComponent';
import ko from 'knockout';
import moment from 'moment';
import { show as showError } from '../../../modals/error';
import template from './template.html';
import { list as userExternalListings } from '../../../data/userExternalListings';
import { list as userListings } from '../../../data/userListings';

const TAG_NAME = 'earnings-filters';

/**
 * Describes a specific range of time giving two dates, both inclusive
 * @typedef {Object} TimeRange
 * @property {Date} from
 * @property {Date} to
 */

/**
 * @typedef {Object} EarningsFilterValues
 * @property {TimeRange} timeRange
 * @property {number} jobTitleID
 * @property {number} platformID
 */

/**
 * Represents an option available for selection, as in a <select/> element.
 * @typedef {Object} Option
 * @property {number} id
 * @property {string} option
 */

/**
 * @typedef {Function} TimeRangeOptionConverter
 * @returns {TimeRange}
 */

/**
 * Set of converters that creates a TimeRange for the current time for each
 * well know TimeRangeOption (paired with `presetTimeRangeOptions` defined in the class)
 * @private {Object.<number,TimeRangeOptionConverter>}
 */
const timeRangeOptionConverters = {
    /**
     * This Month
     */
    1: function() {
        return {
            from: moment().startOf('month').toDate(),
            to: moment().endOf('month').toDate()
        };
    },
    /**
     * This Quarter
     */
    2: function() {
        return {
            from: moment().startOf('quarter').toDate(),
            to: moment().endOf('quarter').toDate()
        };
    },
    /**
     * This Year
     */
    3: function() {
        return {
            from: moment().startOf('year').toDate(),
            to: moment().endOf('year').toDate()
        };
    },
    /**
     * Last Month
     */
    4: function() {
        return {
            from: moment().substract(1, 'month').startOf('month').toDate(),
            to: moment().substract(1, 'month').endOf('month').toDate()
        };
    }
};

/**
 * Component
 */
export default class EarningsFilter extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {Function} params.onSelect Callback executed when the user
     * changes the selected values for the filters, It includes as parameter
     * a EarningsFilterValues object.
     */
    constructor(params) {
        super();

        // Required Callback for external notifications on changing filters
        if (typeof(params.onSelect) !== 'function') {
            throw new Error('earnings-filters: onSelect param is required');
        }

        /**
         * Predefined Time Range option selected
         * @member {KnockoutObservable<number>}
         */
        this.timeRangeOption = ko.observable();

        /**
         * Job title ID selected
         * @member {KnockoutObservable<number>}
         */
        this.jobTitleID = ko.observable();

        /**
         * Platform ID selected
         * @member {KnockoutObservable<number>}
         */
        this.platformID = ko.observable();

        /**
         * List of options available for time-range, that are later converted
         * into specific dates
         * @property {Array<Option>}
         * @todo i18n the texts
        */
        this.presetTimeRangeOptions = [
            { id: 1, option: 'This month' },
            { id: 2, option: 'This quarter' },
            { id: 3, option: 'This year' },
            { id: 4, option: 'Last month' },
            { id: 5, option: 'Custom' }
        ];

        /**
         * The specific time range matching the option selected by the user.
         * @member {KnockoutComputed<TimeRange>}
        */
        this.timeRange = ko.pureComputed(() => {
            const id = this.timeRangeOption();
            const converter = timeRangeOptionConverters[id];
            if (converter) {
                return converter();
            }
            return null;
        });

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
            params.onSelect({
                timeRange: this.timeRange(),
                jobTitleID: this.jobTitleID(),
                platformID: this.platformID()
            });
        })
        // Prevent that several, automated changes trigger too much.
        .extend({ rateLimit: { timeout: 30, method: 'notifyWhenChangesStop' } });

        this.__setupDataOperations();
    }

    /**
     * Define members, prepare subscriptions to work with the code
     * and start any initial request for data
     * @private
     */
    __setupDataOperations() {
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

ko.components.register(TAG_NAME, EarningsFilter);
