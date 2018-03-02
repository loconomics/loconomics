/**
    Binding Handler to assign a method to the event of user pressing the
    'Enter' key.
**/
'use strict';

// Dependencies
var $ = require('jquery');
var ko = require('knockout');

ko.bindingHandlers.pressEnter = {
    init: function (element, valueAccessor, allBindings, viewModel) {
        var callback = valueAccessor();
        $(element).keypress(function (event) {
            var keyCode = (event.which ? event.which : event.keyCode);
            if (keyCode === 13) {
                callback.call(viewModel);
                return false;
            }
            return true;
        });
    }
};
