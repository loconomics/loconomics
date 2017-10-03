/**
 * Knockout Binding that puts a reference to the DOM element where is attached
 * into the property or observable given.
 * This way you can do: <h1 data-bind="ref: headerElement"></h1>
 * and the viewmodel property 'headerElement' will have a reference to the
 * element (after initializacion of applyBindings).
 * useful to connect with jQuery plugins or perform any other kind of direct
 * manipulation, usually advanced things or very specialized that doesn't
 * fit in a custom binding.
 * NOTE that a custom, task-specialized, binding or even a component
 * (that can get the element as a children) could be
 * better for organization and reusability, when possible.
 *
 * Init giving a name as:
 * ko.bindingHandlers.ref = require('ko/refBinding').refBinding;
 */
'use strict';

var ko = require('knockout');

exports.refBinding = {
    init: function(element, valueAccessor) {
        var prop = valueAccessor();
        if (ko.isWriteableObservable(prop)) {
            prop(element);
        }
        else {
            prop = element;
        }
    }
};
