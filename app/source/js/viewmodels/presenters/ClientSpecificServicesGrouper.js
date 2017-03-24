/*
    Object to split client-specific services from public services prior to
    grouping by pricing type. Uses ServicesGrouper to generate the presenters.
*/
'use strict';

var ServicesGrouper = require('./ServicesGrouper'),
    $ = require('jquery');

/*
    Constructor options are passed to ServicesGrouper except services.

    Include the labelFunction parameter to override ServicesGrouper's label function.
*/
var ClientSpecificServicesGrouper = function(serviceGrouperOptions) {
    var services = this.serviceGrouperOptions.services || [];

    this.options = serviceGrouperOptions;
    this.clientServices = services.filter(function(s) { return s.isClientSpecific(); });
    this.publicServices = services.filter(function(s) { return !s.isClientSpecific(); });
};

/*
    Returns GroupedServicesPresenters grouped by client-specific pricings and pricing types
*/
ClientSpecificServicesGrouper.prototype.groupServices = function() {
    var options = this.options;

    var clientGroups = (new ServicesGrouper($.extend(options, {
            services: this.clientServices,
            isClientSpecific: true
        }))).groupServices(),

        publicGroups = (new ServicesGrouper($.extend(options, {
            services: this.publicServices,
            isClientSpecific: false
        }))).groupServices();

    return clientGroups.concat(publicGroups);
};

module.exports = ClientSpecificServicesGrouper;
