/**
    Access to use global App Modals
**/
'use strict';

var $ = require('jquery');

/**
    Generates a text message, with newlines if needed, describing the error
    object passed.
    @param err:any As a string, is returned 'as is'; as falsy, it return a generic
    message for 'unknow error'; as object, it investigate what type of error is to
    provide the more meaninful result, with fallback to JSON.stringify prefixed
    with 'Technical details:'.
    Objects recognized:
    - XHR/jQuery for JSON responses: just objects with responseJSON property, is
      used as the 'err' object and passed to the other object tests.
    - Object with 'errorMessage' (server-side formatted error).
    - Object with 'message' property, like the standard Error class and Exception objects.
    - Object with 'name' property, like the standard Exception objects. The name, if any,
      is set as prefix for the 'message' property value.
    - Object with 'errors' property. Each element in the array or object own keys
      is appended to the errorMessage or message separated by newline.
**/
exports.getErrorMessageFrom = function getErrorMessageFrom(err, defaultText) {
    /*jshint maxcomplexity:14, maxdepth:5*/

    defaultText = defaultText || 'Unknow error';
    
    if (!err) {
        return defaultText;
    }
    else if (typeof(err) === 'string') {
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
                if (jserr && jserr !== '{}')
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
            return errors[key].join('\n');
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

/**
    Show confirmation modal with two buttons.
    @param options:object {
        title:string Header title text
        message:string Message text
        yes:string Yes button label
        no:string No button label
    }
    @returns Promise. It resolves if button 'yes' pressed
    and reject on button 'no' pressed or modal dismissed/closed.
**/
exports.confirm = function confirm(options) {
    
    var modal = $('#confirmModal'),
        header = modal.find('#confirmModal-label'),
        body = modal.find('#confirmModal-body'),
        yesBtn = modal.find('#confirmModal-yesBtn'),
        noBtn = modal.find('#confirmModal-noBtn');

    options = options || {};

    // Fallback error message
    var title = header.data('default-text'),
        msg = body.data('default-text'),
        yes = yesBtn.data('default-text'),
        no = noBtn.data('default-text');

    body.multiline(options.message || msg);
    header.text(options.title || title);
    yesBtn.text(options.yes || yes);
    noBtn.text(options.no || no);

    return new Promise(function(resolve, reject) {
        modal.modal('show');
        yesBtn.on('tap click', function() {
            resolve();
        });
        noBtn.on('tap click', function() {
            reject();
        });
        modal.on('hide.bs.modal', function() {
            reject();
        });
    });
};

