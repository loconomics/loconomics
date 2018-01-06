/**
    Loader utility to load Shell items on demand with AJAX
**/
'use strict';

var $ = require('jquery');
var appActivities = require('../../app.activities');

const folder = 'assets/js/activities/';

module.exports = {

    baseUrl: '/',

    load: function load(route) {
        return new Promise(function(resolve, reject) {
            console.debug('Shell loading on demand', route.name, route);
            $.getScript(
                module.exports.baseUrl + folder + route.name + '.js'
            ).done(function(/*script*/) {
                // TODO: Get module from the script: was executed and module exists
                // but which is the name/path? Can be get in a different way?
                debugger;
                var Activity = require('./activities/' + route.name).default;
                // Register as loaded activity class
                appActivities[route.name] = Activity;
                // Resolve with the html, that will be injected by the Shell/DomItemsManager
                resolve(Activity.template);
            })
            .fail(reject);
        });
    }
};
