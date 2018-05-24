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

        /**
         * Represents a new set of responses (empty)
         */
        const createResponsesNew = () => ko.observableArray();
        /**
         * Represents a set of saved responses, with just one
         */
        const createResponsesSingle = () => ko.observableArray([new QuestionResponse({
            // Predefined option ID, if not free-input
            optionID: 5,
            // Predefined option label, if one choosen
            option: 'Other:',
            // User input, if allowed by the option
            userInput: 'My input'
        })]);
        // Some question generators for testing several possibilities
        const questionA = (id) => ({
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
            }]
        });
        const questionB = (id) => ({
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
            }]
        });
        const questionC = (id) => ({
            questionID: id,
            questionTypeID: 17,
            question: 'What\'s your deadline?',
            options: [{
                inputType: 'date'
            }]
        });
        const questionD = (id) => ({
            questionID: id,
            questionTypeID: 17,
            question: 'Give your posting a title',
            options: [{
                inputType: 'text'
            }]
        });
        const questionE = (id) => ({
            questionID: id,
            questionTypeID: 17,
            question: 'What\'s your estimated budget?',
            options: [{
                inputType: 'number',
                icon: 'ios-cash',
                step: 0.01
            }]
        });

        // Several combinations of questions, each with no responses and with
        // previously saved responses. All IDs must be unique, or problems
        // may arise on some types (because of IDs generated)
        this.questionsSet = [{
            question: questionA(101),
            responses: createResponsesNew()
        }, {
            question: questionA(102),
            responses: createResponsesSingle()
        }, {
            question: questionB(201),
            responses: createResponsesNew()
        }, {
            question: questionB(202),
            responses: createResponsesSingle()
        }, {
            question: questionC(301),
            responses: createResponsesNew()
        }, {
            question: questionC(302),
            responses: ko.observableArray([new QuestionResponse({
                userInput: new Date(2018, 1, 2).toISOString().substr(0, 10)
            })])
        }, {
            question: questionD(401),
            responses: createResponsesNew()
        }, {
            question: questionD(402),
            responses: ko.observableArray([new QuestionResponse({
                userInput: 'A title'
            })])
        }, {
            question: questionE(501),
            responses: createResponsesNew()
        }, {
            question: questionE(502),
            responses: ko.observableArray([new QuestionResponse({
                userInput: 320.30
            })])
        }];
    }
}

activities.register(ROUTE_NAME, _TestPostingQuestionsActivity);
