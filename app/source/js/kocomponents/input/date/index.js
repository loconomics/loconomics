/**
 * Let's pick a date from a calendar
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
     * @param {object} params
     * @param {KnockoutObservable<Date>} params.selectedDate
     */
    constructor(params) {
        super();

        /**
         * Holds the date selected. Can include a date from outside to preselect.
         * @member {KnockoutObservable<number>}
         */
        this.selectedDate = params.selectedDate;
    }

    beforeBinding({ element }) {
        // Init jQuery plugin
        var $datePicker = $(element).find('.calendar-placeholder');
        $datePicker.show().datepicker();

        // Update observable on plugin change
        $datePicker.on('dateChanged', (e) => {
            if (e.viewMode === 'days') {
                this.selectedDate(e.date);
            }
        });

        // Update plugin on observable change
        this.selectedDate.subscribe((date) => {
            var elDate = $datePicker.datepicker('getValue');
            if (elDate !== date) {
                $datePicker.datepicker('setValue', date, true);
            }
        });

        // Set the date given externally as first value as selected and view
        // (can be null for non selected)
        $datePicker.datepicker('setValue', this.selectedDate(), true);
        // if is null, we must place the view at current date (or, cause previous
        // call with null, it keeps initiliazed at 1970!)
        if (!this.selectedDate()) {
            $datePicker.datepicker('setViewDate', new Date());
        }
    }
}

ko.components.register(TAG_NAME, InputDate);

