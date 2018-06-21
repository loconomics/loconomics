/**
 * Form fields to selet a time range as an earnings filters option
 *
 * @module kocomponents/earnings/time-range-filter
 */
import Komponent from '../../helpers/KnockoutComponent';
import TimeRangeOption from './TimeRangeOption';
import { create as createEditableDate } from '../../../utils/inputEditableComputedDate';
import ko from 'knockout';
import moment from 'moment';
import template from './template.html';

const TAG_NAME = 'earnings-time-range-filter';

/**
 * Describes a specific range of time giving two dates, both inclusive,
 * plus the option type it belongs to if any.
 *
 * Note: it includes the predefined option, so it allow to some UI elements to
 * keep in sync with it if more specialized usage than just
 * custom range is needed (like different title and so).
 * @typedef {Object} TimeRange
 * @property {Date} from
 * @property {Date} to
 * @property {TimeRangeOption} option
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
            to: moment().endOf('month').toDate(),
            option: TimeRangeOption.thisMonth
        };
    },
    /**
     * This Quarter
     */
    [TimeRangeOption.thisQuarter]: function() {
        return {
            from: moment().startOf('quarter').toDate(),
            to: moment().endOf('quarter').toDate(),
            option: TimeRangeOption.thisQuarter
        };
    },
    /**
     * This Year
     */
    [TimeRangeOption.thisYear]: function() {
        return {
            from: moment().startOf('year').toDate(),
            to: moment().endOf('year').toDate(),
            option: TimeRangeOption.thisYear
        };
    },
    /**
     * Last Month
     */
    [TimeRangeOption.lastMonth]: function() {
        return {
            from: moment().subtract(1, 'month').startOf('month').toDate(),
            to: moment().subtract(1, 'month').endOf('month').toDate(),
            option: TimeRangeOption.lastMonth
        };
    }
};

/**
 * Component
 */
export default class EarningsTimeRangeFilter extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {Function<TimeRangeOption>} params.onSelect Callback executed when the user
     * changes the selected values, providing the TimeRange value.
     * @param {TimeRangeOption} params.defaultTimeRangeOption
     */
    constructor(params) {
        super();

        // Required Callback for external notifications on changing filters
        if (typeof(params.onSelect) !== 'function') {
            throw new Error('time-range-filter: onSelect param is required');
        }

        /**
         * Predefined Time Range option selected
         * @member {KnockoutObservable<number>}
         */
        this.timeRangeOption = ko.observable(params.defaultTimeRangeOption);

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
            else if (id === TimeRangeOption.custom) {
                // Return custom range
                return {
                    from: this.fromDate(),
                    to: this.toDate(),
                    option: id
                };
            }
            else {
                // No option, no dates filtering (global report)
                return {
                    from: null,
                    to: null,
                    option: id
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
         * Automatically trigger onSelect on options changes
         */
        this.timeRange.subscribe(params.onSelect);
    }
}

ko.components.register(TAG_NAME, EarningsTimeRangeFilter);
