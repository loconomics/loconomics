/**
 * Let's edit the solutions attached to a specific user listing.
 * @module kocomponents/listing/solutions-editor
 *
 */
import '../../solution/autocomplete';
import '../../utilities/icon-dec';
import Komponent from '../../helpers/KnockoutComponent';
import { byJobTitleID } from '../../../data/solutions';
import { byUserListing } from '../../../data/userSolutions';
import ko from 'knockout';
import { show as showError } from '../../../modals/error';
import template from './template.html';

const TAG_NAME = 'listing-solutions-editor';

/**
 * Component
 */
export default class ListingSolutionsEditor extends Komponent {

    static get template() { return template; }

    /**
     * Both ID parameters are input only, immutable for the component instance.
     * @param {object} params
     * @param {(number|KnockoutObservable<number>)} params.userListingID
     * @param {(number|KnockoutObservable<number>)} [params.jobTitleID] The job title assigned to the given listing,
     * used to load suggestions of solutions (is optional, not giving it just disables visualization
     * of suggestions)
     * @param {function} [params.onSaved] Callback to notify after save the item, with the updated data included
     */
    constructor(params) {
        super();

         /**
         * @member {number}
         */
        this.userListingID = ko.unwrap(params.userListingID);

         /**
         * @member {number}
         */
        this.jobTitleID = ko.unwrap(params.jobTitleID);

        /**
         * List of solutions attached to the user listing
         * @member {KnockoutObservableArray<rest/Solution>}
         */
        this.listingSolutions = ko.observableArray([]);

        /**
         * List of solutions suggested for the job title
         * @member {KnockoutObservableArray<rest/Solution>}
         */
        this.suggestedSolutions = ko.observableArray([]);

        /**
         * Callback executed when the form is saved successfully, giving
         * a copy of the server data
         * @member {function}
         */
        this.onSaved = params.onSaved;

        this.__setupStatusFlags();

        /**
         * Label text for the 'save' button
         * @member {KnockoutComputed<string>}
         */
        this.saveButtonText = ko.pureComputed(() => {
            var itIs = this.isSaving();
            return itIs ? 'Submitting..' : 'Submit';
        });

        this.__connectData();
    }

    /**
     * Define members for all the status flags needed.
     * @private
     */
    __setupStatusFlags() {
        /**
         * When a loading request it's on the works
         * @member {KnockoutObservable<boolean>}
         */
        this.isLoading = ko.observable(false);

        /**
         * When a saving request it's on the works
         * @member {KnockoutObservable<boolean>}
         */
        this.isSaving = ko.observable(false);

        /**
         * When edition must be locked because of in progress
         * operations.
         * @member {KnockoutComputed<boolean>}
         */
        this.isLocked = ko.pureComputed(() => this.isSaving() || this.isLoading());
    }

    __connectData() {
        const dataProvider = byUserListing(this.userListingID);
        this.subscribeTo(dataProvider.onData, this.listingSolutions);
        this.subscribeTo(dataProvider.onDataError, (error) => {
            showError({
                title: 'There was an error loading your search categories',
                error
            });
        });

        const suggestionsProvider = byJobTitleID(this.jobTitleID);
        this.subscribeTo(suggestionsProvider.onData, this.suggestedSolutions);
        this.subscribeTo(suggestionsProvider.onDataError, (error) => {
            showError({
                title: 'There was an error loading suggestions for your listing',
                error
            });
        });
    }

    unselectItem(solution) {
        this.listingSolutions.remove(solution);
    }

    selectItem(solution) {
        this.listingSolutions.push(solution);
    }

    fromAutocomplete(name, solution) {
        this.selectItem(solution);
    }

    /**
     * Save data in the server
     * @returns {Promise}
     */
    save() {
        if (this.isSaving()) return Promise.reject();

        this.isSaving(true);

        const dataProvider = byUserListing(this.userListingID);
        const data = {
            solutions: this.listingSolutions().map((solution) => solution.solutionID)
        };

        return dataProvider
        .save(data)
        .then((freshData) => {
            this.isSaving(false);
            if (this.onSaved) {
                // Notify
                this.onSaved(freshData);
            }
            else {
                // Use updated data
                this.listingSolutions(freshData);
            }
        })
        .catch((error) => {
            this.isSaving(false);
            showError({
                title: 'There was an error saving your search categories',
                error
            });
        });
    }
}

ko.components.register(TAG_NAME, ListingSolutionsEditor);
