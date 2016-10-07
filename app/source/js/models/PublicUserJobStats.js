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
        minUnitRate: 0,
        priceRateUnit: '',
        minServiceValue: ''
    }, values);
}

module.exports = PublicUserJobStats;

