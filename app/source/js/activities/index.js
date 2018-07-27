/**
 * Keeps an index (or registry) of loaded activities.
 * It allows activities to register themselves, so are recognized by the app,
 * the app to query them and the app entry points to preload activities.
 */

import Activity from '../components/Activity';

function createRedirect(toPath) {
    return class Redirect extends Activity {
        static get template() { return ''; }

        show(state) {
            setTimeout(() => this.app.shell.go(toPath, state, true), 10);
        }
    };
}

/**
 * Index/registry of available activity classes, as a dictionary where
 * the key is the activity route name and the class (AKA controller) the value.
 * It includes redirections too
 * @private {Object}
 */
const activities = {
    'publicContactInfo': createRedirect('public-contact-info'),
    'userProfile': createRedirect('user-profile'),
};

/**
 * Register an activity for a route name.
 * @member {string} routeName The initial path in the URL that points to the
 * activity, SHOULD NOT include a path separator ('/'). Usually the same name
 * as the activity
 * @member {Activity} ActivityClass Class inherit from Activity to implement
 * the route.
 */
export function register(routeName, ActivityClass) {
    activities[routeName] = ActivityClass;
}

/**
 * Get the activity class for the given name.
 * @param {string} routeName Route or activity name
 * @returns {Activity} Null if doesn't exists.
 */
export function get(routeName) {
    return activities[routeName];
}

/**
 * It registers all activities from the given dictionary of 'name:Activity'.
 * It's basically a 'registerMany' but expected to be used only once with
 * the proposal of preload a bunch of activities with the app entry point.
 * @param {Object} activitiesByName Follows the same format as the internal
 * dictionary, route or activity name as key and activity class as value.
 */
export function preload(activitiesByName) {
    Object.keys(activitiesByName).forEach(function(name) {
        register(name, activitiesByName[name]);
    });
}
