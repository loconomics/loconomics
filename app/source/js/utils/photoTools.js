/**
    Tools to manage photos: take photo with the camera,
    move to an app directory, upload to server.
    With support for App and Browser:
    if no take photo exists, allows to pick a file 
    to upload using Ajax solutions, while using FileTransfer
    on App.
    
    TODO Web Support with the jquery.fileupload plugin.
    
    EXAMPLES:
    - Take photo, move to local app folder and preview image in img tag
        cameraGetPicture(defaultPhotoSettings)
        .then(function(imgLocalUrl) {
            return moveLocalPhoto(imgLocalUrl, 'photos_folder');
        })
        .then(function(data) {
            return getPreviewPhotoUrl(data.url);
        })
        .then(function(previewUrl) {
            // NOTE: Use previewUrl as 'src' attribute of an img tag.
        });
        
    - Take photo, preview it and update it
        cameraGetPicture(defaultPhotoSettings)
        .then(function(imgLocalUrl) {
            var previewUrl = getPreviewPhotoUrl(imgLocalUrl);
            // NOTE: Use previewUrl as 'src' attribute of an img tag.
            
            // AUTOMATIC UPLOAD, OR SAVE imgLocalUrl AND DO THIS LATER
            return uploadLocalFile(imgLocalUrl, SERVER_UPLOAD_PHOTO_URL, {
                fileKey: 'photo', // To get as Request['photo'] on the server.
                mimeType: 'image/jpeg',
                httpMethod: 'PUT',
                params: { additional: 'data' },
                headers: {
                    Authorization: window.sessionStorage.authorization || window.localStorage.authorization
                }
            });
        });
**/
'use strict';
var extend = require('jquery').extend;
var userAgentFlags = require('./userAgentFlags')();

var defaultPhotoSettings = {
    destinationType: window.Camera && window.Camera.DestinationType.FILE_URI,
    //targetWidth: 1024,
    //targetHeight: 768,
    quality: 78,
    mediaType: window.Camera && window.Camera.MediaType.PICTURE,
    saveToPhotoAlbum: false
};
exports.defaultPhotoSettings = defaultPhotoSettings;

function takePhotoSupported() {
    return navigator.camera && navigator.camera.getPicture;
}
exports.takePhotoSupported = takePhotoSupported;

/**
    Given a local URL, return a URL that can be used
    in an img tag to see the image.
    Needed for iOS WkWebview plugin that uses a local http server
    to provide the content, since 'file:///' URLs retrieved for
    local files is not valid on that context.
**/
function getPreviewPhotoUrl(url) {
    if (!url) return null;
    // Check if we are in http connection and WkWebview (local server)
    // and we have a 'file:' uri.
    var iFile = url.indexOf('file://');
    if (userAgentFlags.isWkWebview &&
        window.location.protocol.indexOf('http') === 0 &&
        iFile === 0) {
        // Not only we need to remove the 'file', but all the initial part up
        // to the app root folder, because there is were the http server index is.
        // Paths of iOS up to 9.1 are something like /var/mobile/Containers/Data/Application/B09324-23434-2234-3423423-42/
        // followed by 'Documents/' for persisting content, or 'tmp/' for temporary (when taking a photo).
        var m = /\/Application\/[^\/]+(.+)$/.exec(url);
        if (m && m.length === 2)
            return m[1];
        else
            // Fallback: just remove the file protocol, last ressource maybe does not work too.
            return url.substr(iFile);
    }
    else {
        return url;
    }
}
exports.getPreviewPhotoUrl = getPreviewPhotoUrl;

/**
    Promise based camera API
**/
function cameraGetPicture(settings) {
    return new Promise(function(resolve, reject) {
        navigator.camera.getPicture(resolve, reject, extend(true, {}, defaultPhotoSettings, settings));
    });
}
exports.cameraGetPicture = cameraGetPicture;

/**
    Utility that copy an photo file from a temporary URI to
    a persistent storage
**/
function moveLocalPhoto(uri, destFolder, destName) {
    return new Promise(function(resolve, reject) {
        var onTempEntry = function (entry) {
            var d = new Date();
            var n = d.getTime();

            //new file name
            var newFileName = (destName || n) + ".jpg";

            window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, function(fileSys) {
                fileSys.root.getDirectory(destFolder,
                    {
                        create: true
                    },
                    function(directory) {
                        entry.moveTo(directory, newFileName, function(new_entry) {
                            var path = new_entry.fullPath;
                            var url = new_entry.toURL();

                            //console.log(path + '\n' + url);
                            //alert(path + '\n' + url);

                            resolve({
                                path: path,
                                url: url
                            });

                        }, reject);
                    },
                    reject
                );
            }, reject);
        };
        // Run the callback hell!!!
        window.resolveLocalFileSystemURI(uri, onTempEntry, reject);
    });
}
exports.moveLocalPhoto = moveLocalPhoto;

function uploadLocalFile(localFileUri, remoteUri, options) {
    return new Promise(function(resolve, reject) {
        /*global FileUploadOptions,FileTransfer*/
        remoteUri = encodeURI(remoteUri);

        // Setting options properly
        var fuopts = new FileUploadOptions();
        Object.keys(options).forEach(function(option) {
            fuopts[option] = options[option];
        });
        // Defaults
        if (!fuopts.fileKey)
            fuopts.fileKey = 'file';
        if (!fuopts.fileName)
            fuopts.fileName = localFileUri.substr(localFileUri.lastIndexOf('/') + 1);
        if (!fuopts.mimeType)
            fuopts.mimeType = 'image/jpeg';
        
        fuopts.headers = fuopts.headers || {};
        // Fix an issue, commented here: http://grandiz.com/phonegap-development/phonegap-file-transfer-error-code-3-solved/
        fuopts.headers.Connection = 'close';

        var ft = new FileTransfer();

        ft.upload(localFileUri, remoteUri, resolve, reject, fuopts);
    });
}
exports.uploadLocalFile = uploadLocalFile;

/**
    Upload local file and return the response as JSON, or null if don't parse.
**/
exports.uploadLocalFileJson = function(localFileUri, remoteUri, options) {
    return uploadLocalFile(localFileUri, remoteUri, options)
    .then(function(data) {
        if (data && data.response &&
            typeof(data.response) === 'string') {
            try {
                return JSON.parse(data.response);
            } catch(ex) {}
        }
        return null;
    });
};


