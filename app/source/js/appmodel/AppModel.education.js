/** Education (user education)
**/
'use strict';

var UserEducation = require('../models/UserEducation');
var ListRemoteModel = require('../utils/ListRemoteModel');

exports.create = function create(appModel) {
    
    var api = new ListRemoteModel({
        listTtl: { minutes: 1 },
        itemIdField: 'educationID',
        Model: UserEducation
    });

    api.addLocalforageSupport('education');

    api.addRestSupport(appModel.rest, 'me/education');
    //api.addMockedRemote(testdata());
    
    appModel.on('clearLocalData', function() {
        api.clearCache();
    });

    return api;
};
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