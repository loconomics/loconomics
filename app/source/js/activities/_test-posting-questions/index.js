/**
 * Testing activity around 'posting questions' components and logic.
 *
 * IMPORTANT: Any activity starting with underscore must not being published.
 */

import '../../kocomponents/question/editor';
import * as activities from '../index';
import Activity from '../../components/Activity';
import QuestionResponse from '../../models/QuestionResponse';
import UserPostingQuestionResponse from '../../models/UserPostingQuestionResponse';
import template from './template.html';

const ROUTE_NAME = '_test-posting-questions';

export default class _TestPostingQuestionsActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);
        this.accessLevel = null;
        this.title = 'Testing Posting Questions';

        // Some question generators for testing several possibilities
        const questionA = (id, responses) => new UserPostingQuestionResponse({
            questionID: id,
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
            }, {
                optionID: 5,
                option: 'Other:',
                inputType: 'text'
            }],
            responses
        });
        const questionB = (id, responses) => new UserPostingQuestionResponse({
            questionID: id,
            questionTypeID: 4,
            question: 'Amount expected?',
            options: [{
                optionID: 1,
                option: '1'
            }, {
                optionID: 2,
                option: '2'
            }, {
                optionID: 3,
                option: '3'
            }, {
                optionID: 3,
                option: 'Specify amount:',
                inputType: 'number'
            }],
            responses
        });
        const questionC = (id, responses) => new UserPostingQuestionResponse({
            questionID: id,
            questionTypeID: 17,
            question: 'What\'s your deadline?',
            options: [{
                inputType: 'date'
            }],
            responses
        });
        const questionD = (id, responses) => new UserPostingQuestionResponse({
            questionID: id,
            questionTypeID: 17,
            question: 'Give your posting a title',
            options: [{
                inputType: 'text'
            }],
            responses
        });
        const questionE = (id, responses) => new UserPostingQuestionResponse({
            questionID: id,
            questionTypeID: 17,
            question: 'What\'s your estimated budget?',
            options: [{
                inputType: 'number',
                icon: 'ion-cash',
                step: 0.01
            }],
            responses
        });

        // Several combinations of questions, each with no responses and with
        // previously saved responses. All IDs must be unique, or problems
        // may arise on some types (because of IDs generated)
        this.questionsResponses = [
            questionA(101),
            questionA(102, [new QuestionResponse({
                // Predefined option ID, if not free-input
                optionID: 5,
                // Predefined option label, if one choosen
                option: 'Other:',
                // User input, if allowed by the option
                userInput: 'My input'
            })]),
            questionB(201),
            questionB(202, [new QuestionResponse({
                // Predefined option ID, if not free-input
                optionID: 5,
                // Predefined option label, if one choosen
                option: 'Other:',
                // User input, if allowed by the option
                userInput: 'My input'
            })]),
            questionC(301),
            questionC(302, [new QuestionResponse({
                userInput: new Date(2018, 1, 2).toISOString().substr(0, 10)
            })]),
            questionD(401),
            questionD(402, [new QuestionResponse({
                userInput: 'A title'
            })]),
            questionE(501),
            questionE(502, [new QuestionResponse({
                userInput: 320.30
            })])
        ];
    }
}

activities.register(ROUTE_NAME, _TestPostingQuestionsActivity);
