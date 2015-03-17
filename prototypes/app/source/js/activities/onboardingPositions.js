/**
    Onboarding Positions activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout'),
    NavBar = require('../viewmodels/NavBar'),
    NavAction = require('../viewmodels/NavAction');

var singleton = null;

exports.init = function initOnboardingPositions($activity, app) {

    if (singleton === null)
        singleton = new OnboardingPositionsActivity($activity, app);
    
    return singleton;
};

function OnboardingPositionsActivity($activity, app) {

    this.accessLevel = app.UserType.Freelancer;
    
    this.$activity = $activity;
    this.app = app;
    this.dataView = new ViewModel();
    ko.applyBindings(this.dataView, $activity.get(0));

    // TestingData
    setSomeTestingData(this.dataView);

    // Object to hold the options passed on 'show' as a result
    // of a request from another activity
    this.requestInfo = null;
    
    this.navBar = new NavBar({
        title: 'Job Titles',
        leftAction: NavAction.menuNewItem,
        rightAction: NavAction.menuIn
    });
}

OnboardingPositionsActivity.prototype.show = function show(options) {
 
    options = options || {};
    this.requestInfo = options;
};

function ViewModel() {

    // Full list of positions
    this.positions = ko.observableArray([]);
}

var Position = require('../models/Position');
// UserPosition model
function setSomeTestingData(dataview) {
    
    dataview.positions.push(new Position({
        positionSingular: 'Massage Therapist'
    }));
    dataview.positions.push(new Position({
        positionSingular: 'Housekeeper'
    }));
}