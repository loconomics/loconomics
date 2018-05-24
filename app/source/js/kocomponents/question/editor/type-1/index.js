/**
 * Specialized question editor for QuestionTypeID:1 'multipleChoice'
 *
 * @module kocomponents/question/editor/type-1
 */
import SingleResponseTypeBase from '../SingleResponseTypeBase';
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'question-editor-type-1';

/**
 * Component
 */
export default class QuestionEditorType1 extends SingleResponseTypeBase {
    static get template() { return template; }
}

ko.components.register(TAG_NAME, QuestionEditorType1);
