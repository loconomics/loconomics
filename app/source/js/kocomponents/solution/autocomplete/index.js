/**
 * An accessible solutions autocomplete input
 *
 * @module kocomponents/solution/autocomplete
 *
 */
import './input-autocomplete';
import Komponent from '../../helpers/KnockoutComponent';
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'solution-autocomplete';

/**
 * Component
 */
export default class SolutionAutocomplete extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {(string|KnockoutObservable<string>)} params.value Default input value
     * @param {function} params.onSelect
     */
    constructor(params) {
        super();

        /**
         * User text input, allows a default value
         * @member {KnockoutObservable<string>}
         */
        this.value = ko.observable(ko.unwrap(params.value));
        /**
         * Loaded suggestions based on user input
         * @member {KnockoutObservableArray<rest/Solution>}
         */
        this.suggestions = ko.observableArray();
        /**
         * Optional callback for external notifications when selecting an item
         */
        this.onSelect = params.onSelect || undefined;

        this.__connectData();
    }

    /**
     * Connect component with data and user interactions
     */
    __connectData() {
        this.observeChanges(() => {
            const val = this.value();
            //..
        });
    }
}

ko.components.register(TAG_NAME, SolutionAutocomplete);
