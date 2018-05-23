/**
 * QuestionResponse Model
 */

import Model from './Model';

export default class QuestionResponse {
    constructor(values) {
        Model(this);

        this.model.defProperties({
            id: 0,
            text: '',
            value: null,
            icon: null,
            tooltip: null,
            placeholder: null
        }, values);
    }
}
