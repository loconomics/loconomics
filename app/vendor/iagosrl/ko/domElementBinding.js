/**
    Knockout Binding that allow inject an in memory created DOM Element
**/
'use strict';

var ko = require('knockout');
var $ = require('jquery');

exports.domElementBinding = {
    update: function(element, valueAccessor, allBindings) {

        var domElement = ko.unwrap(valueAccessor());
        $(element).empty().append(domElement);
    }
};