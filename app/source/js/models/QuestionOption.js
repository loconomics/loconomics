/**
 * QuestionOption Model matching the plain rest.QuestionOption type.
 */

import Model from './Model';

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
 * @property {number} [step] Defines the precision of numbers allowed, when
 * using an inputType of number (matches the attribute of same name in the
 * 'input' element)
 */

export default class QuestionOption {
    constructor(values) {
        Model(this);

        this.model.defProperties({
            optionID: null,
            option: null,
            icon: null,
            tooltip: null,
            placeholder: null,
            inputType: null,
            step: null
        }, values);
    }
}
