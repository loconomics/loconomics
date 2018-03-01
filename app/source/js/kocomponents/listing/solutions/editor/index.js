/**
 * Used for adding, editing, and copying earnings entries.
 * @module kocomponents/earnings/editor
 *
 */
import '../list';
import '../suggestions-list';
import '../../../solutions/autocomplete';
import '../../../utilities/icon-dec';
import '../../../../utils/autofocusBindingHandler';
import Komponent from '../../../helpers/KnockoutComponent';
import ko from 'knockout';
import { show as showError } from '../../../../modals/error';
import template from './template.html';

const TAG_NAME = 'listing-solutions-editor';

/**
 * @enum {string} Supported displaying modes
 */
const EditorMode = {
    add: 'add',
    edit: 'edit',
    copy: 'copy'
};

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
     * @param {KnockoutObservable<EditorMode>} [params.editorMode] Input only value setting-up the mode in use
     * @param {(number|KnockoutObservable<number>)} [params.jobTitleID] Input only ID to be edited or copied, or zero for new.
     * @param {function} [params.onSaved] Callback to notify after save the item, with the updated data included
     */
    constructor(params) {
        super();

         /**
         * Captures from the activity which "mode" the editor
         * component is to be used.
         * @member {EditorMode}
         */
        this.jobTitleID = ko.observable(ko.unwrap(params.editorMode));

         /**
         * Captures from the activity which "mode" the editor
         * component is to be used.
         * @member {EditorMode}
         */
        this.editorMode = ko.observable(ko.unwrap(params.editorMode));

        /**
         * Callback executed when the form is saved successfully, giving
         * a copy of the server data
         * @member {function}
         */
        this.onSaved = params.onSaved;

        /**
         * Holds a list of the user listings at Loconomics, available to allow
         * quick selection of job title.
         */
        this.userListingSolutions = ko.observableArray([]);

        this.__setupStatusFlags();

        /**
         * Label text for the 'save' button
         * @member {KnockoutComputed<string>}
         */
        this.saveButtonText = ko.pureComputed(() => {
            var itIs = this.isSaving();
            return itIs ? 'Submitting..' : 'Submit';
        });

        this.__setupDataOperations();
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
        /**
         * Whether the item is a new record or is being edited.
         * @member {KnockoutObservable<boolean>}
         */
        this.isNew = ko.pureComputed(() => this.editorMode() !== EditorMode.edit);
    }

    /**
     * Define members, prepare subscriptions to work with the code
     * and start any initial request for data
     * @private
     */
    __setupDataOperations() {
        /**
         * We create an item manager to operate on the data for the requested ID
         * (allows to load, save, delete).
         */
        this.dataManager = userListingSolutionsList(this.jobTitleID());

        /**
         * Notify data load errors
         */
        this.subscribeTo(userListingSolutionsList.onDataError, (err) => {
            showError({
                title: "There was an error loading your listing's categories",
                error: err
            });
        });

        this.isLoading(true);
    }

    /**
     * Save data in the server
     * @returns {Promise<object>}
     */
    save() {
        if (this.isSaving()) return Promise.reject();

        this.isSaving(true);

        const data = this.earningsEntry.model.toPlainObject(true);

        return this.dataManager
        .save(data)
        .then((freshData) => {
            this.isSaving(false);
            if (this.onSaved) {
                // Notify
                this.onSaved(freshData);
            }
            else {
                // Use updated/created data
                this.earningsEntry.model.updateWith(freshData);
            }
        })
        .catch((error) => {
            this.isSaving(false);
            showError({
                title: 'There was an error saving the earnings entry',
                error
            });
        });
    }
}

ko.components.register(TAG_NAME, ListingSolutionsEditor);
