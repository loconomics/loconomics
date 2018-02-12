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

        // Force first refresh on datepicker to allow
        // event handlers to get notified on first time:
        $datePicker.datepicker('fill');
    }
}

ko.components.register(TAG_NAME, InputDate);

