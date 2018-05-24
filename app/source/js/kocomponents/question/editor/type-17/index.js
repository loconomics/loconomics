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
     * @param {(rest.Question|KnockoutObservable<rest.Question>)} params.question Data describing the
     * question, with just one option for this type or nothing for a default
     * simple 'text input'
     * @param {(models/QuestionResponse|KnockoutObservable<models/QuestionResponse>)} params.responses
     * List of user responses to the question, for this type would have just one
     * or empty to create one automatically
     */
    constructor(params) {
        super();

        /**
         * @member {rest.Question}
         */
        this.question = ko.unwrap(params.question);
        if (!this.question) {
            throw new Error('Question required');
        }
        /**
         * @member {models/QuestionResponse}
         */
        this.responses = params.responses;
        if (!this.responses) {
            throw new Error('Responses required');
        }

        /**
         * On this single-input type, there is only one option available,
         * describing the kind of input and optional info.
         * If no options, fallback to 'text' input.
         * @member {rest.QuestionOption}
         */
        this.option = this.question.options && this.question.options[0] || {
            inputType: 'text',
            placeholder: null,
            tooltip: null,
            icon: null
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
            if (this.responses().length === 1) {
                this.responses()[0].userInput(data);
            }
            else {
                this.responses([new QuestionResponse({
                    userInput: data
                })]);
            }
        });

        /**
         * Preselect incoming responses at init, if any
         */
        if (this.responses().length > 0) {
            const response = this.responses()[0];
            let raw = response.userInput();
            if (this.option.inputType === 'number' && typeof(raw) === 'string') {
                raw = parseFloat(raw);
            }
            userInput(raw);
        }

        /**
         * Data introduced by the user
         * @member {KnockoutObservable<any>}
         */
        this.userInput = this.option.inputType === 'date' ?
            createEditableDate(userInput) : userInput;

        /**
         * Provides a unique identifier for the question element, that can be
         * used as a ID or a form name for the set of responses
         * @readonly
         * @property {string}
         */
        this.questionElementID = `question-editor-q-${this.question.questionID}`;
    }
}

ko.components.register(TAG_NAME, QuestionEditorType17);
