/**
 * An autocomplete specific to input a job title name.
 * @module kocomponents/job-title-autocomplete
 *
 * TODO Where must be organized? /util, /marketplace, /search, /job-title, ...?
 */
'use strict';

var TAG_NAME = 'job-title-autocomplete';
var TEMPLATE = require('../../html/kocomponents/job-title-autocomplete.html');

var ko = require('knockout');
require('./input-autocomplete');
var MarketplaceSearchVM = require('../viewmodels/MarketplaceSearch');
var getObservable = require('../utils/getObservable');

/**
 * @typedef {Object} BehaviorAfterSelect It defines what standard behavior must
 * be done after an autocomplete.onSelect event, allowing external code to
 * set-up that without touching internals.
 * @property {boolean} clearValue When true, request to clear (set as empty)
 * the autocomplete input value.
 */

/**
 * The component view model
 * @class
 * @param {Object} params
 * @param {KnockoutObservable<string>} params.value It holds the user typed
 * text at the input element 'realtime'.
 * @param {KnockoutObservable<ResultsBase>} params.results
 * @param {KnockoutObservable<boolean>} params.isBusy Let's know the state of
 * the external load of results data (search/filtering)
 * @param {Function<string, object, void>} [params.onSelect] Callback triggered
 * when the user selects a suggestion from the listBox, providing as parameters
 * the text value and the context data of the suggestion. Any provided function
 * will replace the default onSelect handler, that automatically sets the
 * autocomplete value (params.value) as the selected text value; if that
 * behavior is still wanted, must be done by the new callback.
 */
function ViewModel(params) {
    // Observables for parameters and results, and auto-search all comes from:
    // Inherits
    MarketplaceSearchVM.call(this);

    /// Overwritting
    // We replace the internal 'length' that counts how many results there are,
    // by one that returns almost 1 if there is valid query; this allow us
    // to ever show a suggestion to add user typed query even if there are not
    // result, as far as it meets the minimum query lenght (implicit by the
    // the result of the inherit 'queryTerm').
    var internalResultsLength = this.searchResults.length;
    this.searchResults.length = ko.pureComputed(function() {
        var hasQuery = !!this.queryTerm();
        return Math.max(hasQuery ? 1 : 0, internalResultsLength());
    }, this);

    /// Out parameters: allows to expose some internal values externally, but
    /// read-only (changes to internals are copied to externals, but not vice
    /// versa)
    /**
     * Expose the text value of the input (user typed or selected); the output
     * parameter can be a writable observable or just any function (works as a
     * callback/event handler).
     * The handler can return an object to describe what to do with the selected
     * value:
     */
    if (typeof(params.value) === 'function') {
        this.value.subscribe(params.value);
    }

    /**
     * Allows a callback/event handler for when an 'onSelect' event happens
     * at the autocomplete (a suggestion is selected from the list), and
     * can provide options by returning an BehaviorAfterSelect object.
     * It receives as parameters the same values as the autocomplete.onSelect.
     */
    if (typeof(params.onSelect) === 'function') {
        this.onSelect = function (value, data) {
            var behavior = params.onSelect(value, data);
            if (behavior && behavior.clearValue) {
                this.value('');
            }
            else {
                // Default behavior is use selected value
                this.value(value);
            }
        }.bind(this);
    }

    /// Members based on params
    // Configurable per use case, or automatic if empty
    /**
     * @member {(KnockoutObservable<string>|string)}
     * Let's indicate what text will contain each button that appears near
     * a suggestion, as a hint for the user of the action that will trigger
     * when selecting it. The button will be hidden if no text (default).
     * Example use cases are:
     * - 'Add' (meaning: add job title to my profile)
     * - 'Sign up' (meaning: sign up now using this job title)
     */
    this.suggestionButtonText = getObservable(params.suggestionButtonText);
    /**
     * @member {(KnockoutObservable<string>|string)} id An unique ID for the input.
     */
    this.id = getObservable(params.id);
 }

ko.components.register(TAG_NAME, {
    template: TEMPLATE,
    viewModel: ViewModel,
    synchronous: true
});
