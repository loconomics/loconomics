/**
    Public User Job Stats
**/
'use strict';

var Model = require('./Model');

function PublicUserJobStats(values) {
    
    Model(this);
    
    this.model.defProperties({
        userID: 0,
        jobTitleID: 0,
        servicesCount: 0,
        minServicePrice: 0,
        minServicePriceUnit: 0,
        minServiceValue: 0
    }, values);

}

module.exports = PublicUserJobStats;

