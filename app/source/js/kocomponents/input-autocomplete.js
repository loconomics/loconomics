/**
 * An input with accessible autocomplete feature
 * @module kocomponents/input-autocomplete
 */
'use strict';

var TAG_NAME = 'input-autocomplete';
var TEMPLATE = require('../../html/kocomponents/input-autocomplete.html');
var CSS_CLASS = 'InputAutocomplete';
//require-styl '../../css/components/InputAutocomplete.styl'
var RESULT_ELEMENT_NAME = 'input-autocomplete-result';
var RESULT_ELEMENT_NAME_SELECTOR = '[is=' + RESULT_ELEMENT_NAME + ']';

var ko = require('knockout');
var getObservable = require('../utils/getObservable');

/**
 * @typedef {Object} ResultsBase Base class or interface that externally
 * provided results object must meet.
 * @member {(number|KnockoutObservable<number>)} length Number of elements
 */

/**
 * The component view model
 * @class
 * @param {Object} params
 * @param {KnockoutObservable<string>} params.id
 * @param {KnockoutObservable<string>} params.name
 * @param {KnockoutObservable<string>} params.icon
 * @param {KnockoutObservable<string>} [params.placeholder]
 * @param {KnockoutObservable<string>} params.value It holds the user typed
 * text at the input element 'realtime'.
 * @param {KnockoutObservable<ResultsBase>} params.results
 * @param {KnockoutObservable<boolean>} params.isBusy Let's know the state of
 * the external load of results data (search/filtering)
 * @param {Object} refs Set of references to generated elements meant to be
 * provided internally by the creator of the component.
 * @param {HTMLElement} refs.root Reference to the component instance element,
 * the root of any other elements inside it.
 * @param {Object} children Set of named children giving externally and
 * filtered by the creator of the component.
 * @param {HTMLElement} children.isBusyTemplate Element used as template for the
 * item that notifies the isBusy state.
 * @param {HTMLElement} children.resultsTemplate Element used as template for the
 * results object.
 */
