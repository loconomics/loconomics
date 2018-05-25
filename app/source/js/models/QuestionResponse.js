/**
 * QuestionResponse Model matching the plain rest.QuestionResponse type.
 */

import Model from './Model';

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

export default class QuestionResponse {
    constructor(values) {
        Model(this);

        this.model.defProperties({
            optionID: null,
            option: null,
            userInput: null
        }, values);
    }
}
