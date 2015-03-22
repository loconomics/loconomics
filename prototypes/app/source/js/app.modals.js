/**
    Access to use global App Modals
**/
'use strict';

var $ = require('jquery');

// TODO: Create common logic to extract messages for user from Exceptions, Error objects,
// xhr and server side errors, server validation and bad content errors.
exports.getErrorMessageFrom = function getErrorMessageFrom(err) {
    return err && err.message || err && err.error && err.error.message || typeof(err) === 'string' ? err : JSON.stringify(err);
};

exports.showError = function showErrorModal(options) {
    
    var modal = $('#errorModal'),
        header = modal.find('#errorModal-label'),
        body = modal.find('#errorModal-body');
    
    options = options || {};
    
    var defMsg = body.data('default-text');

    if (options.error)
        msg = exports.getErrorMessageFrom(options.error);
    else if (options.message)
        msg = options.message;

    body.text(msg);

    header.text(options.title || header.data('default-text'));
    
    modal.modal('show');
};