function ViewModel(params, refs, children) {
    /// Members from input params
    /**
     * @member {KnockoutObservable<string>} id
     */
    this.id = getObservable(params.id);
    /**
     * @member {KnockoutObservable<name>} name
     */
    this.name = getObservable(params.name);
    /**
     * @member {KnockoutObservable<string>} icon
     */
    this.icon = getObservable(params.icon);
    /**
     * @member {KnockoutObservable<string>} [placeholder]
     */
    this.placeholder = getObservable(params.placeholder);
    /**
     * @member {KnockoutObservable<string>} value
     */
    this.value = getObservable(params.value);
    /**
     * @member {KnockoutObservable<ResultsBase>} results
     */
    this.results = getObservable(params.results);
    /**
     * @member {KnockoutObservable<boolean>} isBusy
     */
    this.isBusy = getObservable(params.isBusy);

    /// Internal members
    /**
     * @member {KnockoutObservable<string>} notificationText Provides text
     * for assistive technologies, through an aria-live region, to notify
     * interactive changes.
     */
    this.notificationText = ko.observable('');
    /**
     * @member {KnockoutObservable<HTMLElement>} activeResultElement Holds the
     * element that represents an input-autocomplete-result and is
     * currently active (highlighted) with keyboard.
     * Used for accessibility and styling, at the element and at the input.
     */
    this.activeResultElement = ko.observable(null);

    /// Computed properties
    /**
     * @member {KnockoutComputed<boolean>} isExpanded Let's know if the
     * results panel must be expanded (AKA opened).
     */
    this.isExpanded = ko.pureComputed(function() {
        return this.isBusy() || ko.unwrap(this.results().length);
    }, this);
    /**
     * @member {KnockoutComputed<string>} panelID Generated identifier for the
     * panel element, required to create a relationship between elements
     * and state.
     */
    this.panelID = ko.pureComputed(function() {
        return this.id() + '-input-autocomplete-panel';
    }, this);
    /**
     * @member {KnockoutComputed} activeResult Holds the value/object of
     * the result item currently active
     */
    this.activeResult = ko.pureComputed(function() {
        var el = this.activeResultElement();
        return el ? ko.dataFor(el) : null;
    }, this);
    /**
     * @member {KnockoutObservable<string>} activeResultID Holds the string ID of
     * the result item currently active.
     */
    this.activeResultID = ko.pureComputed(function() {
        var el = this.activeResultElement();
        var id = el ? el.getAttribute('id') : null;
        if (el && !id) {
            console.error('input-autocomplete: an active result element has not a required ID attribute value', el);
        }
        return id;
    }, this);

    /// Children / Elements injected
    /**
     * @member {HTMLElement} children.isBusyTemplate
     */
    this.isBusyTemplate = children.isBusyTemplate;
    /**
     * @member {HTMLElement} children.resultsTemplate
     */
    this.resultsTemplate = children.resultsTemplate;

    /// Management of active result element (mainly for accessibility)
    var activeResultManager = {
        /**
         * Reference to the viewModel observable that keeps track of which
         * DOM element is now the active one.
         * This is updated and accessed by the manager methods.
         * @member {KnockoutObservable<HTMLElement>}
         */
        activeResultElement: this.activeResultElement,
        /**
         * Remove any attribute or state from the given element that could
         * previously being the active result.
         * Does NOT touch the observable (a call to 'set' with a new element
         * must be performed)
         * @param {HTMLElement} element
         */
        unset: function(element) {
            // replaced 'element instanceof HTMLElement' because of unknow support
            if (element && element.removeAttribute) {
                element.removeAttribute('aria-selected');
            }
        },
        /**
         * Set the given element as the active result element, adding any
         * attribute or state to it.
         * @param {HTMLElement} element
         */
        set: function(element) {
            this.unset(this.activeResultElement());
            // replaced 'element instanceof HTMLElement' because of unknow support
            if (element && element.setAttribute) {
                element.setAttribute('aria-selected', 'true');
            }
            this.activeResultElement(element || null);
        },
        /**
         * Given and index and total of elements, returns the index if is in
         * the boundaries or makes a circular movement when out (when before
         * first returns last, after last returns first).
         * @private
         * @param {number} index The proposed index that need to be checked
         * or fixed
         * @param {number} total Number of elements. The index goes between
         * zero and (total - 1).
         * @returns {number} A correct index.
         */
        fixIndex: function(index, total) {
            if (index < 0) {
                return total - 1;
            }
            else if (index >= total) {
                return 0;
            }
            else {
                return index;
            }
        },
        /**
         * Changes the active result by changing the index of the current one
         * by a given offset.
         * A couple of constants are provided representing the needed offset
         * to move to next or previous element.
         * @param {number} offset Amount of positions from current index to shift
         * the current active result. 1 to select next, -1 for previous.
         */
        shiftTo: function(offset) {
            var el = this.activeResultElement();
            var results = refs.root.querySelectorAll(RESULT_ELEMENT_NAME_SELECTOR);
            // Make it an array
            results = Array.prototype.slice.call(results);
            // If has value and is a valid one
            //var isValidElement = el && el.tagName === RESULT_ELEMENT_NAME;
            var isValidElement = el && el.getAttribute && el.getAttribute('is') === RESULT_ELEMENT_NAME;
            if (isValidElement) {
                // Look for the current index
                var activeIndex = results.indexOf(el);
                // Go
                var newIndex = this.fixIndex(activeIndex + offset, results.length);
                var newEl = results[newIndex];
                this.set(newEl);
            }
            else {
                // Select the first one
                this.set(results[0]);
            }
        },
        SHIFT_TO_NEXT: 1,
        SHIFT_TO_PREVIOUS: -1,
        /**
         * Makes that no element is registered as active at the moment.
         */
        clear: function() {
            this.unset(this.activeResultElement());
            this.activeResultElement(null);
        }
    };

    /// Events
    var KEY_ENTER = 13;
    var KEY_UP = 38;
    var KEY_DOWN = 40;
    /**
     * Detects standard key press for 'display autocomplete' and force to
     * expand the list of available options, if any.
     * Standard autocompletes collapse on focus out, and at focus in the list
     * can be manually expanded. Alternatives are to keep it expanded or
     * auto-expand when getting focus again.
     * @param {Event} e Keypress event
     * @private
     */
    /*
    var KEY_SPACE = 32;
    var pressExpand = function(e) {
        // Press Ctrl+Alt+Space: Show up the autocomplete list
        if (e.ctrlKey && e.altKey && e.which === KEY_SPACE) {
            // TODO Force to show up the autocomplete, if there are items
        }
    };*/
    /**
     * Detects standard key press for 'move/active next item (from the
     * autocomplete suggestions list)'.
     * @param {Event} e Keypress event
     */
    var pressNext = function(e) {
        if (e.which === KEY_DOWN) {
            activeResultManager.shiftTo(activeResultManager.SHIFT_TO_NEXT);
            // managed
            return true;
        }
    };
    /**
     * Detects standard key press for 'move/active previous item (from the
     * autocomplete suggestions list)'.
     * @param {Event} e Keypress event
     */
    var pressPrevious = function(e) {
        if (e.which === KEY_UP) {
            activeResultManager.shiftTo(activeResultManager.SHIFT_TO_PREVIOUS);
            // managed
            return true;
        }
    };
    /**
     * Detects standard key press for 'select element as input value (from the
     * autocomplete suggestions list)'.
     * Do not confuse this with the 'active item' that is just an item
     * hightlighed from the list when navigating with the keyboard, but is not
     * copied as the input value when active.
     * @param {Event} e Keypress event
     */
    var pressSelect = function(e) {
        if (e.which === KEY_ENTER) {
            var active = activeResultManager.activeResultElement();
            if (active) {
                // Copy the text/value of the active item
                var textValue = active.innerText;
                // Put it as the new input value
                this.value(textValue);
                // Remove as active element
                activeResultManager.clear();
            }
            // TODO Close list
            // managed
            return true;
        }
    }.bind(this);
    this.onKeyPress = function(data, e) {
        e = e.originalEvent || e;
        if (pressSelect(e)) return;
        // TODO press ESC to close list
        // Allow default behavior, or will get blocked by Knockout:
        return true;
    };
    this.onKeyDown = function(data, e) {
        e = e.originalEvent || e;
        //if (pressExpand(e)) return;
        if (pressNext(e)) return;
        if (pressPrevious(e)) return;
        // Allow default behavior, or will get blocked by Knockout:
        return true;
    };
}

