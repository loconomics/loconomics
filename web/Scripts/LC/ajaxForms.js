﻿/* Forms submitted via AJAX */
var $ = jQuery || require('jquery'),
    callbacks = require('./ajaxCallbacks'),
    changesNotification = require('./changesNotification'),
    blockPresets = require('./blockPresets'),
    validationHelper = require('./validationHelper');

// Global settings, will be updated on init but is accessed
// through closure from all functions.
// NOTE: is static, doesn't allows multiple configuration, one init call replace previous
// Defaults:
var settings = {
    loadingDelay: 0,
    element: document
};

// Adapted callbacks
function ajaxFormsCompleteHandler() {
    callbacks.complete.apply(this, arguments);
}

function ajaxErrorPopupHandler(jx, message, ex) {
    var ctx = this;
    if (!ctx.form) ctx.form = $(this);
    if (!ctx.box) ctx.box = ctx.form;
    // Data not saved:
    if (ctx.changedElements)
        changesNotification.registerChange(ctx.form, ctx.changedElements);

    ctx.autoUnblockLoading = true;

    // Common logic
    callbacks.error.apply(ctx, arguments);
}

function ajaxFormsSuccessHandler() {
    callbacks.success.apply(this, arguments);
}

/*******************************
* Ajax Forms generic function.
* Result expected is:
* - html, for validation errors from server, replacing current .ajax-box content
* - json, with structure: { Code: integer-number, Result: string-or-object }
*   Code numbers:
*    - Negative: errors, with a Result object { ErrorMessage: string }
*    - Zero: success result, it shows a message with content: Result string, else form data attribute 'success-post-message', else a generic message
*    - 1: success result, Result contains a URL, the page will be redirected to that.
*    - Major 1: success result, with custom handler throught the form event 'success-post-message'.
*/
function ajaxFormsSubmitHandler(event) {
    // Context var, used as ajax context:
    var ctx = {};
    // Default data for required params:
    ctx.form = (event.data ? event.data.form : null) || $(this);
    ctx.box = (event.data ? event.data.box : null) || ctx.form.closest(".ajax-box");
    var action = (event.data ? event.data.action : null) || ctx.form.attr('action') || '';
    var data = ctx.form.find(':input').serialize();

    // Validations
    var validationPassed = true;
    // To support sub-forms throuh fieldset.ajax, we must execute validations and verification
    // in two steps and using the real form to let validation mechanism work
    var isSubform = ctx.form.is('fieldset.ajax');
    var actualForm = isSubform ? ctx.form.closest('form') : ctx.form,
      disabledSummaries = new jQuery();

    // On subform validation, we don't want the form validation-summary controls to be affected
    // by this validation (to avoid to show errors there that doesn't interest to the rest of the form)
    // To fullfill this requisit, we need to hide it for the validator for a while and let only affect
    // any local summary (inside the subform).
    if (isSubform) {
      disabledSummaries = actualForm
      .find('[data-valmsg-summary=true]')
      .filter(function () {
        // Only those that are outside the subform
        return !$.contains(ctx.form.get(0), this);
      })
      // We must use 'attr' instead of 'data' because is what we and unobtrusiveValidation checks
      // (in other words, using 'data' will not work)
      .attr('data-valmsg-summary', 'false');
    }

    // First at all, if unobtrusive validation is enabled, validate
    var valobject = actualForm.data('unobtrusiveValidation');
    if (valobject && valobject.validate() === false) {
      validationHelper.goToSummaryErrors(ctx.form);
      validationPassed = false;
    }

    // If custom validation is enabled, validate
    var cusval = actualForm.data('customValidation');
    if (cusval && cusval.validate && cusval.validate() === false) {
      validationHelper.goToSummaryErrors(ctx.form);
      validationPassed = false;
    }

    // To support sub-forms, we must check that validations errors happened inside the
    // subform and not in other elements, to don't stop submit on not related errors.
    // Just look for marked elements:
    if (isSubform && ctx.form.find('.input-validation-error').length)
      validationPassed = false;

    // Re-enable again that summaries previously disabled
    if (isSubform) {
      // We must use 'attr' instead of 'data' because is what we and unobtrusiveValidation checks
      // (in other words, using 'data' will not work)
      disabledSummaries.attr('data-valmsg-summary', 'true');
    }

    // Check validation status
    if (validationPassed === false) {     
      // Validation failed, submit cannot continue, out!
      return false;
    }

    // Data saved:
    ctx.changedElements = (event.data ? event.data.changedElements : null) || changesNotification.registerSave(ctx.form.get(0));

    // Loading, with retard
    ctx.loadingtimer = setTimeout(function () {
        ctx.box.block(blockPresets.loading);
    }, settings.loadingDelay);
    ctx.autoUnblockLoading = true;

    // Do the Ajax post
    $.ajax({
        url: (action),
        type: 'POST',
        data: data,
        context: ctx,
        success: ajaxFormsSuccessHandler,
        error: ajaxErrorPopupHandler,
        complete: ajaxFormsCompleteHandler
    });

    // Stop normal POST:
    return false;
}

// Public initialization
function initAjaxForms(options) {
    $.extend(true, settings, options);

    /* Attach a delegated handler to manage ajax forms */
    $(settings.element).on('submit', 'form.ajax', ajaxFormsSubmitHandler);
    /* Attach a delegated handler for a special ajax form case: subforms, using fieldsets. */
    $(settings.element).on('click', 'fieldset.ajax .ajax-fieldset-submit',
        function (event) {
          var form = $(this).closest('fieldset.ajax');

          event.data = {
            form: form,
            box: form.closest('.ajax-box'),
            action: form.data('ajax-fieldset-action'),
            // Data saved:
            changedElements: changesNotification.registerSave(form.get(0), form.find(':input[name]'))
          };
          return ajaxFormsSubmitHandler(event);
        }
    );
}
/* UNUSED?
function ajaxFormMessageOnHtmlReturnedWithoutValidationErrors(form, message) {
    var $t = $(form);
    // If there is no form errors, show a successful message
    if ($t.find('.validation-summary-errors').length == 0) {
        $t.block(infoBlock(message, {
            css: popupStyle(popupSize('small'))
        }))
        .on('click', '.close-popup', function () { $t.unblock(); return false; });
    }
}
*/

// Module
if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        init: initAjaxForms,
        onSuccess: ajaxFormsSuccessHandler,
        onError: ajaxErrorPopupHandler,
        onComplete: ajaxFormsCompleteHandler
    };