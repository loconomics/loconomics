/**
 * It allows to hide from ARIA all page elements except the given modal element;
 * this helps to make it accessible by preventing that some screen readers
 * get confused with any no relevant content and keep focused at the modal.
 *
 * As of [issue #632 comment](https://github.com/loconomics/loconomics/issues/632#issuecomment-324402586).
 * Based on the idea of [ally.maintain.hidden](https://allyjs.io/api/maintain/hidden.html)
 * (no code from there actually; not using the library since does too much
 * from what here we 'know' what exactly we need to do --no mutation observers,
 * prefixed selectors for elements to aria-hide)
 */
'use strict';

var HIDE_ELEMENTS_SELECTOR = 'body > *';

/**
 * Aria hide an element
 * @param {DOMElement} el
 * @private
 */
var hideElement = function(el) {
    el.setAttribute('aria-hidden', 'true');
};

/**
 * Aria show an element
 * @param {DOMElement} el
 */
var showElement = function(el) {
    el.removeAttribute('aria-hidden');
};

/**
 * Traverse all parents or ancestors of an element executing a given callback
 * @param {DOMElement} el Element whose ancestors want to be traversed.
 * @param {Function} cb Callback to execute for every parent and ancestor
 * in the element
 */
var forEachParent = function(el, cb) {
    if (el.parentElement) {
        cb(el.parentElement);
        forEachParent(el.parentElement);
    }
};

/**
 * @type {Object} Revertable
 * @member {Function<void, void>} revert It reverts the action performed
 * by a call to 'keep' at the same element
 */

/**
 * @param {DOMElement} modalElement
 * @returns {Revertable}
 */
exports.keep = function(modalElement) {
    document.querySelectorAll(HIDE_ELEMENTS_SELECTOR)
    .forEach(hideElement);

    showElement(modalElement);
    forEachParent(modalElement, showElement);

    return {
        revert: exports.revert.bind(null, modalElement)
    };
};

/**
 * Reverts a previous 'keep' action by hidden from aria the given modal element
 * and showing up the previously hidden elements.
 * @param {DOMElement} modalElement
 */
exports.revert = function(modalElement) {
    document.querySelectorAll(HIDE_ELEMENTS_SELECTOR)
    .forEach(showElement);

    hideElement(modalElement);
};
