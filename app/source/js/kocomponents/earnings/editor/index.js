
/**
 * Used for adding, editing, and copying earnings entries.
 * @module kocomponents/earnings/editor
 *
 */

import '../../client/editor';
import '../../client/list';
import '../../utilities/icon-dec';
import '../../input/duration';
import '../../../utils/autofocusBindingHandler';
import '../../input/date';
import Komponent from '../../helpers/KnockoutComponent';
import UserEarningsEntry from '../../../models/UserEarningsEntry';
import ko from 'knockout';
import { show as showError } from '../../../modals/error';
import template from './template.html';
import { item as userEarningsItem } from '../../../data/userEarnings';

const TAG_NAME = 'earnings-editor';

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
export default class EarningsEditor extends Komponent {

    static get template() { return template; }

    /**
     * Parameters allowed are 'input only' when the value given is read at constructor
     * and keeps constant internally. If is an observable, any change from outside is
     * not read.
     * @param {object} params
     * @param {KnockoutObservable<EditorMode>} [params.editorMode] Input only value setting-up the mode in use
     * @param {(number|KnockoutObservable<number>)} [params.earningsEntryID] Input only ID to be edited or copied, or zero for new.
     * @param {(number|KnockoutObservable<number>)} [params.userExternalListingID] Input only ID to preset the external listing,
     * this let's add an earning from a listing component as a shortcut.
     * @param {KnockoutObservable<integer>} [params.startAtStep] Input only value setting-up the initial step for the component.
     */
    constructor(params) {
        super();

        /**
         * Editable earnings entry. Same instance is used all the time, just
         * updating content, simplifying working with the form and summary.
         * @member {UserEarningsEntry}
         */
        this.earningsEntry = new UserEarningsEntry({
            earningsEntryID: ko.unwrap(params.earningsEntryID) || 0,
            userExternalListingID: ko.unwrap(params.userExternalListingID)
        });

        /**
         * Captures from the activity which "mode" the editor
         * component is to be used.
         * @member {EditorMode}
         */
        this.editorMode = ko.observable(ko.unwrap(params.editorMode));

        /**
         * @member {KnockoutObservable<object>}
         */
        this.selectedClient = ko.observable(null);

        /**
         * Callback executed when the form is saved successfully, giving
         * a copy of the server data
         * @member {function}
         */
        this.onSaved = params.onSaved;

        /**
         * Makes given client current one selected.
         * @param {Object} client
         * @method
         */
        this.selectClient = function(client) {
            // Updates edited entry with the client ID selected
            this.earningsEntry.clientUserID(client.clientID);
            // Save a reference, to display name and other info
            this.selectedClient(client);
            this.goToSummary();
        }.bind(this);

        /// Steps management

        // startAtStep parameter defaults to 1 when no value, BUT 0 is a valid value asking to start
        // at the summary
        let startAtStep = ko.unwrap(params.startAtStep);
        if (startAtStep === null || typeof startAtStep === 'undefined') {
            // Default value
            startAtStep = 1;
        }

        /**
         * Keeps track of the current step being displayed
         * @member {KnockoutObservable<integer>}
         */
        this.currentStep = ko.observable(startAtStep);

        /**
         * Returns which step the user is on in the form.
         * @member {KnockoutComputed<boolean>}
         */
        this.isAtStep = function(number) {
            return ko.pureComputed( () => this.currentStep() === number);
        };

        /**
         * Takes the user to the next step in the form.
         * @member {KnockoutComputed<number>}
         */
        this.goNextStep = function() {
            this.currentStep(this.currentStep() + 1);
        };

        this.goToStep = (step) => {
            this.currentStep(step);
        };

        this.goToSummary = function() {
            this.currentStep(0);
            this.editorMode('edit');
            this.stepButtonLabel = 'Save';
        };

         /**
         * Takes the user to the next step in the form.
         * @member {KnockoutComputed<string>}
         */
        this.stepButtonLabel = ko.pureComputed( () => {
            if (this.editorMode() == 'add') {
                return 'Save and Continue';
            }
            else {
                return 'Save';
            }
        });

        /**
         * Takes the user to the next step in the form.
         * @member {KnockoutComputed<number>}
         */
        this.saveStep = function() {
            if (this.editorMode() == 'add') {
                this.goNextStep();
            }
            else {
                this.currentStep(0);
            }
        };

        /// Statuses

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

        /// Data Operations

        // We create an item manager to operate on the data for the requested ID
        // (allows to load, save, delete).
        const item = userEarningsItem(this.earningsEntry.earningsEntryID());

        /**
         * Save data in the server
         * @returns {Promise<object>}
         */
        this.save = () => {
            if (!item) return;

            this.isSaving(true);

            item
            .save(this.earningsEntry())
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
        };

        // When we have an ID, we need to load it first
        if (this.earningsEntry.earningsEntryID()) {

            this.isLoading(true);

            item.onceLoaded()
            .then((data) => {
                this.isLoading(false);
                if (this.editorMode() === EditorMode.copy) {
                    // On copy mode, we need to reset the ID so it forces to
                    // create a new entry (otherwise it will actually update
                    // the original one)
                    data.earningsEntryID = 0;
                }
                this.earningsEntry.model.updateWith(data);
            })
            .catch((error) => {
                this.isLoading(false);
                showError({
                    title: 'There was an error loading the earnings entry',
                    error
                });
            });
        }
    }
}

ko.components.register(TAG_NAME, EarningsEditor);

