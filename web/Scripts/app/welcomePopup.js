/**
* Welcome popup
*/
var $ = require('jquery');
// bootstrap tooltips:
require('bootstrap');
var Cookie = require('../LC/Cookie');
//TODO more dependencies?

var initialized = false;

exports.init = function initWelcomePopup() {

  exports.autoShow();

  $(document).on('click', 'a.sign-up, a.register, a.need-login, button.need-login', function () {
    // Remove any opened popup (it overlays the welcomepopup)
    $.unblockUI();

    return !exports.show();
  });

};

exports.autoShow = function autoShowWelcomePopup() {
  var $wp = $('#welcomepopup');
  var $wo = $('#welcome-popup-overlay');

  // When the popup is integrated in the page instead of
  // the layout, exec show and close orphan overlay.
  if ($wp.length &&
    $wp.is(':visible') &&
    $wp.closest('#welcome-popup-overlay').length === 0) {
    $wo.hide();
    exports.show(true);
    return;
  } else if ($wo.hasClass('auto-show')) {
    exports.show(true);
  }
};

exports.initPopup = function initPopup() {

    var c = $('#welcomepopup');
    if (c.length === 0) return false;

    var overlay = c.closest('#welcome-popup-overlay');

    if (c.data('is-initialized')) return overlay;

    /**
    Go to the first step on a already initialized popup
    **/
    function startAgain(animate) {
        // Return popup to the first step (choose profile, #486) and exit -init is ready-
        // Show first step
        var step1 = c.find('.profile-choice, header .presentation');
        if (animate)
            step1.slideDown('normal');
        else
            step1.show();
        // Hide second step
        var step2 = c.find('.terms, .profile-data');
        if (animate)
            step2.slideUp('normal');
        else
            step2.hide();

        // Hide back-action button
        c.find('.back-action').hide();
        // Reset hidden fields per profile-type
        c.find('.profile-data li:not(.position-description)').show();
        // Reset choosen profile-type
        c.find('.profile-choice [name=profile-type]').prop('checked', false);
        // Reset URLs per profile-type
        c.find('a.terms-of-use').data('tooltip-url', function () { return $(this).attr('data-tooltip-url'); });
        // Reset validation rules
        c.find('.profile-data li input:not([type=hidden])')
        .attr('data-val', null)
        .removeClass('input-validation-error');
    }

    if (initialized) {
        startAgain();
        return true;
    }
    initialized = true;

    // close button logic and only when as popup (it has overlay)
    var closeButton = c.find('.close-popup, [href="#close-popup"]');
    if (overlay.length === 0)
        closeButton.hide();
    else
        closeButton.show().on('click', function () {
            overlay.fadeOut('normal');
            Cookie.set('WelcomePopupVisible', 'false');
            return false;
        });

    // go back button
    c.find('.back-action').on('click', function (e) {
        startAgain(true);
        e.preventDefault();
    });

    // Popovers for tooltip replacement
    c.find('[data-toggle="popover"]')
    .popover()
    .filter('a[href="#"]').on('click', function (e) {
        // Avoid navigate to the link
        e.preventDefault();
    });

    var skipStep1 = c.hasClass('select-position');

    // Init
    if (!skipStep1) {
        c.find('.profile-data, .terms, .position-description').hide();
    }
    c.find('form').get(0).reset();

    // Description show-up on autocomplete variations
    var showPositionDescription = {
        /**
        Show description in a textarea under the position singular,
        its showed on demand.
        **/
        textarea: function (event, ui) {
            c.find('.position-description')
            .slideDown('fast')
            .find('textarea').val(ui.item.description);
        },
        /**
        Show description in a tooltip that comes from the position singular
        field
        **/
        tooltip: function (event, ui) {
            // It needs to be destroyed (no problem the first time)
            // to get it updated on succesive attempts
            var el = $(this);
            el
            .popover('destroy')
            .popover({
                title: 'Does this sound like you?',
                content: ui.item.description,
                trigger: 'focus',
                // Different placement for mobile design (up to 640px wide) to avoid being hidden
                placement: $('html').width() < 640 ? 'top' : 'left'
            })
            .popover('show')
            // Hide on possible position name change to avoid confusions
            // (we can't use on-change, need to be keypress; its namespaced
            // to let off and on every time to avoid multiple handler registrations)
            .off('keypress.description-tooltip')
            .on('keypress.description-tooltip', function () {
                el.popover('hide');
            });
        }
    };

    // Re-enable autocomplete:
    setTimeout(function () { c.find('[placeholder]').placeholder(); }, 500);
    function setupPositionAutocomplete(seletCallback) {
        c.find('[name=jobtitle]').autocomplete({
            source: LcUrl.JsonPath + 'GetPositions/Autocomplete/',
            autoFocus: false,
            minLength: 0,
            select: function (event, ui) {
                // No value, no action :(
                if (!ui || !ui.item || !ui.item.value) return;
                // Save the id (value) in the hidden element
                c.find('[name=positionid]').val(ui.item.value);

                seletCallback.call(this, event, ui);

                // We want to show the label (position name) in the textbox, not the id-value
                $(this).val(ui.item.positionSingular);

                return false;
            },
            focus: function (event, ui) {
                if (!ui || !ui.item || !ui.item.positionSingular) return false;
                // We want the label in textbox, not the value
                $(this).val(ui.item.positionSingular);
                return false;
            }
        });
    }
    setupPositionAutocomplete(showPositionDescription.tooltip);
    c.find('#welcomepopupLoading').remove();

    // Actions
    function showStep2(animate) {

        var $profile = c.find('.profile-choice [name=profile-type]:checked');
        var profile = $profile.val();

        // Show back-action button
        c.find('.back-action').show();

        c.find('.profile-data li:not(.' + profile + ')').hide();
        var $presentation = c.find('.profile-choice, header .presentation');
        if (animate)
            $presentation.slideUp('normal');
        else
            $presentation.hide();

        var $profData = c.find('.terms, .profile-data');
        if (animate)
            $profData.slideDown('normal');
        else
            $profData.show();

        // Terms of use different for profile type
        if (profile == 'customer')
            c.find('a.terms-of-use').data('tooltip-url', null);
        // Change facebook redirect link
        var fbc = c.find('.facebook-connect');
        var addRedirect = 'customers';
        if (profile == 'provider')
            addRedirect = 'providers';
        fbc.data('redirect', fbc.data('redirect') + addRedirect);
        fbc.data('profile', profile);

        // Set validation-required for depending of profile-type form elements:
        c.find('.profile-data li.' + profile + ' input:not([data-val]):not([type=hidden])')
        .attr('data-val-required', '')
        .attr('data-val', true);

        // For customers become provider, hide new-account fields
        existingUserHideFields(c);

        // if Facebook Connect is in use, update fields and validations
        facebookUpdateFieldsStatus(c);

        LC.setupValidation();
    }
    c.on('change', '.profile-choice [name=profile-type]', showStep2.bind(null, true));
    c.on('ajaxFormReturnedHtml', 'form.ajax', function () {
        setupPositionAutocomplete(showPositionDescription.tooltip);
        showStep2(false);
    });

    // If profile type is prefilled by request, show step2 already:
    if (c.find('.profile-choice [name=profile-type]:checked').length)
        showStep2(false);

    c.on('click', '.facebook-connect', facebookConnect.bind(null, c));

    c.data('is-initialized', true);
    return overlay;
};

