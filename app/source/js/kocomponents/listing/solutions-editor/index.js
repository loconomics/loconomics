/**
 * Used for adding, editing, and copying earnings entries.
 * @module kocomponents/earnings/editor
 *
 */
import '../../solution/autocomplete';
import '../../utilities/icon-dec';
import Komponent from '../../helpers/KnockoutComponent';
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
     * Parameters allowed are 'input only' when the value given is read at constructor
     * and keeps constant internally. If is an observable, any change from outside is
     * not read.
     * @param {object} params
     * @param {(number|KnockoutObservable<number>)} params.userListingID
     * @param {function} [params.onSaved] Callback to notify after save the item, with the updated data included
     */
    constructor(params) {
        super();

         /**
         * Captures the jobTitleID to identify
         * which listing's categories to edit.
         * @member {number}
         */
        this.userListingID = ko.unwrap(params.userListingID);

        this.listingSolutions = ko.observableArray([]);

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
