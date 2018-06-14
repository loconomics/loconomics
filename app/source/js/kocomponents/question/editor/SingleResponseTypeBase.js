/**
 * Base component class (or 'abstract') to aid building
 * components specific for question types that only allow
 * to select one option as response.
 *
 * Because is a base class, is not registered as a component
 * but inherits from the KnockoutComponent class, has no
 * template, no styles.
 *
 * @module kocomponents/question/editor/SingleResponseTypeBase
 */

import Komponent from '../../helpers/KnockoutComponent';
import QuestionResponse from '../../../models/QuestionResponse';
import ko from 'knockout';

/**
 * Base Component
 */
export default class QuestionEditorSingleResponseTypeBase extends Komponent {

    /**
     * @param {object} params
     * @param {(models/UserPostingQuestionResponse|KnockoutObservable<models/UserPostingQuestionResponse>)} params.data Data describing the
     * question with specific set-up for the posting (based on the posting template)
     * plus the responses stored or just empty when new.
     */
    constructor(params) {
        super();

        /**
         * @member {models/UserPostingQuestionResponse}
         */
        this.question = ko.unwrap(params.data);
        if (!this.question) {
            throw new Error('Question required');
        }

        /**
         * Data introduced by the input when selecting an option that requires
         * that.
         * @member {KnockoutObservable<any>}
         */
        this.userInput = ko.observable();

        /**
         * Option selected by the user
         * @member {KnockoutObservable<rest.QuestionOption}
         */
        this.selectedOption = ko.observable();
        /**
         * When selecting an option, that is set as a response, and the
         * user input is reset (just in case the option does not allow
         * userInput or, having a previous value, doesn't match the kind
         * of input for the new option -user don't expect a previous value
         * to be 'copied' over option, not persisted-)
         */
        this.selectedOption.subscribe((option) => {
            if (!option) {
                this.question.responses([]);
            }
            else {
                this.question.responses([new QuestionResponse({
                    optionID: option.optionID(),
                    option: option.option()
                })]);
                this.userInput(null);
            }
        });
        /**
         * When changes in the user input, the current response must be
         * updated with that
         */
        this.userInput.subscribe((data) => {
            if (this.question.responses().length > 0) {
                this.question.responses()[0].userInput(data);
                // Workaround: notice the owner model that there were changes
                // (in theory, Model.js:256-275 tried this automatically, but fails
                // on this specific path)
                this.question.model.touch();
            }
        });
        /**
         * Preselect incoming responses at init, if any
         */
        if (this.question.responses().length > 0) {
            const response = this.question.responses()[0];
            const option = this.question.options().find((opt) => opt.optionID() === response.optionID());
            this.selectedOption(option);
            this.userInput(option && option.inputType() ? response.userInput() : null);
        }

        /**
         * Provides a unique identifier for the question element, that can be
         * used as a ID or a form name for the set of responses
         * @readonly
         * @property {string}
         */
        this.questionElementID = `question-editor-q-${this.question.questionID()}`;
    }

    /**
     * Generates an ID for an HTML element representing a question option
     */
    optionElementID(option) {
        return `${this.questionElementID}-r-${option.optionID()}`;
    }
}
