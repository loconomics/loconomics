/**
    Search results returned for categories.
**/
'use strict';

var Model = require('./Model');

function CategorySearchResult(values) {
    
    Model(this);
    
    this.model.defProperties({
        categoryID: 0,
        categoryName: '',
        searchDescription: '',
        averageRating: '',
        totalRatings: '',
        averageResponseTimeMinutes: 0,
        averageHourlyRate: 0,
        serviceProfessionalsCount: 0
    }, values);
}

module.exports = CategorySearchResult;
