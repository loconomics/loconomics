/**
 * Utility to set-up Browserify to allow requiring/importing Stylus files
 * with common project settings, optimizations and rules.
 * Made for integration with Grunt-browserify.
 *
 * It uses:
 * - 'stylify' as the transform that allows load Stylus file (.styl)
 * - 'poststylus' to integrate PostCSS plugins as a plugin for Stylus
 * - 'clean-css' to minify the generated CSS (same as with grunt-contrib-cssmin')
 * - 'nib' is loaded as usually so can be used in any .styl file.
 * - 'autoprefixer' (PostCSS plugin) to prefix CSS attributes (smart enough
 *      to only prefix ones required by our list of supported browsers as
 *      defined in the package.json). This undo unneeded prefixes added by 'nib',
 *      if used (and is fine --we should stop using nib for that but is less
 *      a problem thanks to this)
 * - 'postCleanCss' (custom PostCSS plugin) to integrate 'clean-css' in this
 *      pipeline in an synchronous mode (there is a plugin at npm but uses async
 *      API that is not compatible with Stylus)
 * - 'fixUrlPathPlugin' (custom Stylus plugin) to convert paths to images from
 *      common relative path (../images/) into an absolute path, valid when
 *      importing styl files into js. It expects images being placed at
 *       '/assets/images' in the server.
 */
'use strict';
/// Dependencies
const stylus = require('stylus');
var postcss = require('postcss');
var poststylus = require('poststylus');
var autoprefixer = require('autoprefixer');
var stylify = require('stylify');
var CleanCSS = require('clean-css');
/// Common project settings
const sharedStylusSettings = require('../stylus.settings');
const cleanCssSettings = require('../cssmin.settings.js');

/**
 * Creates a PostCSS plugin that minifies CSS using clean-css in sync mode.
 * @returns {PostCSS.Plugin}
 */
var postCleanCss = postcss.plugin('clean-css', function(grunt) {
    const cleancss = new CleanCSS(cleanCssSettings);
    return function (css, res) {
        var result = cleancss.minify(css.toString());
        if (result.warnings) {
            for(const msg of result.warnings) {
                // Logs without stop task
                grunt.log.error('CleanCSS:', msg);
                //res.warn(msg);
            }
        }
        if (result.errors) {
            for(const msg of result.errors) {
                // Logs stopping task, except --force is used
                grunt.fail.warn('CleanCSS:', msg);
                //res.error(msg); ?
            }
        }
        // NOTE: Something to do with result.sourceMap? and .stats?
        // (Stylus has not source maps, that is the really important, so
        // a map for minified is not relevant)
        // Return optimized styles:
        res.root = postcss.parse(result.styles);
    };
});
/**
 * Converts well-know relative paths to images inside a Stylus file as
 * absolute paths that works with embedded styles.
 * It's an Stylus plugin.
 * @param {Stylus} style
 */
var fixUrlPathPlugin = function(style) {
    // TODO: detect all paths, not only a set of presets (right now just images)
    // use path module to do something smarter, but this seems fine and
    // enought for now since all routes start the same way (../)
    // (like if the file were under the css folder, like global files).
    // It detects the path and comiles, captures the relative path
    const detectPath = /^['"]\.\.\/images\/(.+)['"]$/i;
    // It provides new path and placeholder for the relative path,
    // but WITHOUT comiles.
    const replacementPath = '/assets/images/$1';
    var buildUrlLiteral = (path) => new stylus.nodes.Literal(`url('${path}')`);
    var fixUrlPath = function(url) {
        var path = url.toString();
        //console.log('path', path, detectPath.test(path), path.replace(detectPath, replacementPath));
        if (detectPath.test(path)) {
            // Update so it works from the sites root
            return buildUrlLiteral(path.replace(detectPath, replacementPath));
        }
        else {
            // Left unchanged, notice as warning since can be an error
            console.warn('Unchanged CSS URL (unknow path; review because the image could not load)');
            return buildUrlLiteral(path);
        }
    };
    style.define('url', fixUrlPath);
};

/**
 *
 * @param {Grunt} grunt
 * @returns {GruntTaskSettings} Object with the format of a Grunt task settings,
 * plus options specific for Grunt-browserify.
 */
exports.create = function(grunt) {
    /**
     * Logs a PostCSS warning/error into Grunt.
     * @param {(PostCss.Warning,string,Object)} message
     */
    var postLogWarning = function(message) {
        grunt.fail.warn(message.toString());
    };
    /**
     * Full set-up of stylify
     */
    var stylifyOptions = {
        use: [
            fixUrlPathPlugin,
            require('nib')(),
            poststylus([
                autoprefixer(),
                postCleanCss(grunt)
            ], postLogWarning)
        ],
        "set": sharedStylusSettings
    };
    /**
     * Returns the set-up for the Grunt-browserify task, that can be assigned
     * directly to the task-target or extended with additional options;
     * because of that, it follows the structure of {files, options} for
     * a Grunt multi-task and the options allowed by Grunt-browserify.
     */
    return {
        options: {
            configure: function(b) {
                b.transform(stylify, stylifyOptions);
            }
        }
    };
};
