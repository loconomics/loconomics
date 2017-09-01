/**
 * It allows to hide with ARIA all page elements except the given element;
 * this helps to make it accessible by preventing that some screen readers
 * get confused with any no relevant content and keep focused at the given
 * element, like modals/dialogs.
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
    // In case it's root, or detached, there is no siblings
    if (!el.parentElement) return [];
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
        forEachParent(el.parentElement, cb);
    }
};

/**
 * @type {Object} Revertable
 * @member {Function<void, void>} revert It reverts the action performed
 * by a call to 'keep' at the same element
 */

/**
 * @param {DOMElement} element
 * @returns {Revertable}
 */
exports.keep = function(element) {
    exclusivelyShowElement(element);
    forEachParent(element, exclusivelyShowElement);

    return {
        revert: exports.revert.bind(null, element)
    };
};

/**
 * Reverts a previous 'keep' action by hidden from aria the given element
 * and showing up the previously hidden elements.
 * @param {DOMElement} element
 */
exports.revert = function(element) {
    exclusivelyHideElement(element);
    // We don't use exclusivelyHideElement at parents because we need
    // each parent to be visible, not hidden
    forEachParent(element, function(parent) {
        // In theory the parent is already show, but double check
        showElement(parent);
        // ARIA Show again all siblings
        getSiblings(parent).forEach(showElement);
    });
};
