/**
 * Testing activity around 'posting questions' components and logic.
 *
 * IMPORTANT: Any activity starting with underscore must not being published.
 */

import '../../kocomponents/question/editor';
import * as activities from '../index';
import Activity from '../../components/Activity';
import QuestionResponse from '../../models/QuestionResponse';
import ko from 'knockout';
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
            question: 'Where are you in the lifecycle of the project?',
            options: [{
                optionID: 1,
                option: 'I have designs'
            }, {
                optionID: 2,
                option: 'I have specifications'
            }, {
                optionID: 3,
                option: 'I have ideas'
            }, {
                optionID: 4,
                option: 'I\'m just starting'
            }]
        };
        this.responses = ko.observableArray([new QuestionResponse({
            // Predefined option ID, if not free-input
            optionID: 2,
            // Predefined option label, if one choosen
            option: 'I have specifications',
            // User input, if allowed by the option
            userInput: 'My input'
        })]);
    }
}

activities.register(ROUTE_NAME, _TestPostingQuestionsActivity);
