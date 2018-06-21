/**
 * Specialized question editor for QuestionTypeID:4 'dropdown'
 *
 * @module kocomponents/question/editor/type-4
 */
import SingleResponseTypeBase from '../SingleResponseTypeBase';
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'question-editor-type-4';

/**
 * Component
 */
export default class QuestionEditorType4 extends SingleResponseTypeBase {
    static get template() { return template; }
}

ko.components.register(TAG_NAME, QuestionEditorType4);
