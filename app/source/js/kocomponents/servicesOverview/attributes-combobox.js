/**
 * An input with accessible and customizable combobox feature.
 * It's similar to autocomplete, but it has a concrete list of available
 * options, like a native 'select' element.
 * @module kocomponents/servicesOverview/attributes-combobox
 */
'use strict';

var TAG_NAME = 'servicesoverview-attributes-combobox';
var TEMPLATE = require('../../../html/kocomponents/servicesOverview/attributes-combobox.html');

var ko = require('knockout');
var getObservable = require('../../utils/getObservable');
var ActionForValue = require('../input-autocomplete').ActionForValue;
var ServiceAttribute = require('../../models/ServiceAttribute');

/**
 * @class
 * @param {Object} params
 * @param {(string|KnockoutObservable<string>)} params.id
 * @param {(string|KnockoutObservable<string>)} params.name
 * @param {Object} refs References to DOM elements instances in the component
 * template
 * @param {HTMLElement} refs.root The component element
 */
function ViewModel(params, refs) {
    /// Members from input params
    /**
     * @member {string} id
     */
    this.id = ko.unwrap(params.id);
    /**
     * @member {string} name
     */
    this.name = ko.unwrap(params.name) || this.id;
    /**
     * @member {KnockoutObservable<boolean>} isDisabled
     */
    this.isDisabled = getObservable(params.isDisabled);
    /**
     * @member {KnockoutObservableArray<ServiceAttribute>} availableAttributes
     * Get access to all the attributes that are selectable as suggestions.
     * It let's the external code to filter the list to don't show up already
     * selected values.
     */
    this.availableAttributes = getObservable(params.availableAttributes);
    /**
     * @method onSelectAttribute Event handler for when an attribute from
     * the list of availableAttributes is selected. Includes the ServiceAttribute
     * as unique parameter.
     */
    this.onSelectAttribute = params.onSelectAttribute;
    /**
     * @method onSelectAttributeName Event handler for when an attribute name
     * that doesn't exists as a ServiceAttribute is selected.
     */
    this.onSelectAttributeName = params.onSelectAttributeName;

    /// Members (internal)
    this.value = ko.observable('');
    this.expandedByUser = ko.observable(false);

    /**
     * Gets a reference to the input element
     * @returns {HTMLElement}
     */
    this.getInputElement = function getInputElement() {
        if (getInputElement._cached) return getInputElement._cached;
        getInputElement._cached = refs.root.querySelector('input');
        return getInputElement._cached;
    };

    // Available attributes filtered out by the search text
    var textSearch = require('../../utils/textSearch');
    /**
     * @member {KnockoutComputed<Object>} suggestions Get the list of available
     * suggestions if something was typed or user requested to show all.
     */
    this.suggestions = ko.pureComputed(function() {
        var s = this.value();
        var a = this.availableAttributes();
        var attributes;

        if (!s) {
            // When no query, the result must be all the available attributes
            // BUT ONLY if user choose to expand the list (otherwise, the
            // list will get automatically expanded all the time, impossible to
            // to close)
            var userOpened = this.expandedByUser();
            attributes = userOpened ? a : [];
        }
        else {
            attributes = a.filter(function(att) {
                return textSearch(s, att.name());
            });

            // Append the search text as a selectable option at the beggining of the list
            attributes.unshift(new ServiceAttribute({
                serviceAttributeID: 0,
                name: s
            }));
        }

        return attributes;
    }, this);

    /// Methods
    /**
     * Handler for the autocomplete onSelect event: it selects the attribute
     * in the underlying list, keeping the listbox opened.
     * @param {string} value Suggestion value or user typed value
     * @param {models/ServiceAttribute} attribute Suggested attribute data
     * @returns {kocomponents/input-autocomplete/BehaviorAfterSelect} Specify
     * what standard behavior must be performed on the underlying
     * input-autocomplete
     */
    this.selectAttribute = function(value, attribute) {
        if (attribute && attribute.serviceAttributeID()) {
            this.onSelectAttribute(attribute);
            return {
                value: ActionForValue.keepUserInput,
                keepExpanded: true
            };
        }
        else {
            this.onSelectAttributeName(value);
            return {
                value: ActionForValue.clear,
                keepExpanded: false
            };
        }

    }.bind(this);
    /// (inherit methods)
    this.clearValue = function() {
        this.value('');
        this.expandedByUser(false);
    }.bind(this);

    this.expandAutocomplete = function() {
        this.expandedByUser(true);
        // Move focus to the input, so the list can be showed (is hidden when
        // out of focus)
        this.getInputElement().focus();
    }.bind(this);

    this.collapseAutocomplete = function() {
        this.expandedByUser(false);
    }.bind(this);
}

/**
 * Factory for the component view model instances that has access
 * to the component instance DOM elements.
 * @param {object} params Component parameters to pass it to ViewModel
 * @param {object} componentInfo Instance DOM elements
 * @param {HTMLElement} componentInfo.element the component element
 */
var create = function(params, componentInfo) {
    var refs = {
        root: componentInfo.element
    };
    return new ViewModel(params, refs);
};

ko.components.register(TAG_NAME, {
    template: TEMPLATE,
    synchronous: true,
    viewModel: { createViewModel: create }
});
