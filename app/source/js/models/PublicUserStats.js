/**
    Public User Stats
**/
'use strict';

var Model = require('./Model');
var duration2Language = require('../utils/duration2Language');
var ko = require('knockout');

function PublicUserStats(values) {
    
    Model(this);
    
    this.model.defProperties({
        userID: 0,
        responseTimeMinutes: 0
    }, values);
    
    this.responseTimeText = ko.pureComputed(function() {
        var min = this.responseTimeMinutes();
        if (min < 1) {
            return 'immediate';
        }
        return duration2Language({ minutes: min });
    }, this);
}

module.exports = PublicUserStats;