/**
 * Factory for the component view model instances that has access
 * to the component instance DOM elements.
 * @param {object} params Component parameters to pass it to ViewModel
 * @param {object} componentInfo Instance DOM elements
 * @param {HTMLElement} componentInfo.element the component element
 * @param {Array<HTMLElement>} componentInfo.templateNodes elements passed in
 * to the component by place them as children.
 * Allowed children:
 * <template name="isBusy">..</template>
 * <template name="results">..</template>
 */
var create = function(params, componentInfo) {
    // We set the class name directly in the component
    componentInfo.element.classList.add(CSS_CLASS);
    // Get the provided template for the results and state
    var isBusyTemplate;
    var resultsTemplate;
    componentInfo.templateNodes.forEach(function(node) {
        var slot = node.getAttribute && node.getAttribute('name');
        switch (slot) {
            case 'isBusy':
                isBusyTemplate = node.content || node;
                break;
            case 'results':
                resultsTemplate = node.content || node;
                break;
        }
    });
    var refs = {
        root: componentInfo.element
    };
    var children = {
        isBusyTemplate: isBusyTemplate,
        resultsTemplate: resultsTemplate
    };
    return new ViewModel(params, refs, children);
};

ko.components.register(TAG_NAME, {
    template: TEMPLATE,
    viewModel: { createViewModel: create },
    synchronous: true
});
