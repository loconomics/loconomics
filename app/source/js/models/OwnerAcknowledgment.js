/** OwnerAcknowledgment model
 **/
'use strict';

var Model = require('../models/Model');

function OwnerAcknowledgment(values) {

    Model(this);

    this.model.defProperties({
        userID: null,
        dateAcknowledged: null,
        acknowledgedFromIP: null,
        createdDate: null,
        updatedDate: null
    }, values);
}

module.exports = OwnerAcknowledgment;