exports.show = function showPopup(fromAutoShow) {

    var overlay = exports.initPopup();

    if (overlay && overlay.length) {
        // Its a cookie was set to remember the popup was closed
        // (because was closable), avoid to show it
        if (!fromAutoShow ||
            Cookie.get('WelcomePopupVisible') !== 'false') {
            overlay.fadeIn(300);
        }

        // All fine
        return true;
    }
    else return false;
};

/**
    Attempt to login with Facebook Connect, 
    and fill the form with the data from Facebook
**/
function facebookConnect($container) {
    var fb = require('../LC/facebookUtils');

    fb.login({ scope: 'email,user_about_me' }, function (auth, FB) {
        // Set FacebookId to link accounts:
        $container.find('[name="facebookid"]').val(auth.userID);
        // Request more user data
        FB.api('/me', function (user) {
            //Fill Data
            $container.find('[name="email"]').val(user.email);
            $container.find('[name="firstname"]').val(user.first_name);
            $container.find('[name="lastname"]').val(user.last_name);
            $container.find('[name="gender"]').val(user.gender);
            $container.find('[name="about"]').val(user.about);

            facebookUpdateFieldsStatus($container);
        });
    });

    return false;
}

/**
    It triggers an update on the status of fields affected
    by a Facebook Connect: some must be hidden, others showed,
    some notes appear and some field becomes optional.
    If there is no an active Facebook Connection/Id, it
    does nothing and return false.
**/
function facebookUpdateFieldsStatus($container) {

    // if Facebook Connect is in use
    if ($container.find('[name="facebookid"]').val()) {
        // remove validation on password
        $container.find('[name="create-password"]')
            .attr('data-val-required', null)
            .attr('data-val', false);

        var femail = $container.find('[name="email"]');
        var ffirst = $container.find('[name="firstname"]');
        var flast = $container.find('[name="lasttname"]');

        // Hide data successfully filled
        if (ffirst.val())
            ffirst.closest('li').hide();
        if (flast.val())
            flast.closest('li').hide();

        // Email is special, requires confirmation #538,
        // showing additional message,
        femail.siblings('.facebook-note').show();

        // Message to notified user is connected with Facebook
        $container.find('.facebook-logged').show();
        // and hidding the button
        $container.find('.facebook-connect').hide();

        // Password is special too, no needed with Facebook
        $container.find('[name="create-password"]').closest('li').hide();

        return true;
    }
    return false;
}

function existingUserHideFields($container) {
    var femail = $container.find('[name="email"]'),
        fpwd = $container.find('[name="create-password"]');
    if (femail.val()) {
        // Hide email and password fields
        femail.closest('li').hide();
        fpwd.closest('li').hide();

        // remove validation on password
        fpwd
            .attr('data-val-required', null)
            .attr('data-val', false);
    }
}