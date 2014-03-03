/**
    User private dashboard section
**/
var $ = require('jquery');

// Code on page ready
$(function () {
  /* Sidebar */
  var 
    toggle = require('../LC/toggle'),
    ProviderPosition = require('../LC/ProviderPosition');
  // Attaching 'change position' action to the sidebar links
  $(document).on('click', '[href = "#togglePositionState"]', function () {
    var 
      $t = $(this),
      v = $t.text(),
      n = toggle(v, ['on', 'off']),
      positionId = $t.closest('[data-position-id]').data('position-id');

    var pos = new ProviderPosition(positionId);
    pos
    .on(pos.stateChangedEvent, function (state) {
      $t.text(state);
    })
    .changeState(n);

    return false;
  });

  /* Promote */
  var generateBookNowButton = require('./dashboard/generateBookNowButton');
  // Listen on DashboardPromote instead of the more close container DashboardBookNowButton
  // allows to continue working without re-attachment after html-ajax-reloads from ajaxForm.
  generateBookNowButton.on('.DashboardPromote'); //'.DashboardBookNowButton'

  /* Privacy */
  var privacySettings = require('./dashboard/privacySettings');
  privacySettings.on('.DashboardPrivacy');

  /* Payments */
  var paymentAccount = require('./dashboard/paymentAccount');
  paymentAccount.on('.DashboardPayments');

  /* Profile photo */
  var changeProfilePhoto = require('./dashboard/changeProfilePhoto');
  changeProfilePhoto.on('.DashboardAboutYou');

  /* About you / education */
  var education = require('./dashboard/educationCrudl');
  education.on('.DashboardAboutYou');

  /* About you / verifications */
  require('./dashboard/verificationsActions').on('.DashboardVerifications');

  /* Your work / services */
  require('./dashboard/serviceAttributesValidation').setup($('.DashboardYourWork form'));

  /* Your work / pricing */
  require('./dashboard/pricingCrudl').on('.DashboardYourWork');

  /* Your work / locations */
  require('./dashboard/locationsCrudl').on('.DashboardYourWork');

  /* Your work / licenses */
  require('./dashboard/licensesCrudl').on('.DashboardYourWork');

  /* Your work / photos */
  require('./dashboard/managePhotosUI').on('.DashboardYourWork');

  /* Your work / reviews */
  $('.DashboardYourWork').on('ajaxSuccessPost', 'form', function (event, data) {
    // Reseting the email addresses on success to avoid resend again messages because
    // mistake of a second submit.
    var tb = $('.DashboardReviews [name=clientsemails]');
    // Only if there was a value:
    if (tb.val()) {
      tb
      .val('')
      .attr('placeholder', tb.data('success-message'))
      // support for IE, 'non-placeholder-browsers'
      .placeholder();
    }
  });

  /* Your work / add-position */
  var addPosition = require('./dashboard/addPosition');
  addPosition.init('.DashboardAddPosition');
  $('body').on('ajaxFormReturnedHtml', '.DashboardAddPosition', function () {
    addPosition.init();
  });

  /* Availabilty */
  require('./dashboard/weeklySchedule').on();
  require('./dashboard/monthlySchedule').on();
  require('./dashboard/calendarSync').on();
  require('./dashboard/appointmentsCrudl').on('.DashboardAvailability');
});