/**
    Education activity
**/
'use strict';

var ko = require('knockout'),
    Activity = require('../components/Activity');

var A = Activity.extends(function EducationActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.LoggedUser;
    this.viewModel = new ViewModel(this.app);
    // Defaults settings for navBar.
    this.navBar = Activity.createSubsectionNavBar('Marketplace Profile', {
        backLink: '/marketplaceProfile'
    });
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);
    
};

function ViewModel(/*app*/) {
    
    //this.isSyncing = app.model.userEducation.state.isSyncing;
    this.isSyncing = ko.observable(false);
    this.isLoading = ko.observable(false);
    this.isSaving = ko.observable(false);
    
    this.list = ko.observableArray(testdata());
}

function testdata() {
    return [
        new UserEducation({
            school: 'A school',
            degree: 'The degree',
            field: 'Field of study',
            startYear: 1993,
            endYear: 1996
        }),
        new UserEducation({
            school: 'Empire Beauty School - Scottsdale'
        }),
        new UserEducation({
            school: 'MIT',
            degree: 'Computering',
            field: 'Systems administration'
        })
    ];
}

var Model = require('../models/Model');
// TODO Incomplete Model for UI mockup
function UserEducation(values) {
    Model(this);
    
    this.model.defProperties({
        school: '',
        degree: '',
        field: '',
        startYear: null,
        endYear: null
    }, values);
}
