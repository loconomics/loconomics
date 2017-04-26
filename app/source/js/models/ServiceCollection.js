/** @module models/ServiceCollection */
'use strict';

/**
 * Creates a collection from array of services
 * @class {Array} services to include in the collection
 */
var ServiceCollection = function(services) {
    this.services = services;
};

ServiceCollection.prototype.clientSpecificServices = function() {
    return this.services.filter(function(s) { return s.isClientSpecific(); });
};

ServiceCollection.prototype.publicServices = function() {
    return this.services.filter(function(s) { return !s.isClientSpecific(); });
};

module.exports = ServiceCollection;
