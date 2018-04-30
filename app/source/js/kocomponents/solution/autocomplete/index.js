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
     * @param {(string|KnockoutObservable<string>)} params.id ID for the input element (important to keep in sync with an external
     * label)
     * @param {(string|KnockoutObservable<string>)} params.value Default input value
     * @param {function} params.onSelect
     */
    constructor(params) {
        super();

        /**
         * @member {KnockoutObservable<string>}
         */
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
     * Connect component with data and user interactions.
     *
     * General strategy on requesting results:
     * - Let any started request to finish and to show it's results
     * - New request while one is loading just registers itself for later (delayed)
     * - It's delayed to be run just after the current active, not after a previously delayed
     * - In other words, there is no queue of pending request, only one (last registered) will execute
     * - This prevents from running too much request, most of them would be obsolete at the moment of start,
     *   getting a fast feedback and fast last results (when user stops typing).
     */
    __connectData() {
        // Keeps track if a search is running, so we later know if we must delay next attempt or run immediately
        let searching = false;
        // Keeps track of delayed search to perform (just one, latest user input)
        let nextSearchTerm = null;
        /**
         * Request to perform a search for the term and fill in the suggestions.
         * If no term, will empty the suggestions.
         * Recursive: once the requests ends, call itself in case there is a delayed search term (using that
         * term rather than the original).
         * @param {string} searchTerm
         * @private
         */
        const doSearch = (searchTerm) => {
            if (!searchTerm) {
                this.suggestions([]);
                return;
            }
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

        // Compute automatically whether user input happens ('value' changes)
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
