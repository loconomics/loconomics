/**
    WorkPhoto Model
**/
'use strict';
var Model = require('./Model');

function WorkPhoto(values) {
    Model(this);
    
    this.model.defProperties({
        workPhotoID: 0,
        userID: 0,
        jobTitleID: 0,
        caption: '',
        fileName: '',
        url: '',
        rankPosition: 0,
        updatedDate: null,
        // Additional local data:
        // path to local file, unsaved/not-uploaded still.
        localTempFilePath: null
    }, values);
}
module.exports = WorkPhoto;
