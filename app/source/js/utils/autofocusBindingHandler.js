/**
    Binding Handler to automatically set the focus in an element when the
    given obsevable changes to a truly value.

    IMPORTANT: If the value is true before rendering, it will focus the element
    just at the moment the binding is attached, if several elements has this
    binding and true values, the result will be just the latest element being
    focused; usually, is better to keep the value false at the beggining and
    change when a focus wants to be triggered.

    IMPORTANT: In order to trigger the autofocus, the value must change but
    if was already 'true' before and assign 'true' again, nothing is triggered,
    so must take care of reset the flag or use a non boolean value that is
    different on every request (like a timestamp).

    IMPORTANT: To prevent conflicts when used together with if/visible/template/
    component bindings or similar ones, setting the focus is delayed a bit with
    a setTimeout; that way, the element and children
    can finishing being displayed or created before attempt an autofocus, which
    is important for assistive technologies to work properly. The value
    is exported and can be updated in case of bigger time is needed (globally).
**/
'use strict';

// Dependencies
var $ = require('jquery');
var ko = require('knockout');

exports.delayInMiliseconds = 100;

ko.bindingHandlers.autofocus = {
    init: function (element, valueAccessor) {
        // Prepare element
        var $el = $(element);
        if (!$el.is(':input')) {
            // Make it focusable (input types already are, don't need this trick)
            $el.attr('tabindex', '-1');
        }
        // Focus on flag change
        var observableFlag = valueAccessor();
        var timer = null;
        var subscription = ko.computed(function() {
            var isTrue = observableFlag();
            clearTimeout(timer);
            if (isTrue) {
                timer = setTimeout(function() {
                    $el.focus();
                }, exports.delayInMiliseconds);
            }
        });
        // Clean-up when done
        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            subscription.dispose();
            clearTimeout(timer);
        });
    }
};
