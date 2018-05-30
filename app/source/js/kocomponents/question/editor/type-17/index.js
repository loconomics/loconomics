/**
 * Specialized question editor for QuestionTypeID:17 'text'
 * Works as a generic component for any single input where the attribute 'type'
 * is set by the question-option definition.
 * It has special support for the native input[type=date] (ensuring the values
 * are used in the correct format, accepting both Date and string as source
 * value)
 *
 * @module kocomponents/question/editor/type-17
 */
import KnockoutComponent from '../../../helpers/KnockoutComponent';
import QuestionResponse from '../../../../models/QuestionResponse';
import { create as createEditableDate } from '../../../../utils/inputEditableComputedDate';
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'question-editor-type-17';

/**
 * Component
 */
export default class QuestionEditorType17 extends KnockoutComponent {

    static get template() { return template; }

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
         * On this single-input type, there is only one option available,
         * describing the kind of input and optional info.
         * If no options, fallback to 'text' input.
         * @member {rest.QuestionOption}
         */
        this.option = this.question.options()[0] || {
            inputType: 'text',
            placeholder: null,
            tooltip: null,
            icon: null,
            step: null
        };

        /**
         * Data introduced by the user
         * @private {KnockoutObservable<any>}
         */
        const userInput = ko.observable();

        /**
         * When changes in the user input, the current response must be
         * updated with that
         */
        userInput.subscribe((data) => {
            if (this.question.responses().length === 1) {
                this.question.responses()[0].userInput(data);
                // Workaround: notice the owner model that there were changes
                // (in theory, Model.js:256-275 tried this automatically, but fails
                // on this specific path)
                this.question.model.touch();
            }
            else {
                this.question.responses([new QuestionResponse({
                    userInput: data
                })]);
            }
        });

        /**
         * Preselect incoming responses at init, if any
         */
        if (this.question.responses().length > 0) {
            const response = this.question.responses()[0];
            let raw = response.userInput();
            if (this.option.inputType() === 'number' && typeof(raw) === 'string') {
                raw = parseFloat(raw);
            }
            userInput(raw);
        }

        /**
         * Data introduced by the user
         * @member {KnockoutObservable<any>}
         */
        this.userInput = this.option.inputType() === 'date' ?
            createEditableDate(userInput) : userInput;

        /**
         * Provides a unique identifier for the question element, that can be
         * used as a ID or a form name for the set of responses
         * @readonly
         * @property {string}
         */
        this.questionElementID = `question-editor-q-${this.question.questionID()}`;
    }
}

ko.components.register(TAG_NAME, QuestionEditorType17);
