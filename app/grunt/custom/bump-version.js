/**
 * Task 'bump-version' to increase package.json version number, commit the
 * change and tag it.
 *
 * @param {string} newVersion Any value allowed by `npm version $newVersion`, usually
 * the keywords `patch` or `minor`, but can be an explicit number too.
 *
 * The `npm version patch|minor` is used internally, and that one used to do
 * all that steps but only does the git tasks for packages on the root of the
 * git repo, that is not our case. Additionally, we customize the tag name.
 *
 * Similar Bash version of this (don't work on Windows, even with Git Bash if Yarn is used
 * and creates other problems if the shell is changed):
 * `LAST_APP_VERSION=$(npm version patch) && git add package.json && git commit -m ${LAST_APP_VERSION} && git tag releases/app-${LAST_APP_VERSION}`
 */
'use strict';

const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const TASK_NAME = 'bump-version';

/**
 * Grunt task factory
 * @param {Grunt} grunt
 */
module.exports = function(grunt) {
    grunt.registerTask(TASK_NAME, 'Increase, commit and tag package version', async function(newVersion) {
        const done = this.async();
        try {
            let { stdout: version } = await npmVersion(newVersion);
            // Remove white line and first 'v'.
            version = version.trim().substr(1);
            await exec(`git add package.json && git commit -m "v${version}" && git tag releases/app-${version}`);
            grunt.log.writeln(`Bumped version to ${version}`);
            done();
        }
        catch (err) {
            grunt.fail.warn(err);
        }
    });
};

/**
 * Updates package.json version
 * @param {string} newVersion patch, minor or a version number.
 * @returns {Promise<string, Error>} Resolves to version set to the package.json
 */
function npmVersion(newVersion) {
    return exec(`npm version ${newVersion}`, {
        cwd: path.resolve(__dirname, '..')
    });
}
