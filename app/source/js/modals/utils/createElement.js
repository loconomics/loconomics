/**
 * Creates the DOM element for a modal given a template, attaching it at the
 * document at proper location and automatically removing after close
 * (this means that any time a modal is to be used/opened, needs to be
 * created this way).
 */
'use strict';
var $ = require('jquery');

/**
 * @param {string} textTemplate HTML as text for the modal, MUST contains a
 * root element with the class 'modal', anything else is discarded
 * @returns {jQuery} Jut the '.modal' element.
 */
module.exports = function(textTemplate) {
    // Create from template
    var $el = $($.parseHTML(textTemplate)).filter('.modal');
    // Attach to document: must go directly in the body, preferred at the end,
    // so is correctly positioned to display on top of anything else.
    $('body').append($el);
    // Auto dispose when modal is done
    $el.one('hidden.bs.modal', function() {
        // NOTE: Maybe use '.detach' rather than remove and use a cached parsed element
        // rather than create it from template all the time?
        // detach keeps events, maybe is even better to remove them as '.remove' does.
        // Just in case, rather than immediately remove we do it on next painting
        requestAnimationFrame(function() {
            $el.remove();
        });
    });
    return $el;
};
