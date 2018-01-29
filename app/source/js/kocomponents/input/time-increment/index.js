
/**
 * Used to view the details of an earnings entry.
 * 
 * @module kocomponents/input/time-increment
 *
 */

import '../../../utils/autofocusBindingHandler';
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'input-time-increment';

/**
 * Component
 */
export default class InputTimeIncrement extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param [(number|KnockoutObservable<number>)] 
     * [params.timeInput]
     * @param {(number|KnockoutObservable<number>)} 
     * [params.timeStepValue]
     */
    constructor(params) {
        super();

        /**
         * Holds the value of the time input.
         * @member {KnockoutObservable<number>}
         */
        this.timeInput = getObservable(params.timeInput || 175);

        /**
         * The value of the step to increase and decrease.
         * @member {KnockoutObservable<number>}
         */
        this.timeStepValue = getObservable(params.timeStepValue || 15);

        /**
         * Takes the user to the next step in the form.
         * @member {KnockoutComputed<number>}
         */
        this.increaseTime = function() {
            this.timeInput(this.timeInput() + this.timeStepValue());
        }; 

        /**
         * Decreases the time input by the time step value.
         * @member {KnockoutComputed<number>}
         */
        this.decreaseTime = function() {
            this.timeInput(this.timeInput() - this.timeStepValue());
        }; 

        /**
         * Diplays the time in hours and minutes.
         * @member {KnockoutComputed<string>}
         */
        this.displayTime = ko.pureComputed( () => {
            const time = this.timeInput()/60;
            const hours = parseInt(time,10);
            const minutes = this.timeInput() - (hours*60);
            return hours + ' hours ' + minutes + ' minutes';
        }); 
    }
}

ko.components.register(TAG_NAME, InputTimeIncrement);

