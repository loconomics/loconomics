/**
    UserJobTitle model, relationship between an user and a
    job title and the main data attached to that relation.
**/
'use strict';

var Model = require('./Model');

function UserJobTitle(values) {
    
    Model(this);
    
    this.model.defProperties({
        userID: 0,
        jobTitleID: 0,
        intro: null,
        statusID: 0,
        cancellationPolicyID: 0,
        instantBooking: false,
        createdDate: null,
        updatedDate: null
    }, values);
    
    this.model.defID(['userID', 'jobTitleID']);
}

module.exports = UserJobTitle;
