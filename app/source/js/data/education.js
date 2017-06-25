/**
 * Management of the user education records (for public listing),
 * local and remote.
 */
// TODO store-jsdocs
'use strict';

var UserEducation = require('../models/UserEducation');
var ListRemoteModel = require('../utils/ListRemoteModel');
var session = require('./session');
var remote = require('./drivers/restClient');

module.exports = new ListRemoteModel({
    listTtl: { minutes: 1 },
    itemIdField: 'educationID',
    Model: UserEducation
});

exports.addLocalforageSupport('education');

exports.addRestSupport(remote, 'me/education');
//api.addMockedRemote(testdata());

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});

/*
function testdata() {
    return [
        {
            educationID: 1,
            institutionName: 'A school',
            degreeCertificate: 'The degree',
            fieldOfStudy: 'Field of study',
            fromYearAttended: 1993,
            toYearAttended: 1996
        },
        {
            educationID: 2,
            institutionName: 'Empire Beauty School - Scottsdale'
        },
        {
            educationID: 3,
            institutionName: 'MIT',
            degreeCertificate: 'Computering',
            fieldOfStudy: 'Systems administration'
        }
    ];
}
*/