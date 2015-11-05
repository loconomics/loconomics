# Detached Things Folder

Created when removing old Release-6 content and components, to be replaced by a new approach and UI (developed under /app), this folder holds several files, out of its original organization, that are expected to still have relevant content, maybe refactored to be included in a near future in the app/web, or just reviewed before being finally discarded/removed.

The content itself is expected to NOT work, but still being relevant code that can be reused or reconnected in some way.

## Release-7 missing features

Things from release-6.3 to review for release-7, possible 'measing features' in current designs and layouts.
Most of the content listed below was removed and can be reviewed in the git tag releases/release-6.3,
while the code that has more possibilities to being reused, most important to track code history, was moved to this folder.


* See the /_detachedThings folder for more code that may be refactored.

- Account/deactivate
- Account/reactivate
- Account/delete
- Account/changePassword (related forgotPasword, passwordReset)
- Account/resendConfirmationEmail
- Booking/$bookingReview
- Booking/$cancel/decline/confirm Booking
- Booking/EmailBookingReview
- Messaging/$MessageThread/List :: review customer specific SQLs, and inferrence of 'type' from the type/status columns
- Messaging/$ReportUnauthorizedUse
- Messaging/SMS* :: moved to /_detachedThings
- Reviews/* :: moved to /_detachedThings
- Profile/$AvailabilityCalendarWidget :: not sure if related with UI and JS of the detached availability CalendarWidget
- Profile/$Map
- Profile/$Message
- Profile/$UserVerifiedLicensesWidget
- Profile/_MyWork :: reuse SQLs
- Profile/_Verifications :: reuse SQLs
- Profile/EmailRecommendation

## Files to refactor for Release-7

Some files that were not removed and not moved but need to be changed for Release-7; they because may work still but need refactor/updates

- HelpCenter/$OlarkIntegration :: still in place
- HelpCenter/$ZendeskIntegration :: still in place
- HelpCenter/$GoogleAnalytics :: still in place (this is new, really, but must be reloacted and used in the same way as Olark and Zendesk)
- HelpCenter/_TrusteSealWidget :: still in place
- HelpCenter/UpgradeBrowser :: still in place
- en-US/_SiteLayout.cshtml :: heavely updated but still in place, may be used or not for some server dynamic content (not statically generated; SEO).
- en-US/_EmailLayout.cshtml :: will be removed after complete the refactor into the new EmailCommunications

### Email related components left if place to review/discard/refactor and move under EmailCommunications:

- Email/*
- Messaging/EmailInquiry
