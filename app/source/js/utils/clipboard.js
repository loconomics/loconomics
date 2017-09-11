/**
    Clipboard utility, does NOT attempts to be a complete clipboard commands implementation,
    just the useful details we need in the project at some point.
    It uses the Cordova clipboard plugin when available.

    IMPORTANT: Browsers require the invocation of clipboard commands from 'a short running user-generated event handler',
    like a button click.

    The functions returns an error text or nothing when succesfull.
**/
'use strict';
var $ = require('jquery');
function copyText(text) {
    var errMsg;
    try {
        // If Cordova Plugin available, use that
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.clipboard) {
            window.cordova.plugins.clipboard.copy(text);
        }
        else {
            // Web standard version: will not work on old Firefox and current Safari (as of 2015-11-26)
            // using setSelectionRange rather than select since seems more compatible (with Safari, but copy does not works
            // there so...maybe for the future I hope :-)
            // IMPORTANT: We need an element with the text and attached to the document DOM, visually hidden to avoid any flicker (if any)
            // but with care to avoid type=hidden or display:none just in case some engines may forbide the copy command on that ones.
            // IMPORTANT: We need a textarea instead of an input to be able to keep copied newlines.
            // IMPORTANT: For usability/accessibility, we must to keep the focus at the element focused when starting this,
            // because the technique move the focus to the temporary element, we need to remember what was focused and re-focus
            // after copy.
            var focusedElement = document.activeElement;
            var $code = $('<textarea style="position:absolute;left:-90999px;z-index:-9000"/>"');
            $code
            .appendTo('body')
            .val(text)
            // Copying
            .select()
            .get(0)
            .setSelectionRange(0, 99999);
            if (!document.execCommand('copy')) {
                errMsg = 'Impossible to copy text.';
            }
            focusedElement.focus();
            $code.remove();
        }
    } catch(err) {
        console.error('clipboard.copyText', err);
        errMsg = 'Impossible to copy text.';
    }
    return errMsg;
}

exports.copy = function(value) {
    if (value === null || typeof(value) === 'undefined')
        return 'Nothing to copy';
    if (typeof(value) === 'number')
        value = value.toString();
    if (typeof(value) === 'string') {
        return copyText(value);
    }
    return 'Cannot copy: ' + typeof(value);
};
