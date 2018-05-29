/**
 * Represents a posting question and his response, added by the user
 * author of the posting.
 * Even if is 'a response', it actually contains a set of responses, depending
 * on the question just one or more than one are allowed.
 * It includes a copy of the description of the question and the
 * specific posting question set-up (legend an branchLogic); this is get from
 * the posting template at the moment of create the posting and keep
 * immutable (later template changes are not reflected, user only is allowed
 * alter responses).
 *
 * The source plain types Question and PostingTemplateQuestion definitions are
 * included at the bottom of this file as informative. This model is a bit
 * like a merge of that both types plus a responses list.
 */

import Model from './Model';
import QuestionOption from './QuestionOption';
import QuestionResponse from './QuestionResponse';
import moment from 'moment';

export default class UserPostingQuestionResponse {
    constructor(values) {
        Model(this);

        this.model.defProperties({
            userPostingID: 0,
            questionID: 0,
            questionTypeID: 0,
            question: '',
            helpBlock: null,
            options: {
                isArray: true,
                Model: QuestionOption
            },
            responses: {
                isArray: true,
                Model: QuestionResponse
            },
            legend: '',
            /**
             * Optional dictionary relating the selection of an optionID (key)
             * to another questionID (value) that must be the next step if that
             * option (from current question) was choosen
             * @member {KnockoutObservable<object>}
             */
            branchLogic: null
        }, values);
    }

    /**
     * Formats the given response as part of current question for users.
     * This involves custom logic on case of special option inputType
     * and display of the preselected 'option' caption and/or userInput in the
     * response.
     * @param {QuestionResponse} response
     */
    displayResponse(response) {
        const optionLabel = response.option();
        let userInput = response.userInput();
        const optionDef = this.options().find((opt) => opt.optionID() === response.optionID());

        if (optionDef) {
            switch (optionDef.inputType()) {
                case 'date':
                    userInput = moment(userInput).format('LL');
                    break;
                case 'datetime':
                    userInput = moment(userInput).format('LL LT');
                    break;
                case 'time':
                    userInput = moment(userInput).format('LT');
                    break;
            }
        }
        return [optionLabel, ':', userInput].join('').replace(/^:|:$/, '');
    }
}

/**
 * @enum {number}
 */
// export const QuestionType = {
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
 * Relates a question with a posting template, including specific information
 * about how is grouped ('legend') and relates with other questions ('branchLogic')
 * @typedef {Object} rest.PostingTemplateQuestion
 * @property {number} postingTemplateID
 * @property {number} questionID
 * @property {string} legend
 * @property {Object} branchLogic
 * @property {Date} createdDate
 * @property {Date} updatedDate
 * @property {string} modifiedBy
 */
