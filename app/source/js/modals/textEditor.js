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
/*global window*/
'use strict';

var ko = require('knockout'),
    $ = require('jquery');

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

        // Autofocus
        modal.one('shown.bs.modal', function() { setTimeout(function() {
            var $text = modal.find('textarea');
            // Inmediate focus to the textarea for better usability
            $text.focus();
            $text.click();
            // IMPORTANT: WORKAROUND: for iOS: on iOS (checked up to 8.3, 2015-05-20), the opening of the virtual keyboard
            // makes a scroll down of the viewport, hiding the text field, header, anything, and only the
            // blank area gets showed. That bad autoscroll can be fixed on this single case with next trick
            // without flickering or bad effects (and alternative, generic approach is do it on the keyboardShow
            // event, but there a flickering happens and may affect cases where there is no need or can be worse
            // if field visibility and actual scroll is not checked):
            window.scrollTo(0, 0);
        }, 100); });
        
        modal.modal('show');
    });
};

function TextEditorModel() {
    this.title = ko.observable('');
    this.text = ko.observable('');
}
