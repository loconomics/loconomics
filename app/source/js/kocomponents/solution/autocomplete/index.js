/**
 * An accessible solutions autocomplete input
 *
 * @module kocomponents/solution/autocomplete
 *
 */
export { ActionForValue } from '../../input-autocomplete';
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import { solutionsAutocomplete } from '../../../data/solutions';
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

        this.id = getObservable(params.id);

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
        let searching = false;
        let nextSearchTerm = null;
        const doSearch = (searchTerm) => {
            if (!searchTerm) {
                this.suggestions([]);
                return;
            }
            console.info('Solution search', searchTerm);
            searching = true;
            solutionsAutocomplete(searchTerm)
            .then((result) => {
                this.suggestions(result);
                if (nextSearchTerm) {
                    doSearch(nextSearchTerm);
                    nextSearchTerm = null;
                }
                else {
                    searching = false;
                }
            });
        };

        this.observeChanges(() => {
            const val = this.value();
            if (searching) {
                // Schedule next term, will auto-run when current search ends
                nextSearchTerm = val;
            }
            else {
                doSearch(val);
            }
        });
    }
}

ko.components.register(TAG_NAME, SolutionAutocomplete);
