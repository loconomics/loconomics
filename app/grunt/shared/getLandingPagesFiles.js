'use strict';

/**
 * Gets a 'files' object for each landing page file in
 * the directory, mapping the source file with the build destination
 * @param {Object} grunt Grunt instance
 * @param {string} destFolder Base of the destination folder, as accessed
 * from the root. Usually: 'build/welcome' or '../web/welcome'
 * @param {string} [sourceFolder] Source folder as accessed from the root.
 */
module.exports = function(grunt, destFolder, sourceFolder) {
    // Individual generated files for each landing
    sourceFolder = sourceFolder || 'source/html/landingPages';
    var landingIncludedDir = sourceFolder + '/';
    var landingPages = grunt.file.expand({
        cwd: landingIncludedDir,
        filter: grunt.file.isFile
    }, ['*.html']);
    // Generate the files mapping object, that will be something like
    // files: { '../web/welcome/one.html': ['source/html/landingPages/one.html'] }
    var landingBuildPath = destFolder + '/';
    var landingPagesFiles = {};
    landingPages.forEach(function(page) {
        landingPagesFiles[landingBuildPath + page] = landingIncludedDir + page;
    });

    return landingPagesFiles;
};
