/**
 * Used for adding, editing, and copying earnings entries.
 * @module kocomponents/posting/editor
 *
 */
import '../../utilities/icon-dec';
import '../../../utils/autofocusBindingHandler';
import '../../specialization/autocomplete';
import '../../question/editor';
import { ActionForValue } from '../../solution/autocomplete';
import Komponent from '../../helpers/KnockoutComponent';
import UserPosting from '../../../models/UserPosting';
import ko from 'knockout';
import { item as postingTemplateItem } from '../../../data/postingTemplates';
import { show as showConfirm } from '../../../modals/confirm';
import { show as showError } from '../../../modals/error';
import template from './template.html';
import { item as userPosting } from '../../../data/userPostings';

const TAG_NAME = 'posting-editor';

/**
 * @enum {string} Supported displaying modes
 */
export const EditorMode = {
    add: 'add',
    edit: 'edit',
    copy: 'copy'
};

/**
 * Component
 */
export default class PostingEditor extends Komponent {

    static get template() { return template; }

    /**
     * Parameters allowed are 'input only' when the value given is read at constructor
     * and keeps constant internally. If is an observable, any change from outside is
     * not read.
     * @param {object} params
     * @param {KnockoutObservable<EditorMode>} [params.editorMode] Input only value setting-up the mode in use
     * @param {(number|KnockoutObservable<number>)} [params.userPostingID] Input only ID to be edited or copied, or zero for new.
     * this let's add an earning from a listing component as a shortcut.
     * @param {function} [params.onSaved] Callback to notify after save the item, with the updated data included
     * @param {function} [params.onDeleted] Callback to notify after delete the item
     */
    constructor(params) {
        super();

        /**
         * Editable user posting. Same instance is used all the time, just
         * updating content, simplifying working with the form and summary.
         * @member {UserPosting}
         */
        this.data = new UserPosting({
            userPostingID: ko.unwrap(params.userPostingID) || 0
        });

        /**
         * Holds the posting template, with all the questions, based on the
         * solutionID picked by the user for the posting
         * @member {KnockoutObservable<rest/PostingTemplate>}
         */
        this.postingTemplate = ko.observable();

        this.postingResponses = ko.observableArray();

        this.responsesForQuestion = (question) => {
            const id = question.questionID;
            const all = this.postingResponses();
            let responses = all.find((r) => r.questionID === id);
            if (!responses) {
                responses = {
                    questionID: id,
                    responses: ko.observableArray()
                };
                this.postingResponses.push(responses);
            }
            return responses;
        };

        /**
         * Keeps a timestamp of the loaded data, allowing to track when there
         * are changes.
         * @member {Date}
         */
        this.dataTimestamp = ko.observable(this.data.model.dataTimestamp());

        // Is allowed to request a 'copy' mode from outside if an ID is provided,
        // on any other case, the mode is automatic depending whether a positive ID
        // is given or not
        let requestedEditorMode = ko.unwrap(params.editorMode);
        if (requestedEditorMode !== EditorMode.copy || !this.data.userPostingID()) {
            requestedEditorMode = this.data.userPostingID() ? EditorMode.edit : EditorMode.add;
        }
        /**
         * Captures from the activity which "mode" the editor
         * component is to be used.
         * @member {EditorMode}
         */
        this.editorMode = ko.observable(requestedEditorMode);

        /**
         * Callback executed when the form is saved successfully, giving
         * a copy of the server data
         * @member {function}
         */
        this.onSaved = params.onSaved;

        /**
         * Callback executed when the entry was deleted successfully
         * @member {function}
         */
        this.onDeleted = params.onDeleted;

        // Starts in review mode when we are editing or copying an entry,
        // so anything else but 'add'
        this.__setupStepsManagement(this.editorMode() !== EditorMode.add);

        this.__setupStatusFlags();

        /**
         * Whether there are changes not saved.
         * @member {KnockoutComputed<boolean>}
         */
        this.hasUnsavedChanges = ko.pureComputed(() => {
            var c = this.data;
            return c && this.dataTimestamp() !== c.model.dataTimestamp();
        });

        /**
         * Label text for the 'delete' button
         * @member {KnockoutComputed<string>}
         */
        this.deleteButtonText = ko.pureComputed(() => {
            var itIs = this.isDeleting();
            return itIs ? 'Deleting..' : 'Delete';
        });

        /**
         * Label text for the 'save' button
         * @member {KnockoutComputed<string>}
         */
        this.saveButtonText = ko.pureComputed(() => {
            // Special case when we are copying an entry and it was not
            // changed still, so looks like a duplicated entry
            const isDuplicated = this.editorMode() === EditorMode.copy && !this.hasUnsavedChanges();
            // Text depending on state:
            const text = (
                this.isLoading() ?
                'Loading...' :
                this.isSaving() ?
                'Submitting..' :
                isDuplicated ?
                'Unchanged' :
                this.isNew() ?
                'Submit' :
                this.hasUnsavedChanges() ?
                'Submit changes' :
                // anything else:
                'Submitted'
            );
            return text;
        });

        /**
         * Label text for the 'delete' button
         * @member {KnockoutComputed<string>}
         */
        this.closeButtonText = ko.pureComputed(() => {
            var itIs = this.isClosing();
            return itIs ? 'Closing..' : 'Close posting';
        });

        this.__connectData();
    }

