/**
 * Let's add/edit a posting question response.
 *
 * @module kocomponents/question/editor
 */
import './type-1';
import Komponent from '../../helpers/KnockoutComponent';
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'question-editor';

/**
 * @enum {number}
 */
// const QuestionType = {
//     multipleChoice: 1,
//     checkboxes: 2,
//     imageChoice: 3,
//     dropdown: 4,
//     starRating: 5,
//     matrixRatingScale: 6,
//     fileUpload: 7,
//     slider: 8,
//     matrixDropdownMenus: 9,
//     ranking: 10,
//     netPromoterScore: 11,
//     singleTextbox: 12,
//     multipleTextboxes: 13,
//     commentBox: 14,
//     contactInformation: 15,
//     dateTime: 16,
//     text: 17,
//     image: 18,
//     textABTest: 19,
//     imageABTest: 20,
//     matrixSliders: 21
// };

/**
 * @enum {string}
 */
// const ValueType = {
//     text: 'text',
//     datetime: 'datetime',
//     number: 'number',
//     currency: 'currency'
// };

/**
 * Describes a predefined response for a question or additional details for
 * a 'free input' textbox.
 * When is a predefined response, an 'option' from a list of available responses,
 * must specify almost an id and text properties. The placeholder property is
 * discarded (makes no sense on this case)
 * When is used to describe a 'free input' response only (no other predefined
 * responses are available for the question), properties id and text are
 * discarded (makes no sense on that case)
 * When used to describe an alternative user response out of a set of given options
 * (the 'otherOption'), it must include the id and text even if is displayed
 * along a textbox for free user input, since is firts selected as an option
 * by the user.
 * @typedef {Object} rest.QuestionAvailableResponse
 * @property {number} [id] Unique identifier for the response, from the set of
 * available responses
 * @property {string} [text] Text used to label this response option.
 * @property {any} [value] Default value or value typed by the user when the instance
 * represents an user response
 * @property {string} [icon] Name/classnames of the icon used together the option
 * @property {string} [tooltip] Text displayed as a tooltip when focusing the option
 * @property {string} [placeholder] Text used as placeholder of a free text
 * input option
 */

/**
 * @typedef {Object} rest.Question
 * @property {number} questionID Integer, unique identifier
 * @property {QuestionType} questionTypeID Type of question
 * @property {string} question Concise question text
 * @property {Array<rest.QuestionAvailableResponse>} responses List of available
 * responses for the question (optional, only when the response is limited to this,
 * except if otherOption is defined)
 * @property {rest.QuestionAvailableResponse>} otherOption If user is allowed to
 * specify any other value than the set of available responses, this includes
 * the description for that alternative user response (just the label
 * and ID, user will input free text). Too, this can be defined when no predefined
 * responses are available, just to describe additional attributes of the free
 * input available to the user (like specifing a placeholder, an icon or tooltip)
 * and value must match the valueType
 * @property {string} helpBlock Optional assistive text for users.
 * @property {ValueType} valueType Allowed type for the user response when no
 * choosing a predefined response.
 * @property {number} languageID
 * @property {number} countryID
 * @property {Date} createdDate
 * @property {Date} updatedDate
 * @property {string} modifiedBy
 */

/**
 * Component
 */
export default class QuestionEditor extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {(rest.Question|KnockoutObservable<rest.Question>)} params.question Data describing the
     * question
     * @param {(models/QuestionResponse|KnockoutObservable<models/QuestionResponse>)} [params.response] Data describing the
     * user response for the question, if any
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
         * Whether the UI is a fieldset (a set of available responses is displayed)
         * or not.
         * @member {KnockoutComputed<boolean>}
         */
        this.isFieldset = ko.pureComputed(() => this.question.responses && this.question.responses.length > 0);
    }
}

ko.components.register(TAG_NAME, QuestionEditor);
