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
 * TimeRangeOption enum with available time rage predefined options.
 * @enum {number}
 */
export const TimeRangeOption = {
    thisMonth: 1,
    thisQuarter: 2,
    thisYear: 3,
    lastMonth: 4,
    custom: 5
};

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
 * @property {TimeRangeOption} timeRangeOption
 */

/**
 * Represents an option available for selection, as in a <select/> element.
 * @typedef {Object} Option
 * @property {(string|number)} id
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
    [TimeRangeOption.thisMonth]: function() {
        return {
            from: moment().startOf('month').toDate(),
            to: moment().endOf('month').toDate()
        };
    },
    /**
     * This Quarter
     */
    [TimeRangeOption.thisQuarter]: function() {
        return {
            from: moment().startOf('quarter').toDate(),
            to: moment().endOf('quarter').toDate()
        };
    },
    /**
     * This Year
     */
    [TimeRangeOption.thisYear]: function() {
        return {
            from: moment().startOf('year').toDate(),
            to: moment().endOf('year').toDate()
        };
    },
    /**
     * Last Month
     */
    [TimeRangeOption.lastMonth]: function() {
        return {
            from: moment().subtract(1, 'month').startOf('month').toDate(),
            to: moment().subtract(1, 'month').endOf('month').toDate()
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
     * @param {TimeRangeOption} params.defaultTimeRangeOption
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
        this.timeRangeOption = ko.observable(params.defaultTimeRangeOption);

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
         * Beggining date for a custom time range
         * @member {KnockoutObservable<Date>}
         */
        this.fromDate = ko.observable();

        /**
         * Ending date for a custom time range
         * @member {KnockoutObservable<Date>}
         */
        this.toDate = ko.observable();

        /**
         * List of options available for time-range, that are later converted
         * into specific dates
         * @property {Array<Option>}
         * @todo i18n the texts
        */
        this.presetTimeRangeOptions = [
            { id: TimeRangeOption.thisMonth, option: 'This month' },
            { id: TimeRangeOption.thisQuarter, option: 'This quarter' },
            { id: TimeRangeOption.thisYear, option: 'This year' },
            { id: TimeRangeOption.lastMonth, option: 'Last month' },
            { id: TimeRangeOption.custom, option: 'Custom' }
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
            else {
                // Return custom range (as like id being TimeRangeOption.custom, or anything without a converter)
                return {
                    from: this.fromDate(),
                    to: this.toDate()
                };
            }
        });

        /**
         * Whether the fields for user input for a custom time range should display.
         * @member {KnockoutObservable<boolean>}
         */
        this.isCustomTimeRangeVisible = ko.pureComputed(() => {
            const id = this.timeRangeOption();
            return id === TimeRangeOption.custom;
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
            // Gives properties 'from' and 'to' directly, rather than wrapped
            // under timeRange, along with the other filters
            params.onSelect(Object.assign({}, this.timeRange(), {
                jobTitleID: this.jobTitleID(),
                platformID: this.platformID(),
                // Includes the predefined option, so allow for other UI to
                // keep in sync with it if more specialized usage than just
                // custom range is needed (like different title and so).
                timeRangeOption: this.timeRangeOption()
            }));
        })
        // Prevent that several, automated/related changes, trigger too much notifications.
        .extend({ rateLimit: { timeout: 100, method: 'notifyWhenChangesStop' } });

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
