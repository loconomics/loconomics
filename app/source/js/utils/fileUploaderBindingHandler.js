/**
    Bootknock: Set of Knockout Binding Helpers for fileupload jquery plugin with image preview

    Dependencies: jquery, fileupload-image
    Injected dependencies: knockout

    NOTE: DO NOT SUPPORT updates on option values, NO observables as options
    NOTE: NO observables for eventHandlers, just functions with object keys being the event name to observe
    TODO Support for updates, observables as options
    TODO Dispose logic
**/
'use strict';

// Dependencies
var $ = require('jquery');
require('jquery.fileupload-image');
var INPUT_SELECTOR = 'input[type=file]';

exports.plugIn = function plugIn(ko) {
    ko.bindingHandlers.fileUploader = {
        init: function (element, valueAccessor, allBindings, viewModel) {
            var setup = valueAccessor();
            if (!setup) return;
            var opts = ko.unwrap(setup.options);
            if (!opts) return;
            var handlers = ko.unwrap(setup.eventHandlers);
            var $el = $(element);
            // Allow to apply the binding to the input[type=file] element itself
            // or to a container (allowing encapsulation inside template,
            // or even applying same binding to several inputs)
            if (!$el.is(INPUT_SELECTOR)) {
                $el = $el.find(INPUT_SELECTOR);
            }
            $el.fileupload(opts);
            if (handlers) {
                Object.keys(handlers)
                .forEach(function(eventName) {
                    $el.on(eventName, handlers[eventName].bind(viewModel));
                });
            }
        }
    };
};
