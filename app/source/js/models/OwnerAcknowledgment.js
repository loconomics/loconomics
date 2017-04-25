/** OwnerAcknowledgment model
 **/
'use strict';

var Model = require('../models/Model');
var ko = require('knockout');

function OwnerAcknowledgment(values) {

    Model(this);

    this.model.defProperties({
        userID: null,
        dateAcknowledged: null,
        acknowledgedFromIP: null,
        createdDate: null,
        updatedDate: null
    }, values);

    this.isSigned = ko.pureComputed(function() {
        return this.createdDate() && this.dateAcknowledged();
    }, this);
}

module.exports = OwnerAcknowledgment;
