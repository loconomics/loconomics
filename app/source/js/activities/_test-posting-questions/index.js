/**
 * Testing activity around 'posting questions' components and logic.
 *
 * IMPORTANT: Any activity starting with underscore must not being published.
 */

import '../../kocomponents/question/editor';
import * as activities from '../index';
import Activity from '../../components/Activity';
import QuestionResponse from '../../models/QuestionResponse';
import template from './template.html';

const ROUTE_NAME = '_test-posting-questions';

export default class _TestPostingQuestionsActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);
        this.accessLevel = null;
        this.title = 'Testing Posting Questions';

        this.question = {
            questionID: 1,
            questionTypeID: 1,
            responses: [{
                id: 1,
                text: 'I have designs'
            }, {
                id: 2,
                text: 'I have specifications'
            }, {
                id: 3,
                text: 'I have ideas'
            }, {
                id: 4,
                text: 'I\'m just starting'
            }]
        };
        this.response = new QuestionResponse({
            // Predefined option ID, if not free-input
            id: 2,
            // Predefined option label, if not fee input
            text: 'Option label',
            // User input
            value: 'My input'
        });
    }
}

activities.register(ROUTE_NAME, _TestPostingQuestionsActivity);
