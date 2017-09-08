/**
    View Model for the SearchJobTitlesVM component
**/
'use strict';

var ko = require('knockout');
var user = require('../data/userProfile').data;
var MarketplaceSearchVM = require('./MarketplaceSearch');

module.exports = function SearchJobTitlesVM() {
    // Inherits
    MarketplaceSearchVM.call(this);

    this.isInput = ko.pureComputed(function() {
        var s = this.searchTerm();
        return s && s.length > 2;
    }, this);

    this.onClickJobTitle = function() {};
    this.clickJobTitle = function(d, e) {
        try {
            this.onClickJobTitle(d, e);
        }
        catch(ex) {}
        // Close suggestions
        this.searchTerm('');
    }.bind(this);

    this.onClickNoJobTitle = function() {};
    this.clickNoJobTitle = function(d, e) {
        try {
            this.onClickNoJobTitle(this.searchTerm(), e);
        }
        catch(ex) {}
        // Close suggestions
        this.searchTerm('');
    }.bind(this);

    this.jobTitleHref = ko.observable('');
    this.noJobTitleHref = ko.observable('');

    // Configurable per use case, or automatic if empty
    this.customResultsButtonText = ko.observable('');

    this.resultsButtonText = ko.pureComputed(function() {
        var t = this.customResultsButtonText();
        if (t) return t;
        var anon = user.isAnonymous();
        return anon ? 'Sign up' : 'Add';
    }, this);

    this.thereAreJobTitles = ko.pureComputed(function() {
        var jts = this.searchResults.jobTitles();
        return jts.length > 0;
    }, this);
};
