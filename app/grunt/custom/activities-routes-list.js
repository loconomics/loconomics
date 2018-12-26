/**
 * Task ...?
 */
'use strict';

const path = require('path');

const TASK_NAME = 'activities-routes-list';
const query = require('../shared/queryActivities');
const outputFile = path.join(__dirname, '../../../web/_specialRoutes/activities-list.txt');

/**
 * Grunt task factory
 * @param {Grunt} grunt
 */
module.exports = function(grunt) {
    grunt.registerTask(TASK_NAME, 'List for asp.net back-end routing', () => {
        const results = query.query(grunt, false);
        const names = results.appCommonActivities
        .map(results.folderNameFromPath)
        .filter((name) => name !== 'index');

        grunt.file.write(outputFile, names.join('\n'));
    });
};
