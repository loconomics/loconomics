/**
    Show confirmation modal with two buttons.
    @param options:object {
        title:string Header title text
        message:string Message text
        yes:string Yes button label
        no:string No button label
    }
    @returns Promise. It resolves if button 'yes' pressed
    and reject on button 'no' pressed or modal dismissed/closed.
**/
// TODO jsdocs
'use strict';

var ariaHideElements = require('./utils/ariaHideElements');
var fixFocus = require('./utils/fixFocus');
var TEMPLATE = require('../../html/modals/confirm.html');
var createElement = require('./utils/createElement');
require('../utils/jquery.multiline');

/**
 * Display a modal asking for confirmation to perform a task
 * @param {Object} options
 * @param {string} [options.message=Are you sure?] Descriptive text for the task or question.
 * @param {string} [options.title=Are you sure?] Title of the modal
 * @param {string} [options.yes=Yes] Label for the button answering positively (accepting).
 * @param {string} [options.no=No] Label for the button answering negatively (declining).
 * @returns {Promise} Resolves if accepted, rejects with no error if declined
 */
exports.show = function (options) {
    var modal = createElement(TEMPLATE);
    fixFocus(modal);
    var header = modal.find('#confirmModal-label');
    var body = modal.find('#confirmModal-body');
    var yesBtn = modal.find('#confirmModal-yesBtn');
    var noBtn = modal.find('#confirmModal-noBtn');

    options = options || {};

    // Fallback error message
    var title = header.data('default-text');
    var msg = body.data('default-text');
    var yes = yesBtn.data('default-text');
    var no = noBtn.data('default-text');

    body.multiline(options.message || msg);
    header.text(options.title || title);
    yesBtn.text(options.yes || yes);
    noBtn.text(options.no || no);

    return new Promise(function(resolve, reject) {
        modal.modal('show');
        // Increased accessibility:
        // NOTE: must be reverted BEFORE we fullfill
        var handle = ariaHideElements.keep(modal.get(0));
        yesBtn
        .off('click')
        .one('click', function() {
            resolve();
            modal.modal('hide');
        });
        noBtn
        .off('click')
        .one('click', function() {
            reject();
            modal.modal('hide');
        });
        modal
        .off('hide.bs.modal')
        .one('hide.bs.modal', function() {
            handle.revert();
            reject();
        });
    });
};
