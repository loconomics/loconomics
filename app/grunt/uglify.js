'use strict';

var queryActivities = require('./shared/queryActivities');

var conservativeOptions = {
    // Custom optimizations to avoid bugs:
    // - #709: use of Function.name by Models/Activities;
    //compress: false,
    compress: {
        sequences     : false,  // join consecutive statemets with the “comma operator”
        properties    : true,  // optimize property access: a["foo"] → a.foo
        dead_code     : true,  // discard unreachable code
        drop_debugger : true,  // discard “debugger” statements
        unsafe        : false, // some unsafe optimizations (see below)
        conditionals  : true,  // optimize if-s and conditional expressions
        comparisons   : true,  // optimize comparisons
        evaluate      : true,  // evaluate constant expressions
        booleans      : true,  // optimize boolean expressions
        loops         : true,  // optimize loops
        // Iago: Additionally to drop unused vars/funcs, it drops the functions names too
        // causing the bug #709 (we use Function.name).
        // I had set-up linting to notify about actual unused bars/funcs so
        // compression stage is not reach if that happens.
        unused        : false, // drop unused variables/functions
        hoist_funs    : true,  // hoist function declarations. This fix some strict mode violations, caused by other optimizations.
        hoist_vars    : false, // hoist variable declarations
        keep_fargs    : true,  // Avoid that mangle remove unused func args
        keep_fnames   : true,  // Avoid that mangle remove function names. This allows enable mangling without causing the bug #709
        if_return     : true,  // optimize if-s followed by return/continue
        join_vars     : true,  // join var declarations
        side_effects  : true,  // drop side-effect-free statements
        warnings      : true,  // warn about potentially dangerous optimizations/code
        global_defs   : {}     // global definitions
    },
    //report: 'gzip',

    // To look for compression warnings only:
    /*compress: {
        warnings: true
    },*/

    // Reduce variable names
    // IMPORTANT: Disabled because it causes bugs, even now that keep_fnames:true fixes #709 seems to
    // break other things. Continue reviewing
    // Know problem: entering the serviceProfessionalService activity shows bug of 'double knockout binding'
    mangle: false
};

/**
 * Map a list as an object, using the given callback to create the property
 * key name based on the item and index; there is a callback to map the value
 * too.
 * @param {Array} list
 * @param {Function} keyCb
 * @param {Function} [valueCb] Defaults to use the item as the value
 * @returns {Object}
 */
const mapAsObject = function(list, keyCb, valueCb) {
    const obj = {};
    list.forEach((item, index) => {
        obj[keyCb(item, index)] = valueCb ? valueCb(item, index) : item;
    });
    return obj;
};

module.exports = function(grunt) {

    const {
        appCommonActivities,
        buildPathForActivity
    } = queryActivities.query(grunt);

    return {
        'appCommon': {
            'options': conservativeOptions,
            'files': {
                './build/assets/js/common.min.js': ['./build/assets/js/common.js'],
                './build/assets/js/app.min.js': ['./build/assets/js/app.js'],
                './build/assets/js/welcome.min.js': ['./build/assets/js/welcome.js']
            }
        },
        'appActivities': {
            'options': conservativeOptions,
            // Creates the files object with key and value being the same location
            files: mapAsObject(appCommonActivities, buildPathForActivity, buildPathForActivity)
        }
    };
};
