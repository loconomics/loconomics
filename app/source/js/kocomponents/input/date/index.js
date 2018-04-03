/**
 * Let's pick a date from a calendar.
 *
 * It allows usage both one-way and two-way data binding.
 * Use preselectedValue and onSelect for one-way,
 * and value for two-way. More details at the members documentation.
 *
 * Sometimes, can be useful to use 'value' for two-way binding, plus onSelect
 * to perform an action when actually selected by the user (with selected date already
 * placed at the 'value' observable).
 * But using both value and preselectedValue is clearly a mistake
 * and is throw on initialization.
 *
 * @module kocomponents/input/date
 */

import '../../../components/DatePicker';
import $ from 'jquery';
import Komponent from '../../helpers/KnockoutComponent';
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'input-date';

/**
 * Component
 */
export default class InputDate extends Komponent {

    static get template() { return template; }

    /**
     * All parameters matches members of the component instance, check them
     * for full documentation details and usage.
     * @param {object} params
     * @param {(Date|KnockoutObservable<Date>)} params.preselectedValue
     * @param {Function<Date>} params.onSelect
     * @param {KnockoutObservable<Date>} params.value
     */
    constructor(params) {
        super();

        // Verify usage mistake
        if (typeof params.preselectedValue !== 'undefined' &&
            typeof params.value !== 'undefined') {
            // Error advice: You should want to use preselectedValue with onSelect, or value alone,
            // just check the documentation on each members below.
            throw new Error('Incompatible combination of parameters: value and preselectedValue.');
        }

        /**
         * Allows to receive a date for the initial value.
         * This allows one-way data binding, paired with onSelect
         * @member {KnockoutObservable<Date>}
         */
        this.preselectedValue = ko.unwrap(params.preselectedValue);

        /**
         * Allows to receive a callback that will be executed whenever user
         * selects a date. Can happens multiple times.
         * This allows one-way data binding, paired with preselectedDate if
         * an initial value needs to be set.
         * @member {Function<Date>}
         */
        this.onSelect = params.onSelect;

        /**
         * Holds the date selected whenever is picked by the user, allowing an
         * external value for the initial selected date.
         * This allows two-way data binding, like the KO value binding (but
         * remember, this is a component parameter)
         * @member {KnockoutObservable<Date>}
         */
        this.value = params.value;
    }

    beforeBinding({ element }) {
        // Init jQuery plugin
        var $datePicker = $(element).find('.calendar-placeholder');
        $datePicker.show().datepicker();

        // When the date changes in the plugin as of user interaction...
        $datePicker.on('dateChanged', (e) => {
            if (e.viewMode === 'days') {
                // Update and notify the new value
                if (this.onSelect) this.onSelect(e.date);
                if (this.value) this.value(e.date);
            }
        });

        // Update plugin on value observable change (two-way binding)
        if (this.value) {
            this.value.subscribe((date) => {
                var elDate = $datePicker.datepicker('getValue');
                if (elDate !== date) {
                    $datePicker.datepicker('setValue', date, true);
                }
            });
        }

        // Set the date given externally as first value as selected and as current view
        const initialValue = this.preselectedValue || this.value();
        // (we set it even if null, so clearly keeps unselected at the calendar rather
        // than current date as default).
        $datePicker.datepicker('setValue', initialValue, true);
        // if is null, we must place the view at current date (or, because previous
        // call with null, it keeps initiliazed at 1970!)
        if (!initialValue) {
            $datePicker.datepicker('setViewDate', new Date());
        }
    }
}

ko.components.register(TAG_NAME, InputDate);

