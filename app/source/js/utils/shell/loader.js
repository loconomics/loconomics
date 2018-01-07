/**
    Loader utility to load Shell items on demand with AJAX
**/
'use strict';

var appActivities = require('../../activities');
var loadScript = require('load-script2');

const folder = 'assets/js/activities/';

module.exports = {

    baseUrl: '/',

    load: function load(route) {
        return new Promise(function(resolve, reject) {
            //console.debug('Shell loading on demand', route.name, route);
            loadScript(
                module.exports.baseUrl + folder + route.name + '.js',
                function(err) {
                    if (err) { reject(err); }
                    else {
                        // Added timeout only for edge cases where this callback runs
                        // on script loaded but not completely executed (for any weird reason, but
                        // happened the very first time tried this code -and never more after that, just
                        // being a bit paranoid to prevent strange to debug or support errors;
                        // making it run after next task may ensure script was executed).
                        setTimeout(function() {
                            // Resolve with the html, that will be injected by the Shell/DomItemsManager
                            resolve(appActivities.get(route.name).template);
                        }, 13);
                    }
                }
            );
        });
    }
};
