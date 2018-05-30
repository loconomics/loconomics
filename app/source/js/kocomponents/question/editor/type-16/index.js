/**
 * Specialized question editor for QuestionTypeID:16 'date/time'
 * It uses a custom UI, the same on any engine/browser; the native date picker
 * can be used with questionTypeID:17 and setting inputType:date/datetime-local,
 * but be aware that will degrade to plain text input on unsupported engines
 * and user experience varies on each engine.
 * Only supports 'date' without 'time'.
 *
 * @module kocomponents/question/editor/type-16
 */
import '../../../input/date';
import KnockoutComponent from '../../../helpers/KnockoutComponent';
import QuestionResponse from '../../../../models/QuestionResponse';
import ko from 'knockout';
import moment from 'moment';
import template from './template.html';

const TAG_NAME = 'question-editor-type-16';

/**
 * Component
 */
export default class QuestionEditorType16 extends KnockoutComponent {

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
         * @member {rest.QuestionOption}
         */
        this.option = this.question.options()[0] || {
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
            if (this.question.responses().length === 1) {
                this.question.responses()[0].userInput(data);
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
            if (raw && !(raw instanceof Date)) {
                raw = moment(raw).toDate();
            }
            userInput(raw);
        }

        /**
         * Data introduced by the user
         * @member {KnockoutObservable<any>}
         */
        this.userInput = userInput;

        /**
         * Provides a unique identifier for the question element, that can be
         * used as a ID or a form name for the set of responses
         * @readonly
         * @property {string}
         */
        this.questionElementID = `question-editor-q-${this.question.questionID()}`;
    }
}

ko.components.register(TAG_NAME, QuestionEditorType16);
