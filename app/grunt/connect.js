'use strict';

/**
 * Enumeration of values por types of HTTP Response Redirection.
 * Values are actual HTTP Status Codes.
 * @readonly
 * @enum {number}
 */
var RedirectType = {
    permanent: 301,
    temporary: 302
}
/**
 * Perform an http redirect in a Connect/Express response
 * object, closing the response
 * @param {Connect.Response} res
 * @param {string} toUrl
 * @param {RedirectType} type
 */
var redirectResponse = function(res, toUrl, type) {
    res.statusCode = type;
    res.setHeader('Location', toUrl);
    res.end();
};

/**
 * Connect middleware that sets the '.html' extension
 * to any request to a URL without extension and that didn't
 * seems a directory (no trailing slash).
 * NOTE: Do not check existence of files or directory, must
 * be injected before the middleware that manages static files.
 * @param {Connect.Request} req
 * @param {Connect.Response} res
 * @param {function} next
 */
var autoHtmlExtensionMiddleware = function(req, res, next) {
    var hasExtension = s => /.+\..+$/.test(s);
    var endsInSlash = s => /\/$/.test(s);
    if (!hasExtension(req.url) && !endsInSlash(req.url)) {
        var toUrl = req.url + '.html';
        // Redirect
        redirectResponse(res, toUrl, RedirectType.temporary);
        return;
        ////Rewrite
        //req.url = toUrl;
        //next();
    }
    next();
};

module.exports = {
    options: {
        //livereload: 35729
        middleware: function(connect, options, middlewares) {
            // Injects in first place
            middlewares.unshift(autoHtmlExtensionMiddleware);
            // All middlewares
            return middlewares;
        }
    },
    atbuild: {
        options: {
            port: 8811,
            hostname: 'localhost',
            base: 'build'
            // A watch task after this already keeps alive the script :-)
            // keepalive: true,
            //open: true
        }
    },
    phonegap: {
        options: {
            port: 8812,
            hostname: 'localhost',
            base: 'phonegap/www',
            keepalive: true
        }
    }
};
