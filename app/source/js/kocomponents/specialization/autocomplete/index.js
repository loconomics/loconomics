/**
 * An accessible specializations autocomplete input
 *
 * @module kocomponents/specialization/autocomplete
 *
 */
export { ActionForValue } from '../../input-autocomplete';
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import { specializationsAutocomplete } from '../../../data/specializations';
import template from './template.html';

const TAG_NAME = 'specialization-autocomplete';

/**
 * Component
 */
export default class SpecializationAutocomplete extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {(string|KnockoutObservable<string>)} params.id ID for the input element (important to keep in sync with an external
     * label)
     * @param {(string|KnockoutObservable<string>)} [params.value] Default input value
     * @param {(number|KnockoutObservable<number>)} [params.solutionID] Filter specializations only to ones available for a specific
     * solution, or any if null/undefined/0
     * @param {(string|KnockoutObservable<string>)} [params.isDisabled] Let's set when input is not allowed
     * @param {function} params.onSelect
     * @param {(boolean|KnockoutObservable<boolean>} [params.allowUserEntry] Whether the user
     * input text must be listed as a selectable suggestion
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
         * @member {KnockoutObservable<boolean>}
         */
        this.isDisabled = getObservable(params.isDisabled);
        /**
         * Loaded suggestions based on user input
         * @member {KnockoutObservableArray<rest/Specialization>}
         */
        this.loadedSuggestions = ko.observableArray();
        /**
         * Optional callback for external notifications when selecting an item
         * @member {Function}
         */
        this.onSelect = params.onSelect || undefined;
        /**
         * Whether the user input text should be displayed as a selectable entry
         * in the suggestions list.
         * @member {KnockoutObservable<boolean>}
         */
        this.allowUserEntry = getObservable(params.allowUserEntry || false);
        /**
         * Filter specializations by this solution, or any if no value.
         * @member {KnockoutObservable<boolean>}
         */
        this.solutionID = getObservable(params.solutionID);
        /**
         * List of suggestions to display. Uses the allowUserEntry option to
         * increase by one the available suggestions from the list of loaded
         * ones.
         * @member {KnockoutComputed<Array<rest/Specialization>>}
         */
        this.suggestions = ko.pureComputed(() => {
            const userText = this.value();
            const suggestions = this.loadedSuggestions();
            // let's add the non-empty user text as an entry
            if (this.allowUserEntry() && userText && !/^\s*$/.test(userText)) {
                return [{
                    specializationID: 0,
                    name: userText
                }, ...suggestions];
            }
            else {
                return suggestions;
            }
        });

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
     *
     * Additionally, the component allow the user typed text to be a valid
     * suggestion entry, so that one is added as the first option with a zero ID,
     * when the parameter allowUserEntry is true.
     */
    __connectData() {
        // Keeps track if a search is running, so we later know if we must delay next attempt or run immediately
        let searching = false;
        // Keeps track of delayed search to perform (just one, latest user input)
        let nextSearchValues = null;
        /**
         * Request to perform a search for the term and fill in the suggestions.
         * If no term, will empty the suggestions.
         * Recursive: once the requests ends, call itself in case there is a delayed search term (using that
         * term rather than the original).
         * @param {string} searchTerm
         * @private
         */
        const doSearch = (searchTerm, solutionID) => {
            if (!searchTerm) {
                this.loadedSuggestions([]);
                return;
            }
            searching = true;
            specializationsAutocomplete(searchTerm, solutionID)
            .then((result) => {
                this.loadedSuggestions(result);
                if (nextSearchValues) {
                    doSearch.apply(null, nextSearchValues);
                    nextSearchValues = null;
                }
                else {
                    searching = false;
                }
            });
        };

        // Compute automatically whether user input happens ('value' changes)
        this.observeChanges(() => {
            const val = this.value();
            const solutionID = this.solutionID();
            if (searching) {
                // Schedule next term, will auto-run when current search ends
                nextSearchValues = [val, solutionID];
            }
            else {
                doSearch(val, solutionID);
            }
        });
    }
}

ko.components.register(TAG_NAME, SpecializationAutocomplete);
