/** WorkPhotos
**/
'use strict';

var WorkPhoto = require('../models/WorkPhoto'),
    GroupListRemoteModel = require('../utils/GroupListRemoteModel'),
    photoTools = require('../utils/photoTools'),
    extend = require('jquery').extend;

exports.create = function create(appModel) {

    var baseUrl = 'me/work-photos/';
    var api = new GroupListRemoteModel({
        // Conservative cache, just 1 minute
        listTtl: { minutes: 1 },
        groupIdField: 'jobTitleID',
        itemIdField: 'workPhotoID',
        Model: WorkPhoto
    });
    
    api.addLocalforageSupport('workPhotos');
    api.addRestSupport(appModel.rest, baseUrl);
    
    appModel.on('clearLocalData', function() {
        api.clearCache();
    });
    
    // Here we have the special case of upload files, that needs use different component than just
    // ajax/rest client.
    // We replace default:
    var pushJustBasicDataToRemote = api.pushItemToRemote.bind(api);
    // With a file-uploader logic
    // TODO Support web upload from input/jquery.uploader, right now only Cordova FileTransfer
    api.pushItemToRemote = function pushToRemote(data) {
        // If no file to upload:
        if (!data.localTempFilePath) {
            // On new photos, the photo is required!
            if (data.workPhotoID === 0) {
                // In theory, the UI must not let this to happens, so discard silently rather
                // than throw an error, since is an element that even may be dissapeared in the UI.
                //return Promise.reject({ errorMessage: 'Must pick a photo' });
                return Promise.resolve(null);
            }
            else {
                // Standard upload
                return pushJustBasicDataToRemote(data);
            }
        }
        else {
            // Standard ID and URL code
            var groupID = data[this.settings.groupIdField],
                itemID = data[this.settings.itemIdField],
                method = itemID ? 'put' : 'post',
                url = appModel.rest.baseUrl + baseUrl + groupID + (itemID ? '/' + itemID : '');
            
            // Upload with FileTransfer
            var uploadSettings = {
                fileKey: 'photo',
                mimeType: 'image/jpeg',
                httpMethod: method,
                params: data,
                headers: extend(true, {}, appModel.rest.extraHeaders)
            };
            return photoTools.uploadLocalFile(data.localTempFilePath, url, uploadSettings);
        }
    }.bind(api);
    
    return api;
};