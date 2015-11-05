/**
    Number of verifications for the user, as user, client, service professional
    or job title specific, per group of verifications
**/
'use strict';

var Model = require('./Model');

function PublicUserVerificationsGroup(values) {
    
    Model(this);
    
    this.model.defProperties({
        verificationsCount: 0,
        groupName: '',
        groupID: ''
    }, values);
}

module.exports = PublicUserVerificationsGroup;
