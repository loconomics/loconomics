/**
    Access to use global App Modals
**/
'use strict';

var $ = require('jquery');
require('./utils/jquery.multiline');

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
exports.getErrorMessageFrom = function getErrorMessageFrom(err, defaultText) {
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
            msg += '\n' + exports.stringifyErrorsList(err.errors);
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
                console.log('Impossible to stringify JSON error', err, ex);
            }
        }

        return msg || defaultText;
    }
};

exports.stringifyErrorsList = function (errors) {
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

/**
    Show an error modal to notify the user.
    @param options:Object {
        message:string DEPRECATED. Optional. Informative error message.
        error:string Optional. Error/Exception/XHR object, used to auto
            generate the error message. It takes precedence over 'message'
            option, discarding an error object/string is passed.
            It replaces 'message' since can do the same and more.
        title:string Optional. The text to show in the modal's header,
            with fallback to the Modal's default title.
    }
    @returns Promise. It resolves when the modal is dismissed/closed.
    No formal rejection happens.
**/
exports.showError = function showErrorModal(options) {

    var modal = $('#errorModal'),
        header = modal.find('#errorModal-label'),
        body = modal.find('#errorModal-body');

    options = options || {};

    // Fallback error message
    var msg = body.data('default-text');

    // Error message from given error object, with fallback to default one.
    // DEPRECATED temporarly using the 'message' option.
    msg = exports.getErrorMessageFrom(options.error || options.message, msg);

    body.multiline(msg);

    header.text(options.title || header.data('default-text'));

    return new Promise(function(resolve) {
        modal.modal('show');
        modal.on('hide.bs.modal', function() {
            resolve();
        });
    });
};

exports.confirm = require('./modals/confirm').show;

exports.showNotification = require('./modals/notification').show;

exports.showTimePicker = require('./modals/timePicker').show;

exports.showTextEditor = require('./modals/textEditor').show;

exports.showAnnouncement = require('./modals/announcementModal').show;
