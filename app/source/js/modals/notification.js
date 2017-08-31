/**
    Show an information modal to notify the user about something.
    @param options:Object {
        message:string. Informative message.
        title:string Optional. The text to show in the modal's header,
            with fallback to the Modal's default title.
        buttonText:string Optional: The label of the unique (close) button
    }
    @returns Promise. It resolves when the modal is dismissed/closed.
    No formal rejection happens.
**/
// TODO jsdocs
'use strict';

var $ = require('jquery');
var ariaHideElements = require('./utils/ariaHideElements');

exports.show = function (options) {

    var modal = $('#notificationModal');
    var header = modal.find('#notificationModal-label');
    var button = modal.find('#notificationModal-button');
    var body = modal.find('#notificationModal-body');

    options = options || {};

    // Fallback message
    var msg = options.message || body.data('default-text');

    body.multiline(msg);

    header.text(options.title || header.data('default-text'));
    button.text(options.buttonText || button.data('default-text'));

    return new Promise(function(resolve) {
        modal.modal('show');
        // Increased accessibility:
        // NOTE: must be reverted BEFORE we fullfill
        var handle = ariaHideElements.keep(modal.get(0));

        modal
        .off('hide.bs.modal')
        .one('hide.bs.modal', function() {
            handle.revert();
            resolve();
        });
    });
};
