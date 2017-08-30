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

var $ = require('jquery');
require('../utils/jquery.multiline');

exports.show = function (options) {

    var modal = $('#confirmModal'),
        header = modal.find('#confirmModal-label'),
        body = modal.find('#confirmModal-body'),
        yesBtn = modal.find('#confirmModal-yesBtn'),
        noBtn = modal.find('#confirmModal-noBtn');

    options = options || {};

    // Fallback error message
    var title = header.data('default-text'),
        msg = body.data('default-text'),
        yes = yesBtn.data('default-text'),
        no = noBtn.data('default-text');

    body.multiline(options.message || msg);
    header.text(options.title || title);
    yesBtn.text(options.yes || yes);
    noBtn.text(options.no || no);

    return new Promise(function(resolve, reject) {
        modal.modal('show');
        yesBtn.on('click', function() {
            resolve();
        });
        noBtn.on('click', function() {
            reject();
        });
        modal.on('hide.bs.modal', function() {
            reject();
        });
    });
};
