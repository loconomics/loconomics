/**
    textEditor activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout');

exports.init = function initTextEditor($activity) {
    new TextEditorActivity($activity);
};

function TextEditorActivity($activity) {

    this.$activity = $activity;

    var dataView = this.dataView = new ViewModel();
    ko.applyBindings(dataView, $activity.get(0));
    
    // Inmediate focus to the textarea for better usability
    $activity.find('textarea').get(0).focus();
    
    // TODO remove, prototype hack
    var header = getParameterByName('header');
    if (header) {
        dataView.headerText(header);
    }
    var presetText = getParameterByName('text');
    if (presetText) {
        dataView.text(presetText);
    }
}

function ViewModel() {

    this.headerText = ko.observable('Text');

    // Text to edit
    this.text = ko.observable('');
    
    // Number of rows for the textarea
    this.rowsNumber = ko.observable(2);

    this.cancel = function cancel() {
        // TODO
        history.go(-1);
    };
    
    this.save = function save() {
        // TODO
        history.go(-1);
    };
}

// TEMPORARY UTILITY
function getParameterByName(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
        results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}
