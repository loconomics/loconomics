/**
    Loader utility to load Shell items on demand with AJAX
**/
'use strict';

var appActivities = require('../../activities');
var loadScript = require('load-script2');

const folder = 'assets/js/activities/';

// #457 workaround:
// IMPORTANT: Workaround used in conjuntion with Activity.deleteSingletonInstance
// regarding a new activity lifecycle (#457) that disposes the instance
// and html-DOM when the activity stop being used.
// This new lifecycle applies only to folder-based activities, bundle individually
// with it's copy of html and css. Most activities still are *legacy*, and
// this is not used on that case.
// The new lifecycle allows to make safer assumptions on how the code runs
// (specially working with components) and result is a more clear code and less
// memory wasted.
//
// This method matches and activity DOM instance and expected name to perform
// removal of the activity 'singleton' instance and DOM removal, so both
// are recreated next time (inside the loader, the 'check registry' recreate it
// without touching network -class is kept in memory, is the class instance
// the removed thing plus DOM-, and before that the 'closed' event handler
// ensure to call this properly).
/**
 * Removes an activity instance, both class instance and DOM-template instance,
 * wheter $act and name matches and activity exists in the registry.
 * @returns {boolean} True if was found and removed, false otherwise.
 */
function removeActivityInstance($act, name) {
    // It's *our* activity?
    if ($act.data('activity') === name) {
        // Remove instance
        var ActivityClass = appActivities.get(name);
        if (ActivityClass) {
            ActivityClass.deleteSingletonInstance(ActivityClass, name);
            // Remove DOM
            $act.remove();
            return true;
        }
    }
    return false;
}

module.exports = {

    baseUrl: '/',

    load: function load(route, shell) {
        return new Promise(function(resolve, reject) {
            // Prepare this activity to be disposed after being used
            // IMPORTANT: Needs to be run only once per activity loaded,
            // or later calls to loader will keep attaching duplicated handlers;
            // and we attach this even before checking registry,
            // otherwise already cached cases will not remove the instance after
            // used. Too, we cannot use 'once' because this will run first for
            // previous activity being closed and is not the one loaded right
            // now, so will remove the hanlder before even run it for the
            // correct activity, that's we use 'on' with a check for removal
            // only when matched the activity.
            shell.on(shell.events.closed, function handler($act) {
                if (removeActivityInstance($act, route.name)) {
                    // done, remove this handler
                    shell.removeListener(shell.events.closed, handler);
                }
            });
            // Check registry first, since with new activity lifecycle for bundle
            // activities (#457) will remove template from DOM but still exist
            // in the registro; then, loader will be asked for html but we
            // don't need to hit the network since we have loaded it in memory.
            var something = appActivities.get(route.name);
            if (something) {
                resolve(something.template);
                return;
            }
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
