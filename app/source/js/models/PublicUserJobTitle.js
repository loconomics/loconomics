/**
    PublicUserJobTitle model, relationship between an user and a
    job title and the main data attached to that relation for
    public access (internal fields avoided) and additional
    useful job title info (shortcut for convenience for names).
**/
'use strict';

var Model = require('./Model');

function PublicUserJobTitle(values) {
    
    Model(this);
    
    this.model.defProperties({
        userID: 0,
        jobTitleID: 0,
        intro: null,
        cancellationPolicyID: 0,
        instantBooking: false,
        jobTitleSingularName: '',
        jobTitlePluralName: ''
    }, values);

    this.model.defID(['userID', 'jobTitleID']);
}

module.exports = PublicUserJobTitle;
