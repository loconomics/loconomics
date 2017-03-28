/*
    Object to split client-specific services from public services prior to
    grouping by pricing type. Uses ServiceListGroup to generate the presenters.
*/
'use strict';

var ServiceListGroup = require('../ServiceListGroup'),
    $ = require('jquery');

/*
    Constructor options are passed to ServiceListGroup except services.

    Include the labelFunction parameter to override ServiceListGroup's label function.
*/
var ClientSpecificServiceListGroup = function(serviceGrouperOptions) {
    var services = serviceGrouperOptions.services || [];

    this.options = serviceGrouperOptions;
    this.clientServices = services.filter(function(s) { return s.isClientSpecific(); });
    this.publicServices = services.filter(function(s) { return !s.isClientSpecific(); });
};

/*
    Returns GroupedServicesPresenters grouped by client-specific pricings and pricing types
*/
ClientSpecificServiceListGroup.prototype.groupServices = function() {
    var options = this.options;

    var clientGroups = (new ServiceListGroup($.extend(options, {
            services: this.clientServices,
            isClientSpecific: true
        }))).serviceLists(),

        publicGroups = (new ServiceListGroup($.extend(options, {
            services: this.publicServices,
            isClientSpecific: false
        }))).serviceLists();

    return clientGroups.concat(publicGroups);
};

module.exports = ClientSpecificServiceListGroup;
