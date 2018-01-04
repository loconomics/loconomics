/**
 * Example of the most basic Knockout component that has just an html template,
 * where the given 'params' becomes the view model.
 * It's useful for very simple things (no params or a few) or to start
 * mocking-up a feature.
 *
 * @module kocomponents/_examples/template-only
 *
 * FIXME: Update this component description
 * FIXME: Document parameters allowed using jsdoc syntax in this initial comment,
 * like:
 * @param {string} [name=World] A name for the greating.
 */
import ko from 'knockout';
import template from './template.html';
// FIXME: If the component uses in the template other components, you need
// to import them from here, like
// import '../another/component';

const TAG_NAME = 'component-example';

ko.components.register(TAG_NAME, {
    template: template
});
