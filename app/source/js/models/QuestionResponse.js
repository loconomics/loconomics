/**
 * QuestionResponse Model
 */

import Model from './Model';

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
