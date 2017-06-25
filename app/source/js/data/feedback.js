/** Feedback
**/
//global navigator,window
'use strict';

exports.create = function create(appModel) {
    
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
    
    return {
        /**
            @param values:Object {
                message:string,
                vocElementID:int,
                becomeCollaborator:boolean,
                userDevice:string (automatic)
            }
        **/
        postIdea: function postIdea(values) {
            values.userDevice = JSON.stringify(getUserDeviceInfo());
            return appModel.rest.post('feedback/ideas', values);
        },
        /**
            @param values:Object {
                message:string,
                vocElementID:int,
                userDevice:string (automatic)
            }
        **/
        postSupport: function postSupport(values) {
            values.userDevice = JSON.stringify(getUserDeviceInfo());
            return appModel.rest.post('feedback/support', values);
        }
    };
};
