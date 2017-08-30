/**
 * It allows to hide from ARIA all page elements except the given modal element;
 * this helps to make it accessible by preventing that some screen readers
 * get confused with any no relevant content and keep focused at the modal.
 *
 * As of [issue #632 comment](https://github.com/loconomics/loconomics/issues/632#issuecomment-324402586).
 * Based on the idea of [ally.maintain.hidden](https://allyjs.io/api/maintain/hidden.html)
 * (no code from there actually; not using the library since does too much
 * from what here we 'know' what exactly we need to do --no mutation observers,).
 *
 * The updated approach is: ensure the given element is 'aria visible', its parent
 * and each ancestor, while ensure all sibling are 'aria hidden', and siblings
 * of each ancestor. This ensure that ONLY this element is visible to aria,
 * no need for queries by selectors that may be imprecise, get obsolete or even
 * worse performant.
 */
'use strict';

/**
 * Get the sibling elements of a given element (excluding itself)
 * @param {DOMElement} el
 * @return {Array<DOMElement>}
 */
var getSiblings = function getSiblings(el) {
    var s = el.parentElement.firstElementChild;
    var r = [];
    while (s) {
        if (s !== el) {
            r.push(s);
        }
        s = s.nextElementSibling;
    }
    return r;
};

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
 * Aria show an element and hide its siblings
 * @param {DOMElement} el
 */
var exclusivelyShowElement = function(el) {
    showElement(el);
    getSiblings(el).forEach(hideElement);
};

/**
 * Aria hide an element and show its siblings
 * @param {DOMElement} el
 */
var exclusivelyHideElement = function(el) {
    hideElement(el);
    getSiblings(el).forEach(showElement);
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
    exclusivelyShowElement(modalElement);
    forEachParent(modalElement, exclusivelyShowElement);

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
    exclusivelyHideElement(modalElement);
    forEachParent(modalElement, exclusivelyHideElement);
};
