/**
    Loader utility to load Shell items on demand with AJAX
**/
'use strict';

var $ = require('jquery');
var appActivities = require('../../activities');

const folder = 'assets/js/activities/';

module.exports = {

    baseUrl: '/',

    load: function load(route) {
        return new Promise(function(resolve, reject) {
            //console.debug('Shell loading on demand', route.name, route);
            $.getScript(
                module.exports.baseUrl + folder + route.name + '.js'
            ).done(function() {
                // Resolve with the html, that will be injected by the Shell/DomItemsManager
                resolve(appActivities.get(route.name).template);
            })
            .fail(reject);
        });
    }
};
