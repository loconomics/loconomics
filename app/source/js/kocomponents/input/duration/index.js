
/**
 * Used to view the details of an earnings entry.
 * 
 * @module kocomponents/input/duration
 *
 */

import '../../../utils/autofocusBindingHandler';
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'input-duration';

/**
 * Component
 */
export default class InputDuration extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param [(number|KnockoutObservable<number>)] 
     * [params.durationInput]
     * @param {(number|KnockoutObservable<number>)} 
     * [params.durationStepValue]
     */
    constructor(params) {
        super();

        /**
         * Holds the value of the duration input.
         * @member {KnockoutObservable<number>}
         */
        this.durationInput = getObservable(params.durationInput || 175);

        /**
         * The value of the step to increase and decrease.
         * @member {KnockoutObservable<number>}
         */
        this.durationStepValue = getObservable(params.durationStepValue || 15);

        /**
         * Takes the user to the next step in the form.
         * @member {KnockoutComputed<number>}
         */
        this.increaseDuration = function() {
            this.durationInput(this.durationInput() + this.durationStepValue());
        }; 

        /**
         * Decreases the duration input by the duration step value.
         * @member {KnockoutComputed<number>}
         */
        this.decreaseDuration = function() {
            this.durationInput(this.durationInput() - this.durationStepValue());
        }; 

        /**
         * Diplays the duration in hours and minutes.
         * @member {KnockoutComputed<string>}
         */
        this.displayDuration = ko.pureComputed( () => {
            const duration = this.durationInput()/60;
            const hours = parseInt(duration,10);
            const minutes = this.durationInput() - (hours*60);
            return hours + ' hours ' + minutes + ' minutes';
        }); 
    }
}

ko.components.register(TAG_NAME, InputDuration);

