/** Client model **/
'use strict';

var ko = require('knockout');

function Client(def) {
    def = def || {};
    
    this.firstName = ko.observable(def.firstName);
    this.lastName = ko.observable(def.lastName);
    this.fullName = ko.computed(function() {
        return (this.firstName() + ' ' + this.lastName());
    }, this);
}

module.exports = Client;
