/**
 * We query all activities defined and add them as on-demand bundles
 * (all defined properly as folder and index file; old style activities
 * cannot be generated this way, that keeps working as before included
 * inside the App entry point)
 * @param {Grunt} grunt
 * @param {boolean} dev Whether enable development mode, or production. This
 * have an impact in filtering the activities, since someones are only for
 * development mode, removing the need to carry with unneeded files to
 * production builds.
 * @returns {Object} paths to activities folders and files
 */
exports.query = function(grunt, dev) {
    const buildActivitiesBasePath = './build/assets/js/activities/';
    const activitiesBasePath = './source/js/activities/';
    // Gets all folder based activities, with path including the index.js filename
    let appCommonActivities = grunt.file.expand({
        cwd: activitiesBasePath,
        filter: grunt.file.isFile
    }, ['*/index.js']);
    // All activities starting with an underscore are meant to be for development
    // only (trials, demos, reference).
    if (!dev) {
        appCommonActivities = appCommonActivities.filter((activityPath) => !/^_/.test(activityPath));
    }

    const folderNameFromPath = function(activityPath) {
        // Each one is like 'about/index.js' thanks to the set-up
        // of the 'grunt.file.expand' task, so to get the activity name
        // is just split the first part up to before the path separator (even in
        // Windows returns '/' as separator).
        return activityPath.substr(0, activityPath.indexOf('/'));
    };

    return {
        /**
         * Path to activities source folder
         * @member {string}
         */
        activitiesBasePath,
        /**
         * List of paths to every (folder based) activity, relative
         * to the activitiesBasePath.
         * Each value is something like 'about/index.js'
         * @member {Array<string>}
         */
        appCommonActivities,
        /**
         * Path to activities build folder
         * @member {string}
         */
        buildActivitiesBasePath,
        /**
         * Gets the unique activity name from a relative activity path;
         * useful with `appCommonActivities.map(folderNameFromPath))`
         * @param {string} activityPath Like 'about/index.js'
         * @returns {string} Like 'about'
         */
        folderNameFromPath,
        /**
         * Gets the full path to the location of the activity at build directory
         * @returns {string}
         */
        buildPathForActivity: function(activityPath) {
            return buildActivitiesBasePath + folderNameFromPath(activityPath) + '.js';
        }
    };
};
