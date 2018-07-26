/**
 * Let's add/edit a posting question response.
 *
 * @module kocomponents/question/editor
 */
import './type-1';
import './type-4';
import './type-16';
import './type-17';
import Komponent from '../../helpers/KnockoutComponent';
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'question-editor';

/**
 * Component
 */
export default class QuestionEditor extends Komponent {

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
        this.data = ko.unwrap(params.data);
        if (!this.data) {
            throw new Error('No data provided (question-response');
        }
    }
}

ko.components.register(TAG_NAME, QuestionEditor);
