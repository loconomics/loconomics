/**
    Generates a text message, with newlines if needed, describing the error
    object passed.
    @param {any} err As a string, is returned 'as is'; as falsy, it return a generic
    message for 'unknow error'; as object, it investigate what type of error is to
    provide the more meaninful result, with fallback to JSON.stringify prefixed
    with 'Technical details:'.
    Objects recognized:
    - Object with 'error' property. The value of that property will be analyzed
      by the other rules
    - XHR/jQuery for JSON responses: just objects with responseJSON property, is
      used as the 'err' object and passed to the other object tests.
    - Object with 'errorMessage' (server-side formatted error).
    - Object with 'message' property, like the standard Error class and Exception objects.
    - Object with 'name' property, like the standard Exception objects. The name, if any,
      is set as prefix for the 'message' property value.
    - Object with 'errors' property. Each element in the array or object own keys
      is appended to the errorMessage or message separated by newline.
    @param {string} defaultText In case err is null or empty

    TODO High complexity, refactor, simplification of supported cases?
**/
// TODO jsdocs
'use strict';

var stringifyErrorsList = function(errors) {
    var msg = '';
    if (Array.isArray(errors)) {
        msg = errors.join('\n');
    }
    else {
        msg = Object.keys(errors).map(function(key) {
            var m = errors[key];
            if (m && m.join)
                return m.join('\n');
            else
                return m;
        }).join('\n');
    }
    return msg;
};

var getErrorMessageFrom = function(err, defaultText) {
    /*jshint maxcomplexity:16, maxdepth:5*/

    defaultText = defaultText || 'Unknow error';

    if (!err) {
        return defaultText;
    }

    // Extrat in case the error is hold inside an 'error' property
    if (err.error && (typeof(err.error) === 'object' || typeof(err.error) === 'string')) {
        err = err.error;
    }

    if (typeof(err) === 'string') {
        return err || defaultText;
    }
    else {
        // If is a XHR object, use its response as the error.
        err = err.responseJSON || err;

        var msg = err.name && (err.name + ': ') || '';
        msg += err.errorMessage || err.message || '';

        if (err.errors) {
            msg += '\n' + stringifyErrorsList(err.errors);
        }
        else {
            // Avoiding that en error converting the object (circular references)
            // breaks the error control!
            try {
                var jserr = JSON.stringify(err);
                // Avoiding that empty results (empty string or empty object when there
                // is no details to show) makes us to show an annoying 'technical details'
                var hasMoreInfo = jserr && jserr !== '{}';
                // Too if there is no more information than the one extracted to build the
                // message, since on that cases the 'technical details' will be just a
                // json formatted of the same displayed message
                if (hasMoreInfo) {
                    // Reset initially, re-enabled only if there are more properties
                    // than the ones from the list
                    hasMoreInfo = false;
                    var messagePropertiesList = ['name', 'errorMessage', 'message', 'errors'];
                    Object.keys(err).forEach(function(key) {
                        if (messagePropertiesList.indexOf(key) === -1)
                            hasMoreInfo = true;
                    });
                }

                if (hasMoreInfo)
                    msg += '\n\nTechnical details: ' + jserr;
            }
            catch (ex) {
                console.warn('Impossible to stringify JSON error', err, ex);
            }
        }

        return msg || defaultText;
    }
};

module.exports = getErrorMessageFrom;
