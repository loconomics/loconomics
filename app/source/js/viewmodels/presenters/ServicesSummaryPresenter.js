/*
    Presenter object for a summary services for a given user listing
*/
'use strict';

var groupBy = require('../../utils/groupBy');
var mapBy = require ('../../utils/mapBy');

/*
    ServicesSummaryPresenter

    Binds services and job titles to produce a summary object useful in view models

    job title: job title used to label these services
    services: services to include in the summary
    pricingTypes : used to fetch pricing type names based on ID
*/
var ServicesSummaryPresenter = function(listing, services, pricingTypes) {
    this._listing = listing;
    this._services = services;
    this._pricingTypesByID = mapBy(pricingTypes, function(p) { return p.pricingTypeID(); });
};

ServicesSummaryPresenter.prototype.hasServices = function() {
    return this._services.length > 0;
};

ServicesSummaryPresenter.prototype.listingTitle = function() {
    return this._listing.title;
};

ServicesSummaryPresenter.prototype.jobTitleID = function() {
    return this._listing.jobTitleID;
};

ServicesSummaryPresenter.prototype.summaryText = function() {
    return this.serviceTypeSummaries().sort().reverse().join(', ');
};

ServicesSummaryPresenter.prototype.serviceTypeSummaries = function() {
    var servicesByPricingTypeID = groupBy(this._services, function(s) { return s.pricingTypeID(); });
    var pricingTypeName = function(type, count) { return count == 1 ? type.singularName() : type.pluralName(); };

    return Object.keys(servicesByPricingTypeID).map(function(pricingTypeID) {
        var services = servicesByPricingTypeID[pricingTypeID];
        var pricingType = this._pricingTypesByID[pricingTypeID];

        return services.length + ' ' + pricingTypeName(pricingType, services.length).toLowerCase();
    }.bind(this));
};

/*
    summaries

    Create presenters for each job title from the list of services provided. Will produce
    a summary for a job title even if there are no services in the collection that
    match that job title.

    listingss: user listings objects; each will result in a summary
    services: set of services to use for the collection of summaries
    pricingTypes: all pricing types needed to fetch pricing type names for each service in services
*/
ServicesSummaryPresenter.summaries = function(listings, services, pricingTypes) {
    var listingsByID = mapBy(listings, function(t) { return t.jobTitleID; });
    var servicesByJobTitleID = groupBy(services, function(s) { return s.jobTitleID(); }, Object.keys(listingsByID));
    // Iterate all enabled job title IDs per given listings (rather than iterate
    // by servicesByJobTitleID that caused bug #856)
    return Object.keys(listingsByID).map(function(jobTitleID) {
        return new ServicesSummaryPresenter(listingsByID[jobTitleID], servicesByJobTitleID[jobTitleID], pricingTypes);
    });
};

ServicesSummaryPresenter.sortByJobTitle = function(a, b) {
    return a.listingTitle().localeCompare(b.listingTitle());
};

module.exports = ServicesSummaryPresenter;
