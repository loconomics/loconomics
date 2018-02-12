
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
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import { show as showError } from '../../../modals/error';
import template from './template.html';
import { item as userEarningsItem } from '../../../data/userEarnings';

const TAG_NAME = 'earnings-editor';

/**
 * Component
 */
export default class EarningsEditor extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {KnockoutObservable<string>} [params.editorMode]
     * @param {KnockoutObservable<integer>} [params.earningsEntryID]
     * @param {KnockoutObservable<integer>} [params.platformID]
     * @param {KnockoutObservable<integer>} [params.startAtStep]
     */
    constructor(params) {
        super();

        /**
         * Captures from the activity which "mode" the editor
         * component is to be used.
         * add: no values
         * edit:
         * copy:
         * @member {KnockoutObservable<string>}
         */
        this.editorMode = getObservable(params.editorMode);

        /**
         * Holds the ID for an earnings entry if being edited or
         * copied.
         * @member {KnockoutObservable<number>}
         */
        this.earningsEntryID = getObservable(params.earningsEntryID || 0);

        /**
         * @member {KnockoutObservable<object>}
         */
        this.client = ko.observable(null);

        /**
         * Holds the ID for a platform if being added from the
         * external-listing-view activity.
         * @member {KnockoutObservable<number>}
         */
        this.platformID = getObservable(params.platformID || null);

        this.duration = ko.pureComputed({
            read: () => {
                var e = this.earningsEntry();
                return e && e.durationMinutes || 0;
            },
            write: (value) => {
                var e = this.earningsEntry();
                if (e) {
                    e.durationMinutes = value;
                }
            }
        });

        /**
         * Callback executed when the form is saved successfully, giving
         * a copy of the server data
         * @member {function}
         */
        this.onSaved = params.onSaved;

        /**
         * Client returned given query parameters.
         * @method
         */
        this.selectClient = function(client) {
            this.earningsEntry.clientUserID = client.clientID;
            this.goToSummary();
        }.bind(this);

        /**
         * Earnings entry returned given query parameters.
         * @member {KnockoutObservable<object>}
         */
        this.earningsEntry = ko.observable({});

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
         * Error message from last 'save' operation
         * @member {KnockoutObservable<string>}
         */
        this.errorMessage = ko.observable('');

        /**
         * When a saving request it's on the works
         * @member {KnockoutObservable<boolean>}
         */
        this.isSaving = ko.observable(false);

        /**
         * When edition must be locked because of in progress
         * operations. Just an alias for saving in this case, but
         * expected to be used properly at the data-binds
         * @member {KnockoutComputed<boolean>}
         */
        this.isLocked = this.isSaving;

        let item;

        // On ID change, request to load the entry data
        this.observeChanges(() => {
            const id = this.earningsEntryID();
            item = userEarningsItem(id);
            item.onceLoaded()
            .then(this.earningsEntry)
            .catch((error) => {
                showError({
                    title: 'There was an error loading the earnings entry',
                    error
                });
            });
        });

        /**
         * Save data in the server
         * @returns {Promise<object>}
         */
        this.save = () => {
            if (!item) return;
            if (!this.earningsEntry()) return;

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
                    this.earningsEntry(freshData);
                    this.earningsEntryID(freshData.earningsEntryID);
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
    }
}

ko.components.register(TAG_NAME, EarningsEditor);

