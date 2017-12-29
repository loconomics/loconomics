/**
    Bootknock: Set of Knockout Binding Helpers for Bootstrap js components (jquery plugins)

    Dependencies: jquery
    Injected dependencies: knockout
**/
'use strict';

// Dependencies
var $ = require('jquery');
// DI i18n library
exports.i18n = null;

function createHelpers(ko) {
    var helpers = {};

    /** Popover Binding **/
    helpers.popover = {
        update: function(element, valueAccessor) {
            var srcOptions = ko.unwrap(valueAccessor());

            // Duplicating options object to pass to popover without
            // overwrittng source configuration
            var options = $.extend(true, {}, srcOptions);

            // Unwrapping content text
            options.content = ko.unwrap(srcOptions.content);

            // Special default trigger option: we set a behavior
            // we call 'focus-blur' that enables as default on click
            // but when losing focus we close it. Is an accessible and usable
            // approach, recommended
            var useFocusBlur = !options.trigger;

            var $el = $(element);

            // Remove previous event handlers
            $el.off('show.bs.popover');
            $el.off('hide.bs.popover');
            $el.off('blur.bs.popover');

            if (options.content) {

                // Localize:
                options.content =
                    exports.i18n && exports.i18n.t(options.content) ||
                    options.content;

                // To get the new options, we need destroy it first:
                $el.popover('destroy').popover(options);

                // Show up popover if the element has the focus at the momen
                // of initialization
                if ($el.is(':focus')) {
                    $el.popover('show');
                }
                if (useFocusBlur) {
                    // Automatic close on blur behavior
                    // Only using popover('hide') on blur event has a bug:
                    // it doesn't resets an internal switch of the click-trigger
                    // and clicks after don't display the popover but try to
                    // hide it again, requiring a duplicated click to show it.
                    // Then, we trigger 'click' so internal state fixes on blur
                    // but only when is opened to prevent we show it on blur
                    // when previously hidden; there is no state property then
                    // we attach to show and hide events (just when thay start)
                    var toggle = function() {
                        $el.trigger('click');
                    };
                    var toggleOnBlur = function() {
                        $el.on('blur.bs.popover', toggle);
                    };
                    var disableToggleOnBlur = function() {
                        $el.off('blur.bs.popover', toggle);
                    };
                    $el.on('show.bs.popover', toggleOnBlur);
                    $el.on('hide.bs.popover', disableToggleOnBlur);
                }

            } else {
                $el.popover('destroy');
            }
        }
    };

    return helpers;
}

/**
    Plug helpers in the provided Knockout instance
**/
function plugIn(ko, prefix) {
    var name;
    var helpers = createHelpers(ko);

    for(var h in helpers) {
        if (helpers.hasOwnProperty && !helpers.hasOwnProperty(h))
            continue;

        name = prefix ? prefix + h[0].toUpperCase() + h.slice(1) : h;
        ko.bindingHandlers[name] = helpers[h];
    }
}

exports.plugIn = plugIn;
exports.createBindingHelpers = createHelpers;
