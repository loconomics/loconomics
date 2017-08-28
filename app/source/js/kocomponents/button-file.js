/**
 * An action button inside a smart-nav-bar.
 * @module kocomponents/button-file
 */
'use strict';

var TAG_NAME = 'button-file';
var TEMPLATE = require('../../html/kocomponents/button-file.html');
var CSS_CLASS = 'btn-file';
//require-styl '../../css/utils/btn-file.styl'

var FAKE_FOCUS_CSS_CLASS = 'is-focused';

var ko = require('knockout');
var getObservable = require('../utils/getObservable');

/**
 * @class
 * @param {Object} params
 * @param {KnockoutObservable<string>} [params.id]
 * @param {KnockoutObservable<boolean>} [params.disabled]
 */
function ViewModel(params) {
    /**
     * @member {KnockoutObservable<boolean>} [id]
     */
    this.id = getObservable(params.id);
    /**
     * @member {KnockoutObservable<boolean>} [disabled]
     */
    this.disabled = getObservable(params.disabled);
}

/**
 * Factory for the component view model instances that has access
 * to the component instance DOM elements.
 * @param {object} params Component parameters to pass it to ViewModel
 * @param {object} componentInfo Instance DOM elements
 * @param {DOMElement} componentInfo.element
 */
var create = function(params, componentInfo) {
    var el = componentInfo.element;
    // We set the class name directly in the component
    el.classList.add(CSS_CLASS);
    // Make it focusable (at the template we put the input out of tab order
    // because styles must go to the custom-element)
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    // TRICK 1 and workaround:
    // When gets the focus, set a class that simulates focus and move focus
    // to the real input, and remove on blur at both elements.
    // That is needed to make it available to keyboard users and screen readers
    // because even if keyboard events can be catch at this element the
    // opening of the input cannot be forced (triggering events programatically
    // is blocked by web-engines)
    var input = el.querySelector('input[type=file]');
    el.addEventListener('focus', function() {
        el.classList.add(FAKE_FOCUS_CSS_CLASS);
        input.focus();
        // TRICK 2 and workaround:
        // A keyboard trap is created by this code until this line,
        // that prevents a user move focus back with keyboard (Alt+Tab)
        // because goes from input to el and this auto forward focus to input.
        // That's why we remove 'el' temporarly from tab order and restore
        // after input lost focus (and successfully moved to another element).
        el.removeAttribute('tabindex');
    });
    input.addEventListener('blur', function() {
        el.classList.remove(FAKE_FOCUS_CSS_CLASS);
        // Last step of the trick to prevent a keyboard trap (see TRICK 2 note)
        el.setAttribute('tabindex', '0');
    });

    // Create and return viewModel
    return new ViewModel(params);
};

ko.components.register(TAG_NAME, {
    template: TEMPLATE,
    viewModel: { createViewModel: create }
});
