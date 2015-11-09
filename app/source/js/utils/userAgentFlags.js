/**
    User agent sniffing. Because sometimes is needed.
**/
//global window
'use strict';

module.exports = function getFlags() {
    if (window.navigator && window.navigator.userAgent) {
        var ua = window.navigator.userAgent;
        var iOsWebview = /iOS|iPad|iPhone|iPod/.test(ua);
        var iOsVersion = null;
        if (iOsWebview) {
            iOsVersion = { full: /OS ((\d+_?){2,3})\s/.exec(ua)[1] };
            iOsVersion.parts = iOsVersion.full.split('_');
            iOsVersion.major = iOsVersion.full.parts[0] |0;
            iOsVersion.minor = iOsVersion.full.parts[1] |0;
            iOsVersion.revision = iOsVersion.full.parts[2] |0;
        }
        // NO WAY to detect wkwebview versus uiwebview, we just use wkwebview on iOS 9 and later
        // so next assumption works for us:
        var isWkWebview = iOsVersion && iOsVersion.major >= 9;
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
