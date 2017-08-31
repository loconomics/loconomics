/**
 * For usability/accessibility, after close a modal the focus must be restored
 * to the element that triggered the modal.
 * This function lets do that for a given jquery modal object.
 */
//global document
'use strict';

/**
 * @param {jQuery} $modal Modal element to fix
 */
module.exports = function($modal) {
    var focusedElement;
    // Do just when starting the 'show' process, because later (at shown) the
    // focused element will be the modal itself
    $modal
    .off('show.bs.modal.fixFocus')
    .one('show.bs.modal.fixFocus', function() {
        // Remember what was focused
        focusedElement = document.activeElement;
    })
    // Do when finished hiding or will not have effect
    .off('hidden.bs.modal.fixFocus')
    .one('hidden.bs.modal.fixFocus', function() {
        // Restore
        if (focusedElement) {
            focusedElement.focus();
            // and forget
            focusedElement = null;
        }
    });
};
