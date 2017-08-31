/**
    Shows a textarea field to introduce or change a text, usefull
    for interfaces like Cards where an inline textarea is not wanted.

    @param options:Object {
        title:string Optional. The text to show in the modal's header,
            with fallback to the Modal's default title.
    }
    @returns Promise. It resolves when a button is pressed with the introduced text on 'save'.
    Is rejected when the modal is dismissed/closed, like when pressing 'cancel', 'return' or 'close'.
**/
// TODO jsdocs
'use strict';

var $ = require('jquery');
require('../utils/jquery.multiline');
var ariaHideElements = require('./utils/ariaHideElements');

exports.show = function showAnnouncementModal(options) {
    var modal = $('#announcementModal');
    var primaryBtn = modal.find('#announcementModal-primaryBtn');
    var secondaryBtn = modal.find('#announcementModal-secondaryBtn');
    var body = modal.find('#announcementModal-body');

    options = options || {};

    // Fallback message
    var msg = options.message || body.data('default-text');

    body.multiline(msg);

    primaryBtn.text(options.primaryButtonText || primaryBtn.data('default-text'));
    primaryBtn.attr('href', options.primaryButtonLink || '#');
    secondaryBtn.toggle(!!options.secondaryButtonText);
    secondaryBtn.text(options.secondaryButtonText);
    secondaryBtn.attr('href', options.secondaryButtonLink || '#');

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
