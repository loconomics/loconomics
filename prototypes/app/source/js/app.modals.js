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
        body = modal.find('#errorModal-body');
    
    options = options || {};
    
    var msg = body.data('default-message');

    if (options.error)
        msg = exports.getErrorMessageFrom(options.error);
    else if (options.message)
        msg = options.message;

    body.text(msg);
    
    modal.modal('show');
};
