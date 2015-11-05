/**
    textEditor activity
**/
//global window
'use strict';

var ko = require('knockout'),
    EventEmitter = require('events').EventEmitter,
    Activity = require('../components/Activity');

var A = Activity.extends(function TextEditorActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = new ViewModel(this.app);
    // Title is empty, since we are in 'go back' mode all the time here
    this.navBar = Activity.createSubsectionNavBar('');
    this.navBar.leftAction().handler(function() {
        this.emit('cancel');
    }.bind(this.viewModel));
    
    // Getting elements
    this.$textarea = this.$activity.find('textarea');
    this.textarea = this.$textarea.get(0);
    
    // Handler for the 'saved' event so the activity
    // returns back to the requester activity giving it
    // the new text
    this.registerHandler({
        target: this.viewModel,
        event: 'saved',
        handler: function() {
            // Update the info with the new text
            this.requestData.text = this.viewModel.text();
            // and pass it back
            this.app.shell.goBack(this.requestData);
        }.bind(this)
    });
    
    // Handler the cancel event
    this.registerHandler({
        target: this.viewModel,
        event: 'cancel',
        handler: function() {
            // return, nothing changed
            this.app.shell.goBack(this.requestData);
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);
    
    // Set navigation title or nothing
    this.navBar.leftAction().text(this.requestData.navTitle || '');
    
    // Field header
    this.viewModel.headerText(this.requestData.header);
    this.viewModel.text(this.requestData.text);
        
    // Inmediate focus to the textarea for better usability
    this.textarea.focus();
    this.$textarea.click();
    // IMPORTANT: WORKAROUND: for iOS: on iOS (checked up to 8.3, 2015-05-20), the opening of the virtual keyboard
    // makes a scroll down of the viewport, hiding the text field, header, anything, and only the
    // blank area gets showed. That bad autoscroll can be fixed on this single case with next trick
    // without flickering or bad effects (and alternative, generic approach is do it on the keyboardShow
    // event, but there a flickering happens and may affect cases where there is no need or can be worse
    // if field visibility and actual scroll is not checked):
    window.scrollTo(0, 0);
};

function ViewModel() {

    this.headerText = ko.observable('Text');

    // Text to edit
    this.text = ko.observable('');

    this.cancel = function cancel() {
        this.emit('cancel');
    };
    
    this.save = function save() {
        this.emit('saved');
    };
}

ViewModel._inherits(EventEmitter);
