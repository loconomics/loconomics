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
    // TODO swith next lines on REST API implementation
    //api.addRestSupport(appModel.rest, 'education');
    api.addMockedRemote(testdata());
    
    appModel.on('clearLocalData', function() {
        api.clearCache();
    });

    return api;
};

function testdata() {
    return [
        {
            educationID: 1,
            school: 'A school',
            degree: 'The degree',
            field: 'Field of study',
            startYear: 1993,
            endYear: 1996
        },
        {
            educationID: 2,
            school: 'Empire Beauty School - Scottsdale'
        },
        {
            educationID: 3,
            school: 'MIT',
            degree: 'Computering',
            field: 'Systems administration'
        }
    ];
}
