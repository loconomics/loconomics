/**
 * ProfileAlert model object. 
 * 
 * @class
 **/
'use strict';

var Model = require('./Model');

function ProfileAlert(values) {

    Model(this);

    this.model.defProperties({
        alertID: 0,
        alertName: null,
        displayRank: 9999,
        isRequired: false
    }, values);
}

module.exports = ProfileAlert;
