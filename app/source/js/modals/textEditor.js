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
'use strict';

var ko = require('knockout');
var $ = require('jquery');

exports.show = function showTextEditor(options) {
    //jshint maxcomplexity:10

    var modal = $('#textEditorModal'),
        vm = modal.data('viewmodel');

    if (!vm) {
        vm = new TextEditorModel();

        ko.applyBindings(vm, modal.get(0));
        modal.data('viewmodel', vm);
    }

    options = options || {};

    // Input options and data
    vm.title(options.title || '');
    vm.text(options.text || '');

    return new Promise(function(resolve, reject) {

        // Handlers
        var save = function() {
            resolve(vm.text());
            modal.modal('hide');
        };

        // Just closed without pick anything, rejects
        modal.off('hide.bs.modal');
        // Reject on hide event, but do not pass the event in the
        // first parameter (the error is null, since there is no error).
        modal.on('hide.bs.modal', reject.bind(null, null));
        modal.off('click', '#textEditorModal-save');
        modal.on('click', '#textEditorModal-save', save);

        // NOTE: An autofocus feature existed on 'shown' event, but screen readers
        // didn't manage it well reading additional not useful info
        // (example, NVDA Windows Firefox, reads 'section section section..'
        // before mention the text field).
        // So was removed as of #528

        modal.modal('show');
    });
};

function TextEditorModel() {
    this.title = ko.observable('');
    this.text = ko.observable('');
}
