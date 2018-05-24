/**
 * Let's add/edit a posting question response.
 *
 * @module kocomponents/question/editor
 */
import './type-1';
import './type-4';
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
 * Describes an option available for a question, that may or not ask for user
 * input of a specific type, and provide helpful optional info like a tooltip,
 * placeholder and icon.
 * If a question only allows for user input, still an option object is provided
 * to describe it, requiring the inputType field and the optionID being not
 * needed.
 * @typedef {Object} rest.QuestionOption
 * @property {number} [optionID] Unique identifier for the option, from the set of
 * all available for a question
 * @property {string} [option] Text used to label this response option.
 * @property {string} [icon] Name/classnames of the icon used together the option
 * @property {string} [tooltip] Text displayed as a tooltip when focusing the option
 * @property {string} [placeholder] Text used as placeholder of a free text
 * input option
 * @property {string} [inputType] Defines the kind of user input expected when
 * choosing this option, or null when no input (when just choosing the option is
 * enough).
 * The values allowed matches the values allowed by the attribute 'type' of
 * the html 'input' element or any other special type supported by the UI
 * (with fallback to input-text) and back-end validations.
 */

/**
 * Describes a response given by a user to a question, that may include user
 * input, a selected option or both.
 * @typedef {Object} rest.QuestionResponse
 * @property {number} [optionID] Unique identifier for the option in the question
 * if one was choosen. On questions with a single option for user input, this
 * property is not required.
 * @property {string} [option] Text used to label the optionID selected (is a
 * copy of the text displayed to the user when answering the question, only
 * needed when there is an optionID).
 * @property {string} [userInput] The input provided by the user, usually in a
 * free text box, but can be other type like number, datetime
 * choosing this option, or null when no input (just choosing the option is enough).
 * The values allowed matches the values allowed by the attribute 'type' of
 * the html 'input' element.
 */

/**
 * Describes a question with one or more options allowing one or more responses.
 * The set of options can contain just one, describing the expected type of
 * user input, or many options where user must choose almost one and any of them
 * can optionally allow user input by describing the type.
 * @typedef {Object} rest.Question
 * @property {number} questionID Integer, unique identifier
 * @property {QuestionType} questionTypeID Type of question
 * @property {string} question Concise question text
 * @property {Array<rest.QuestionOption>} options List of available options
 * to choose as response(s) for the question, that may ask or not for user input
 * per the definition of each one. On question types that just ask for user
 * input, just one option must exists in this list to describe the allowed input
 * and optionally provide other settings (like a placeholder, tooltip or icon).
 * @property {string} helpBlock Optional assistive text for users relative to
 * the question (note that each option has a tooltip property for option specific
 * help text)
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
     * @param {KnockoutObservableArray<models/QuestionResponse>} [params.responses]
     * List of user responses for the question, as an observable to make the updated
     * data available outside
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
         * @member {KnockoutObservableArray<models/QuestionResponse>}
         */
        this.responses = params.responses;
    }
}

ko.components.register(TAG_NAME, QuestionEditor);
