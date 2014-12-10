/**
    textEditor activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout');
    
var singleton = null;

exports.init = function initTextEditor($activity, options, app) {
    
    if (singleton === null)
        singleton = new TextEditorActivity($activity, options, app);
    else
        singleton.show(options);
};

function TextEditorActivity($activity, options, app) {

    this.$activity = $activity;
    this.app = app;
    this.$textarea = this.$activity.find('textarea');
    this.textarea = this.$textarea.get(0);

    var dataView = this.dataView = new ViewModel(app);
    ko.applyBindings(dataView, $activity.get(0));
   
    this.show(options);
}

TextEditorActivity.prototype.show = function show(options) {
    
    options = options || {};
    this.dataView.saveInfo = options;

    this.dataView.headerText(options.header);
    this.dataView.text(options.text);
    if (options.rowsNumber)
        this.dataView.rowsNumber(options.rowsNumber);
        
    // Inmediate focus to the textarea for better usability
    this.textarea.focus();
    this.$textarea.click();
};

function ViewModel(app) {

    this.app = app;

    this.headerText = ko.observable('Text');

    // Text to edit
    this.text = ko.observable('');
    
    // Number of rows for the textarea
    this.rowsNumber = ko.observable(2);

    this.cancel = function cancel() {

        app.goBack();

    }.bind(this);
    
    // Holding data passed in from another activity,
    // updated on a save to be returned back
    this.saveInfo = {};
    
    this.save = function save() {

        // Update the info with the new text and pass it back:
        this.saveInfo.text = this.text();
        app.goBack(this.saveInfo);

    }.bind(this);
}
