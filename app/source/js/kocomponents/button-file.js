/**
 * A button that triggers an input type=file file picker.
 * It uses a CSS trick to being able to create a fully customizable button
 * while passing user events directly to the input element; must be known
 * that browsers prevent programatic events on this for a security reason.
 * Additionally to the parameters documented at the ViewModel below,
 * the component allows child elements that will be placed as-is inside
 * the button and before the input in DOM order.
 * @module kocomponents/button-file
 *
 * @example Basic usage providing a label
 * <button-file params="id: 'upload-file', disabled: isFormDisabled">
 *     <label for='upload-file'>Choose a file for upload</label>
 * </button-file>
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
 * @param {KnockoutObservable<string>} [params.accept] Value for the 'accept'
 * attribute at the input[type=file]
 * @param {KnockoutObservable<DOMElement>} [params.inputElement] Output
 * parameter; when provided, a reference to the internal input[type=file]
 * will be wrote to it.
 * @param {Object} refs Set of references to generated elements meant to be
 * provided internally by the creator of the component.
 * @param {DOMElement} refs.input Reference to the input[type=file] element.
 */
function ViewModel(params, refs) {
    /**
     * @member {KnockoutObservable<string>} [id]
     */
    this.id = getObservable(params.id);
    /**
     * @member {KnockoutObservable<boolean>} [disabled]
     */
    this.disabled = getObservable(params.disabled);
    /**
     * @member {KnockoutObservable<string>} [accept]
     */
    this.accept = getObservable(params.accept);

    // Write output parameter inputElement
    if (ko.isWriteableObservable(params.inputElement)) {
        params.inputElement(refs.input);
    }
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
    var onInputFocus = function() {
        // TRICK 2 and workaround:
        // A keyboard trap is created by this code until this line,
        // that prevents a user move focus back with keyboard (Alt+Tab)
        // because goes from input to el and this auto forward focus to input.
        // That's why we remove 'el' temporarly from tab order and restore
        // after input lost focus (and successfully moved to another element).
        el.removeAttribute('tabindex');
        // IMPORTANT: do this at the input.focus event rather than at
        // the el.focus handler to prevent edge cases of input not getting
        // the focus even doing input.focus();
    };
    // TRICK 3 and workaround:
    // Get and cache a reference to the input element and set-up it's handlers
    // is just fine usually, but when working in combination with third party
    // scripts like AJAX file-uploaders this may fail because some of them
    // clone the input and remove the original under some actions (like picking
    // a file); because of that, any reference
    // to input here will be to a disposed element and event handlers never call
    // leading to broken state (tabindex and class at element not being reset).
    // Workaround: wrap the set-up in a function and call at focus, if needed;
    // to avoid introduce other bugs, do that only if the input is new.
    var latestInputElement = null;
    var setupInput = function() {
        var input = el.querySelector('input[type=file]');
        input.focus();

        // We need to prevent to attach handlers twice and more if the input
        // is still the same, not new
        if (latestInputElement === input) {
            return;
        }

        input.addEventListener('focus', onInputFocus);
        var onEndFocus = function() {
            el.classList.remove(FAKE_FOCUS_CSS_CLASS);
            // Last step of the trick to prevent a keyboard trap (see TRICK 2 note)
            el.setAttribute('tabindex', '0');
        };
        input.addEventListener('focusout', onEndFocus);
        // TRICK 4: some web engines don't trigger neither focusout or blur
        // at change event, but we need to do the same stuff or state will get
        // broken
        input.addEventListener('change', onEndFocus);
    };
    el.addEventListener('focus', function() {
        el.classList.add(FAKE_FOCUS_CSS_CLASS);
        setupInput();
    });

    // Create and return viewModel
    var originalInput = el.querySelector('input[type=file]');
    return new ViewModel(params, { input: originalInput });
};

ko.components.register(TAG_NAME, {
    template: TEMPLATE,
    viewModel: { createViewModel: create }
});
