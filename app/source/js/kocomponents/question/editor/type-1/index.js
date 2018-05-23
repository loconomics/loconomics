/**
 * Specialized question editor for QuestionTypeID:1 'multipleChoice'
 *
 * @module kocomponents/question/editor/type-1
 */
import Komponent from '../../../helpers/KnockoutComponent';
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'question-editor-type-1';

/**
 * Component
 */
export default class QuestionEditorType1 extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {(rest.Question|KnockoutObservable<rest.Question>)} params.question Data describing the
     * question
     * @param {(models/QuestionResponse|KnockoutObservable<models/QuestionResponse>)} params.response Object holding
     * the user response for the question
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
        this.response = ko.unwrap(params.response);
        if (!this.response) {
            throw new Error('Response required');
        }

        /**
         * Provides a unique identifier for the question element, that can be
         * used as a ID or a form name for the set of responses
         * @readonly
         * @property {string}
         */
        this.questionElementID = `question-editor-q-${this.question.questionID}`;
    }

    /**
     * Generates an ID for an HTML element representing a question predefined response
     */
    responseElementID(response) {
        return `${this.questionElementID}-r-${response.id}`;
    }
}

ko.components.register(TAG_NAME, QuestionEditorType1);
