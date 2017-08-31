/**
    Show an error modal to notify the user.
    @param options:Object {
        message:string DEPRECATED. Optional. Informative error message.
        error:string Optional. Error/Exception/XHR object, used to auto
            generate the error message. It takes precedence over 'message'
            option, discarding an error object/string is passed.
            It replaces 'message' since can do the same and more.
        title:string Optional. The text to show in the modal's header,
            with fallback to the Modal's default title.
    }
    @returns Promise. It resolves when the modal is dismissed/closed.
    No formal rejection happens.
**/
// TODO jsdocs
'use strict';

var $ = require('jquery');
require('../utils/jquery.multiline');
var ariaHideElements = require('./utils/ariaHideElements');
var getErrorMessageFrom = require('./utils/getErrorMessageFrom');

exports.show = function (options) {
    var modal = $('#errorModal');
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
            resolve();
        });
    });
};
