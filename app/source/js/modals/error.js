/**
 * Show an error modal to notify the user.
 */
'use strict';

var ariaHideElements = require('./utils/ariaHideElements');
var fixFocus = require('./utils/fixFocus');
var getErrorMessageFrom = require('./utils/getErrorMessageFrom');
var TEMPLATE = require('../../html/modals/error.html');
var createElement = require('./utils/createElement');
require('../utils/jquery.multiline');

/**
 * Display a modal with an error message
 * @param {Object} options
 * @param {(string|Exception|Error|Object)} [options.error='There was an error'] Error message
 * or error object that will be analyzed to extract an error
 * message (@see /utils/getErrorMessageFrom for object patterns supported).
 * @param {string} [options.title='There was an error'] Text for the modal title bar.
 * @returns {Promise<string,any>} It resolves when the modal is closed returning
 * the error text that was displayed (usefull when the message was inferred from
 * a given object and want to be persisted or displayed in an additional way
 * after the modal). It rejects only on internal errors at displaying the
 * modal, errors at set-up throws.
 */
exports.show = function (options) {
    var modal = createElement(TEMPLATE);
    fixFocus(modal);
    var header = modal.find('#errorModal-label');
    var body = modal.find('#errorModal-body');

    options = options || {};

    // Fallback error message
    var msg = body.data('default-text');

    // Error message from given error object, with fallback to default one.
    // DEPRECATED temporarly using the 'message' option.
    msg = getErrorMessageFrom(options.error || options.message, msg);

    body.multiline(msg);

    header.text(options.title || header.data('default-text'));

    return new Promise(function(resolve) {
        modal.modal('show');
        // Increased accessibility:
        // NOTE: must be reverted BEFORE we fullfill
        var handle = ariaHideElements.keep(modal.get(0));

        modal
        .off('hide.bs.modal')
        .on('hide.bs.modal', function() {
            handle.revert();
            resolve(msg);
        });
    });
};