    /**
     * Define members to implement a step based interface.
     * @param {boolean} [startInReview=false] Whether the interface must start at the
     * summary step with review enabled.
     * @private
     */
    __setupStepsManagement(startInReview) {
        /**
         * Magic number for the step where is the summary.
         * @const {number}
         * @private
         */
        const SUMMARY_STEP = 0;
        /**
         * Keeps track of the current step being displayed.
         * By default is 1, first step, except when starting at review that will
         * be 0 (the summary).
         * This default is in sync with isAtReview initialization.
         * @member {KnockoutObservable<integer>}
         */
        this.currentStep = ko.observable(startInReview ? SUMMARY_STEP : 1);

        /**
         * Returns which step the user is on in the form.
         * @member {KnockoutComputed<boolean>}
         */
        this.isAtStep = function(number) {
            return ko.pureComputed(() => this.currentStep() === number);
        };

        /**
         * Whether the user has completed the steps almost once and is free
         * to jump between the summary and steps in order to do touch ups.
         * By default is false, which means the user is restricted to follow
         * the steps in order until finalize and reach the summary, when
         * this flag switchs to true.
         * Can be set.
         * By default is false, except when starting at review that will be true.
         * This default is in sync with currentStep initialization.
         * @member {KnockoutObservable<boolean>}
         */
        this.isAtReview = ko.observable(!!startInReview);

        /**
         * Takes the user to the next step in the form.
         * @member {KnockoutComputed<number>}
         */
        this.goNextStep = () => {
            this.currentStep(this.currentStep() + 1);
        };

        /**
         * Takes the user to the specified step
         * @param {number} step Step number
         */
        this.goToStep = (step) => {
            this.currentStep(step);
        };

        /**
         * Takes the user to the summary.
         * Will enable review mode too.
         */
        this.goToSummary = () => {
            this.currentStep(SUMMARY_STEP);
            // Reached the summary, all steps done so enters review mode
            this.isAtReview(true);
        };

         /**
         * Takes the user to the next step in the form.
         * @member {KnockoutComputed<string>}
         */
        this.stepButtonLabel = ko.pureComputed(() => {
            if (this.isAtReview()) {
                return 'Save';
            }
            else {
                return 'Save and Continue';
            }
        });

        /**
         * Takes the user to the next step in the form (in standard mode),
         * or to the summary (when in review mode).
         * @member {KnockoutComputed<number>}
         */
        this.saveStep = () => {
            if (this.isAtReview()) {
                this.currentStep(SUMMARY_STEP);
            }
            else {
                this.goNextStep();
            }
        };
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
         * When a deletion request it's on the works
         * @member {KnockoutObservable<boolean>}
         */
        this.isDeleting = ko.observable(false);

        /**
         * When a 'close' request it's on the works
         * @member {KnockoutObservable<boolean>}
         */
        this.isClosing = ko.observable(false);

        /**
         * When edition must be locked because of in progress
         * operations.
         * @member {KnockoutComputed<boolean>}
         */
        this.isLocked = ko.pureComputed(() => this.isSaving() || this.isLoading() || this.isDeleting() || this.isClosing());

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
    __connectData() {
        /**
         * We create an item manager to operate on the data for the requested ID
         * (allows to load, save, delete).
         */
        this.dataManager = userPosting(this.data.userPostingID());

        // When we have an ID, we need to load it first
        if (this.data.userPostingID()) {

            this.isLoading(true);

            this.dataManager.onceLoaded()
            .then((data) => {
                if (!data) {
                    throw 'Posting not found';
                }
                if (this.editorMode() === EditorMode.copy) {
                    // On copy mode, we need to reset the ID and dataManager
                    // so it forces to create a new entry (otherwise it will
                    // actually update the original one)
                    data.userPostingID = 0;
                    this.dataManager = userPosting(0);
                }
                this.data.model.updateWith(data);
                this.dataTimestamp(this.data.model.dataTimestamp());
                this.isLoading(false);
            })
            .catch((error) => {
                this.isLoading(false);
                showError({
                    title: 'There was an error loading your posting',
                    error
                });
            });
        }

        // Whenever the postingTemplateID changes in the posting (as of loading
        // or as of user picking a solution --has attached a template), the
        // posting template needs to be loaded
        let templateDataSub = null;
        let templateErrorSub = null;
        this.data.postingTemplateID.subscribe((postingTemplateID) => {
            if (templateDataSub) templateDataSub.dispose();
            if (templateErrorSub) templateErrorSub.dispose();

            const dataProvider = postingTemplateItem(postingTemplateID);
            templateDataSub = this.subscribeTo(dataProvider.onData, (d) => {
                this.postingTemplate(d);
            });
            templateErrorSub = this.subscribeTo(dataProvider.onDataError, (error) => {
                showError({
                    title: 'There was an error loading the posting questions',
                    error
                });
            });
        });
    }

    /**
     * Save data in the server
     * @returns {Promise<object>}
     */
    save() {
        if (this.isSaving()) return Promise.reject();

        this.isSaving(true);

        // Prepare data to submit
        const data = this.data.model.toPlainObject(true);
        // Specializations are split in two (every of the two scopes) based
        // on ones with ID and ones without ('proposed user generated'), and
        // the model equivalent property gets removed
        data.neededSpecializationIDs = data.neededSpecializations
        .map((s) => s.specializationID)
        .filter((s) => s > 0);
        data.proposedNeededSpecializations = data.neededSpecializations
        .filter((s) => s.specializationID === 0)
        .map((s) => s.name);
        delete data.neededSpecializations;
        data.desiredSpecializationIDs = data.desiredSpecializations
        .map((s) => s.specializationID)
        .filter((s) => s > 0);
        data.proposedDesiredSpecializations = data.desiredSpecializations
        .filter((s) => s.specializationID === 0)
        .map((s) => s.name);
        delete data.desiredSpecializations;

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
                this.data.model.updateWith(freshData);
                this.dataTimestamp(this.data.model.dataTimestamp());
            }
        })
        .catch((error) => {
            this.isSaving(false);
            showError({
                title: 'There was an error saving your posting',
                error
            });
        });
    }

    /**
     * Delete the entry being edited after confirmation
     * @returns {Promise}
     */
    confirmDelete() {
        if (this.isDeleting()) return Promise.reject();

        this.isDeleting(true);

        return showConfirm({
            title: 'Are you sure?',
            message: `Delete posting "${this.data.title()}".`,
            yes: 'Delete',
            no: 'Keep'
        })
        .then(() =>  this.dataManager.delete())
        .then(() => {
            this.isDeleting(false);
            if (this.onDeleted) {
                // Notify
                this.onDeleted();
            }
            else {
                // Reset to new item
                this.data.model.reset();
                this.editorMode(EditorMode.add);
            }
        })
        .catch((error) => {
            this.isDeleting(false);
            if (error) {
                showError({
                    title: 'There was an error deleting your posting',
                    error
                });
            }
        });
    }

    /**
     * Close the position being edited after confirmation
     * @returns {Promise}
     */
    confirmClose() {
        if (this.isClosing()) return Promise.reject();

        this.isClosing(true);

        return showConfirm({
            title: 'Are you sure?',
            message: `Close posting "${this.data.title()}".`,
            yes: 'Close posting',
            no: 'Keep active'
        })
        .then(() =>  this.dataManager.close())
        .then((freshData) => {
            this.isClosing(false);
            // Use updated/created data
            this.data.model.updateWith(freshData);
        })
        .catch((error) => {
            this.isClosing(false);
            if (error) {
                showError({
                    title: 'There was an error closing your posting',
                    error
                });
            }
        });
    }

    /**
     * Pick a solution from the autocomplete.
     * @param {string} text Suggested text
     * @param {rest/Solution} solution Suggested Solution object
     */
    pickSolution(text, solution) {
        this.data.solutionID(solution.solutionID);
        this.data.solutionName(solution.name);
        this.data.postingTemplateID(solution.postingTemplateID);
        this.saveStep();
        return {
            value: ActionForValue.copy
        };
    }

    /**
     * Pick a specialization from the autocomplete, for the scope of 'needed'.
     * @param {string} text
     * @param {rest/Specialization} specialization
     */
    pickNeededSpecialization(text, specialization) {
        if (!findSpecializationIn(this.data.neededSpecializations(), specialization)) {
            this.data.neededSpecializations.push(specialization);
            return {
                value: ActionForValue.clear
            };
        }
        else {
            return {
                value: ActionForValue.keepUserInput
            };
        }
    }

    /**
     * Pick a specialization from the autocomplete, for the scope of 'desired'.
     * @param {string} text
     * @param {rest/Specialization} specialization
     */
    pickDesiredSpecialization(text, specialization) {
        if (!findSpecializationIn(this.data.desiredSpecializations(), specialization)) {
            this.data.desiredSpecializations.push(specialization);
            return {
                value: ActionForValue.clear
            };
        }
        else {
            return {
                value: ActionForValue.keepUserInput
            };
        }
    }

    /**
     * Removes the given specialization from the list
     * @param {rest/Specialization} specialization
     */
    removeNeededSpecialization(specialization) {
        this.data.neededSpecializations.remove(specialization);
    }

    /**
     * Removes the given specialization from the list
     * @param {rest/Specialization} specialization
     */
    removeDesiredSpecialization(specialization) {
        this.data.desiredSpecializations.remove(specialization);
    }
}

ko.components.register(TAG_NAME, PostingEditor);

/**
 * General utility, to find a specialization by matching ID or name in a listg
 * @param {Array<KnockoutObservable<rest/Specialization>>} list
 * @param {rest/Specialization} specialization
 * @returns {rest/Specialization} Or null if not found
 */
function findSpecializationIn(list, specialization) {
    return list.find((s) => ko.unwrap(s.specializationID) === specialization.specializationID || ko.unwrap(s.name) === specialization.name );
}
