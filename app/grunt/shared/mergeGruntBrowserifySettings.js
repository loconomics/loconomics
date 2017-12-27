'use strict';
var merge = require('deepmerge');
/**
 * Merge two settings with the format of a grunt-browserify task, using
 * deep merge and making that functions specified at both settings
 * are all executed, in original order with original arguments and no
 * result value.
 * This works well for the callbacks allowed by Grunt-browserify, while
 * let us split some complex set-ups individually.
 * @param {GruntBrowserifyTaskSettings} baseSettings
 * @param {GruntBrowserifyTaskSettings} specificSettings
 */
module.exports = function(baseSettings, specificSettings) {
    var merged = merge(baseSettings, specificSettings);
    // Callbacks need to be ALL included, wrapping inside another one
    // We know grunt-browserify supports three callbacks inside
    // options property
    if (baseSettings.options) {
        // It only matters if both exists as functions, else just keep
        // normal merge (last one)
        Object.keys(baseSettings.options).forEach((fName) => {
            if (typeof(baseSettings.options[fName]) === 'function' &&
                typeof(specificSettings.options[fName]) === 'function') {
                // Combine, both are executed, in order
                merged.options[fName] = function() {
                    baseSettings.options[fName].apply(null, arguments);
                    specificSettings.options[fName].apply(null, arguments);
                };
            }
        });
    }
    return merged;
};
