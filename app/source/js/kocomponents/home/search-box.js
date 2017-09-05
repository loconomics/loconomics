/**
 * The main search box to look for services (job titles), professionals and
 * categories
 * @module kocomponents/home/search-box
 */
'use strict';

var TAG_NAME = 'home-search-box';
var TEMPLATE = require('../../../html/kocomponents/home/search-box.html');

var ko = require('knockout');
var getObservable = require('../../utils/getObservable');
require('../input-autocomplete');

/**
 * @typedef {Object} ResultsBase Base class or interface that externally
 * provided results object must meet.
 * @member {(number|KnockoutObservable<number>)} length Number of elements
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
 */
function ViewModel(params) {
    /// Members from input params
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
}

ko.components.register(TAG_NAME, {
    template: TEMPLATE,
    viewModel: ViewModel,
    synchronous: true
});
