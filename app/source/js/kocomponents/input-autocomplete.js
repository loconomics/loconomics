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
 */
function ViewModel(params) {
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
}

/**
 * Factory for the component view model instances that has access
 * to the component instance DOM elements.
 * @param {object} params Component parameters to pass it to ViewModel
 * @param {object} componentInfo Instance DOM elements
 * @param {DOMElement} componentInfo.element
 */
var create = function(params, componentInfo) {
    // We set the class name directly in the component
    componentInfo.element.classList.add(CSS_CLASS);
    return new ViewModel(params);
};

ko.components.register(TAG_NAME, {
    template: TEMPLATE,
    viewModel: { createViewModel: create },
    synchronous: true
});
