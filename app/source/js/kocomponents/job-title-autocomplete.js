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
var getObservable = require('../utils/getObservable');
exports.ActionForValue = require('./input-autocomplete').ActionForValue;
var JobTitleSearchResult = require('../models/JobTitleSearchResult');
var search = require('../data/search');

/**
 * Minimun text length required to perform a search
 * @type {number}
 */
var MIN_LENGTH = 3;

/**
 * @enum {string} Available targets for the autocomplete, that slightly changes
 * the UI of suggestions to better accomodate well defined use cases.
 */
var Target = {
    /**
     * Search target: suggestions for a client searching professionals by job title
     * It displays specific description text for search.
     */
    search: 'search',
    /**
     * AddJobTitle target: suggestions for a professional when adding a job title
     * to its profile. It allows to select a non-existent job title that will
     * be created with the name provided.
     * It displays specific description text for professionals.
     */
    addJobTitle: 'addJobTitle',
    /**
     * Professionals target: suggestions for a service professional looking
     * for an existent job title.
     * It displays specific description text for professionals.
     */
    professionals: 'professionals'
};

/**
 * The component view model
 * @class
 * @param {Object} params
 * @param {KnockoutObservable<string>} params.id Input element ID
 * @param {KnockoutObservable<string>} params.value Let's subscribe to what
 * user types in the autocomplete, or selected from suggestions. It gives
 * a read-only access to the value.
 * @param {KnockoutObservable<boolean>} params.isBusy Let's know the state of
 * the external load of results data (search/filtering)
 * @param {Function<string, object, kocomponents/input-autocomplete/ActionsAfterSelect>} [params.onSelect]
 * Callback triggered when the user selects a suggestion from the listBox; see
 * the input-autocomplete docs for full detail.
 * @param {(string|KnockoutObservable<string>)} [params.suggestionButtonText]
 * Text for an optional button displayed on each suggestion; it doesn't trigger
 * anything different than select the suggestion, but gives a hint to user
 * for the action after select it.
 * @param {(string|KnockoutObservable<string>)} [params.label=Job title]
 * The label text for the input-autocomplete.
 * @param {(boolean|KnockoutObservable<boolean>)} [params.visuallyHiddenLabel=false]
 * Whether the label should be visually hidden (hidden but available to screen readers) or not.
 * @param {(boolean|KnockoutObservable<boolean>)} [params.isDisabled=false]
 * Whether the input should be disabled or not (to prevent user interaction).
 * @param {(Target|KnockoutObservable<Target>)} [params.target=Target.search] Which use
 * is targetting the autocomplete instance: searching for job titles or displaying
 * suggestions to a proffesional that is adding a job title to its listing.
 */
function ViewModel(params) {
    this.isLoading = ko.observable(false);
    //create an observable variable to hold the search term
    this.value = ko.observable();

    /**
     * @member {KnockoutComputed<string>} queryTerm Gets a valid query term to
     * perform a search, otherwise null.
     * It's valid if there is a value and meets the minimum length.
     */
    this.queryTerm = ko.pureComputed(function() {
        var s = this.value();
        return s && s.length >= MIN_LENGTH ? s : null;
    }, this);

    /**
     * @member {Object}
     * Object.jobTitles {KnockoutObservableArray<JobTitleSearchResult>}
     */
    this.suggestions = {
        jobTitles: ko.observableArray([])
    };
    // We create a custom 'length' property for suggestions, so it
    // returns almost 1 if there is valid query when in 'addJobTitle' target;
    // this allow us
    // to ever show a suggestion to add user typed query even if there are not
    // result, as far as it meets the minimum query lenght (implicit by the
    // the result of the inherit 'queryTerm').
    this.suggestions.length = ko.pureComputed(function() {
        var count = this.suggestions.jobTitles().length;
        if (!this.isAddJobTitle()) {
            return count;
        }
        else {
            var hasQuery = !!this.queryTerm();
            return Math.max(hasQuery ? 1 : 0, this.suggestions.jobTitles().length);
        }
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
     * at the autocomplete (a suggestion is selected from the list).
     * Is passed directly to the input-autocomplete, see there for full docs.
     */
    this.onSelect = params.onSelect;

    /// Members based on params
    // Configurable per use case, or automatic if empty
    /**
     * @member {KnockoutObservable<string>}
     * Let's indicate what text will contain each button that appears near
     * a suggestion, as a hint for the user of the action that will trigger
     * when selecting it. The button will be hidden if no text (default).
     * Example use cases are:
     * - 'Add' (meaning: add job title to my profile)
     * - 'Sign up' (meaning: sign up now using this job title)
     */
    this.suggestionButtonText = getObservable(params.suggestionButtonText);
    /**
     * @member {KnockoutObservable<string>} id An unique ID for the input.
     */
    this.id = getObservable(params.id);
    /**
     * @member {KnockoutObservable<string>} label
     */
    this.label = getObservable(params.label || 'Job title');
    /**
     * @member {KnockoutObservable<boolean>}
     */
    this.visuallyHiddenLabel = getObservable(params.visuallyHiddenLabel);
    /**
     * @member {Target}
     */
    this.target = getObservable(params.target);
    /**
     * @member {KnockoutObservable<boolean>}
     */
    this.isDisabled = getObservable(params.isDisabled);
    /**
     * Whether we are in target 'addJobTitle' mode.
     * @member {KnockoutComputed<boolean>}
     */
    this.isAddJobTitle = ko.pureComputed(function() {
        return this.target() === Target.addJobTitle;
    }, this);

    /**
     * Whether we are in target 'search' mode.
     * @member {KnockoutComputed<boolean>}
     */
    this.isSearchTarget = ko.pureComputed(function() {
        return this.target() === Target.search;
    }, this);

    /// Performing search
    /**
     * Performs an API search by term
     * @private
     * @param {string} searchTerm
     */
    var loadSuggestions = function() {
        var s = this.value();
        if(!s) {
            this.suggestions.jobTitles.removeAll();
            return;
        }

        this.isLoading(true);

        return search.jobTitleAutocomplete(s)
        .then(function(results) {
            if(results) {
                this.suggestions.jobTitles(results.map(function(item) {
                    return new JobTitleSearchResult(item);
                }));
            }
            else {
                this.suggestions.jobTitles.removeAll();
            }
            this.isLoading(false);
        }.bind(this))
        .catch(function(err) {
            this.isLoading(false);
            if (err && err.statusText === 'abort') return null;
        }.bind(this));
    }.bind(this);

    // Auto-search on user typing but throttling it to prevent too much requests
    // that undermine performance.
    // It performs the search one has passed a timeout from latest keystroke
    ko.computed(function() {
        loadSuggestions();
    })
    //.extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 120 } });
    .extend({ rateLimit: { timeout: 120 } });
 }

ko.components.register(TAG_NAME, {
    template: TEMPLATE,
    viewModel: ViewModel,
    synchronous: true
});

exports.Target = Target;
