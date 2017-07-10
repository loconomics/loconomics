/**
 * Wrapper around the original jquery.fileupload-image module that needs
 * to be 'shimmed'.
 * Originally worked just with a Browserify-shim set-up, but newest versions
 * of Browserify/Browserify-shim have break that set-up.
 *
 * Ideally, a package.json/browserify-shim entry with name
 * "jquery.fileupload-image" would be created, that requires depends modules
 * ensuring to pass in the jquery and loadImage references.
 * But it doesn't 'require' every dependency defined, then no included in the
 * bundle and throws error at runtime
 *
 * This file just 'requires' every 'depends', that are defined as shims
 * at package.json/browserify-shim, and finally the original fileupload-image
 * module just with an alias, so we can add an alias at package.json/browser
 * to this file keeping the name originally used across the project.
 */
require('jquery');
require('jquery-ui/widget');
require('blueimp-canvas-to-blob');
require('jquery.fileupload');
require('jquery.fileupload-process');
require('load-image');
require('load-image.ios');
require('load-image.meta');
require('jquery.fileupload-image-original');
