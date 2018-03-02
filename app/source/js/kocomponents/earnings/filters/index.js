/**
 * Form with available filter options for earnings.
 *
 * @module kocomponents/earnings/filters
 */
import Komponent from '../../helpers/KnockoutComponent';
import TimeRangeOption from './TimeRangeOption';
import { create as createEditableDate } from '../../../utils/inputEditableComputedDate';
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
 * Describes values for a set of selected filters.
 * Properties described as 'filtering value' are the actual values that must be
 * used for filtering, the rest are just information for the UI.
 * @typedef {Object} EarningsFilterValues
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
         * Job title object selected.
         * @member {KnockoutObservable<object>}
         */
        this.jobTitle = ko.observable();

        /**
         * External Listing ID selected
         * @member {KnockoutObservable<number>}
         */
        this.userExternalListingID = ko.observable();

        /**
         * External listing object selected.
         * @member {KnockoutObservable<object>}
         */
        this.externalListing = ko.observable();

        /**
         * Beggining date for a custom time range.
         * Defaults to start of the week
         * @member {KnockoutObservable<Date>}
         */
        this.fromDate = ko.observable(moment().startOf('week').toDate());

        /**
         * Ending date for a custom time range.
         * Defaults to end of the week
         * @member {KnockoutObservable<Date>}
         */
        this.toDate = ko.observable(moment().endOf('week').toDate());

        /**
         * Let's access the date in a string format suitable for edition from
         * an input control, based on browser support for input[type=date]
         * Source date is a Date instance.
         * @member {KnockoutComputed<string>}
         */
        this.editableFromDate = createEditableDate(this.fromDate);

        /**
         * Let's access the date in a string format suitable for edition from
         * an input control, based on browser support for input[type=date]
         * Source date is a Date instance.
         * @member {KnockoutComputed<string>}
         */
        this.editableToDate = createEditableDate(this.toDate);

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
            const range = this.timeRange();
            const jobTitle = this.jobTitle();
            const externalListing = this.externalListing();
            params.onSelect({
                fromDate: range.from,
                toDate: range.to,
                jobTitleID: jobTitle && jobTitle.jobTitleID,
                userExternalListingID: externalListing && externalListing.userExternalListingID,
                // Includes the predefined option, so allow for other UI to
                // keep in sync with it if more specialized usage than just
                // custom range is needed (like different title and so).
                timeRangeOption: this.timeRangeOption(),
                jobTitleText: jobTitle && jobTitle.jobTitleSingularName,
                userExternalListingText: externalListing && externalListing.title
            });
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
