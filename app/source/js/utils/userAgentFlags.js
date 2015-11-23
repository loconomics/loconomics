/**
    User agent sniffing. Because sometimes is needed.
**/
//global window
'use strict';

module.exports = function getFlags() {
    if (window.navigator && window.navigator.userAgent) {
        var ua = window.navigator.userAgent;
        var iOsWebview = /iOS|iPad|iPhone|iPod/.test(ua);
        var iOsVersion = /OS ((\d+_?){2,3})\s/.exec(ua);
        if (iOsVersion && iOsVersion.length > 1) {
            iOsVersion = { full: iOsVersion[1] || '' };
            iOsVersion.parts = iOsVersion.full.split('_');
            iOsVersion.major = iOsVersion.parts[0] |0;
            iOsVersion.minor = iOsVersion.parts[1] |0;
            iOsVersion.revision = iOsVersion.parts[2] |0;
        }
        // The way to detect WkWebview versus UiWebview is to feature detect 'indexedDB',
        // and adding the check for 'cordova' we kwow we are in Cordova/Phonegap app rather than Safari, so webview,
        // and additionally, check for iOS.
        var isWkWebview = iOsWebview && window.cordova && window.indexedDB;
        var isAndroid = /Android/.test(ua);
        // Chrome, browser or webview https://developer.chrome.com/multidevice/user-agent  Old webkit webviews gets discarded
        var isChrome = /Chrome\//.test(ua);
        var isMobile = iOsWebview || isAndroid;

        return {
            isIos: iOsWebview,
            iOsVersion: iOsVersion,
            isWkWebview: isWkWebview,
            isAndroid: isAndroid,
            isChrome: isChrome,
            isMobile: isMobile
        };
    }
    
    return {};
};
