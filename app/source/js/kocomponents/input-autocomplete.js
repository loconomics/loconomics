/**
 * An input with accessible autocomplete feature
 * @module kocomponents/input-autocomplete
 */
'use strict';

var TAG_NAME = 'input-autocomplete';
var TEMPLATE = require('../../html/kocomponents/input-autocomplete.html');
var CSS_CLASS = 'InputAutocomplete';
//require-styl '../../css/components/InputAutocomplete.styl'

var ko = require('knockout');
var getObservable = require('../utils/getObservable');

/**
 * @typedef {Object} ResultsBase Base class or interface that externally
 * provided results object must meet.
 * @member {(number|KnockoutObservable<number>)} length Number of elements
 */

/**
 * The component view model
 * @class
 * @param {Object} params
 * @param {KnockoutObservable<string>} params.id
 * @param {KnockoutObservable<string>} params.name
 * @param {KnockoutObservable<string>} params.icon
 * @param {KnockoutObservable<string>} [params.placeholder]
 * @param {KnockoutObservable<string>} params.value It holds the user typed
 * text at the input element 'realtime'.
 * @param {KnockoutObservable<ResultsBase>} params.results
 * @param {KnockoutObservable<boolean>} params.isBusy Let's know the state of
 * the external load of results data (search/filtering)
 * @param {Object} children Set of named children giving externally and
 * filtered by the creator of the component.
 * @param {DOMElement} children.isBusyTemplate Element used as template for the
 * item that notifies the isBusy state.
 * @param {DOMElement} children.resultsTemplate Element used as template for the
 * results object.
 */
function ViewModel(params, children) {
    /// Members from input params
    /**
     * @member {KnockoutObservable<string>} id
     */
    this.id = getObservable(params.id);
    /**
     * @member {KnockoutObservable<name>} name
     */
    this.name = getObservable(params.name);
    /**
     * @member {KnockoutObservable<string>} icon
     */
    this.icon = getObservable(params.icon);
    /**
     * @member {KnockoutObservable<string>} [placeholder]
     */
    this.placeholder = getObservable(params.placeholder);
    /**
     * @member {KnockoutObservable<string>} value
     */
    this.value = getObservable(params.value);
    /**
     * @member {KnockoutObservable<ResultsBase>} results
     */
    this.results = getObservable(params.results);
    /**
     * @member {KnockoutObservable<boolean>} isBusy
     */
    this.isBusy = getObservable(params.isBusy);

    /// Internal members
    /**
     * @member {KnockoutObservable<string>} notificationText Provides text
     * for assistive technologies, through an aria-live region, to notify
     * interactive changes.
     */
    this.notificationText = ko.observable('');

    /// Computed properties
    /**
     * @member {KnockoutComputed<boolean>} isExpanded Let's know if the
     * results panel must be expanded (AKA opened).
     */
    this.isExpanded = ko.pureComputed(function() {
        return this.isBusy() || ko.unwrap(this.results().length);
    }, this);
    /**
     * @member {KnockoutComputed<string>} panelID Generated identifier for the
     * panel element, required to create a relationship between elements
     * and state.
     */
    this.panelID = ko.pureComputed(function() {
        return this.id() + '-input-autocomplete-panel';
    }, this);

    /// Children / Elements injected
    /**
     * @member {DOMElement} children.isBusyTemplate
     */
    this.isBusyTemplate = children.isBusyTemplate;
    /**
     * @member {DOMElement} children.resultsTemplate
     */
    this.resultsTemplate = children.resultsTemplate;
}

/**
 * Factory for the component view model instances that has access
 * to the component instance DOM elements.
 * @param {object} params Component parameters to pass it to ViewModel
 * @param {object} componentInfo Instance DOM elements
 * @param {DOMElement} componentInfo.element the component element
 * @param {Array<DOMElement>} componentInfo.templateNodes elements passed in
 * to the component by place them as children.
 * Allowed children:
 * <div slot="isBusy">..</div>
 * <div slot="results">..</div>
 */
var create = function(params, componentInfo) {
    // We set the class name directly in the component
    componentInfo.element.classList.add(CSS_CLASS);
    // Get the provided template for the results and state
    var isBusyTemplate;
    var resultsTemplate;
    componentInfo.templateNodes.forEach(function(node) {
        var slot = node.getAttribute && node.getAttribute('slot');
        switch (slot) {
            case 'isBusy':
                isBusyTemplate = node;
                break;
            case 'results':
                resultsTemplate = node;
                break;
        }
    });
    var children = {
        isBusyTemplate: isBusyTemplate,
        resultsTemplate: resultsTemplate
    };
    return new ViewModel(params, children);
};

ko.components.register(TAG_NAME, {
    template: TEMPLATE,
    viewModel: { createViewModel: create },
    synchronous: true
});
