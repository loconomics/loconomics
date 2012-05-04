function bookingChangeLocation() {
    var sel = $(this);
    // :hidden selectors is a hack because jQuery doesn't
    // hide elements that are inside a hidden parent.
    if (sel.val() == "0") {
        sel.siblings('.enter-new-location').show('fast');
    } else {
        sel.siblings('.enter-new-location, .enter-new-location:hidden').hide('fast');
    }
}
$(document).ready(function () {
    // Check when location changes:
    $('body').delegate('.select-location', 'change', bookingChangeLocation);

    $('#schedule').bind('endLoadWizardStep', function () {
        // Execute first time when showing the step
        $.proxy(bookingChangeLocation, $('.select-location'))();
    });
    $('#schedule').bind('reloadedHtmlWizardStep', function () {
        // Execute after reloading html of this step
        $.proxy(bookingChangeLocation, $('.select-location'))();
    });
});