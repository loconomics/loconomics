/**
    Knockout Binding Helper for the Bootstrap Switch plugin.
    
    Dependencies: jquery, bootstrap, bootstrap-switch
    Injected dependencies: knockout
    
    IMPORTANT NOTES:
    - A console error of type "object has not that property" will happen if specified
        a non existant option in the binding. The error looks strange when using the minified file.
    - The order of options in the binding matters when combining with disabled and readonly
        options: if the element is disabled:true or readonly:true, any attempt to change the
        value will fail silently, so if the same binding update changes disabled to false
        and the state, the 'disabled' change must happens before the 'state' change so both
        are successfully updated. For that, just specify 'disabled' before 'state' in the bindings
        definition.
**/
'use strict';

// Dependencies
var $ = require('jquery');
require('bootstrap');
require('bootstrap-switch');

/**
    Create and plug-in the Binding in the provided Knockout instance
**/
exports.plugIn = function plugIn(ko, prefix) {

    ko.bindingHandlers[prefix ? prefix + 'switch' : 'switch'] = {
        init: function(element, valueAccessor, allBindings) {
            // Create plugin instance
            $(element).bootstrapSwitch();
            
            //console.log('switch init', ko.toJS(valueAccessor()));

            // Updating value on plugin changes
            $(element).on('switchChange.bootstrapSwitch', function (e, state) {
                var v = valueAccessor() || {};
                //console.log('switchChange', ko.toJS(v));
                
                if (ko.isObservable(v.state))
                    v.state(state);
                else
                    v.state = state;
            });
        },
        update: function(element, valueAccessor, allBindings) {
            // Get options to be applied to the plugin instance
            var srcOptions = valueAccessor();
            
            var options = srcOptions || {};

            // Unwrapping every option value, getting a duplicated
            // plain object
            options = ko.toJS(options);
            //console.log('switch update', options);

            var $el = $(element);
            
            // Update every option in the plugin
            Object.keys(options).forEach(function(key) {
                $el.bootstrapSwitch(key, options[key]);
            });
        }
    };
};
