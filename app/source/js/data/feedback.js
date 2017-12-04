/**
 * Allows users to send feedback,
 * to our remote webservice.
 */
// TODO jsdocs
//global navigator,window
'use strict';

var remote = require('./drivers/restClient');

var getUserDeviceInfo = function getUserDeviceInfo() {
    var dev = window.device || {
        platform: 'web',
        model: 'unknow',
        cordova: '',
        version: ''
    };
    return {
        userAgent: navigator.userAgent,
        platform: dev.platform,
        version: dev.version,
        model: dev.model,
        cordova: dev.cordova
    };
};

/**
    @param {Object} values
    @param {string} values.message
    @param {number} values.vocElementID
    @param {boolean} values.becomeCollaborator
    @param {string} [values.userDevice] Out value, added to the object
    by querying current execution context
**/
exports.postIdea = function postIdea(values) {
    values.userDevice = JSON.stringify(getUserDeviceInfo());
    return remote.post('feedback/ideas', values);
};

/**
    @param {Ojbect} values
    @param {string} message
    @param {number} vocElementID
    @param {string} [userDevice] Out value, added to the object
    by querying current execution context
**/
exports.postSupport = function postSupport(values) {
    values.userDevice = JSON.stringify(getUserDeviceInfo());
    return remote.post('feedback/support', values);
};
