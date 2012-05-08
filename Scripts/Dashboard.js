$(document).ready(function () {
    /*
    * Change Photo
    */
    $('#changephoto').click(function () {
        popup(UrlUtil.LangPath + 'Dashboard/ChangePhoto/', 'small');
    });

    /*
    * Booking list actions
    */
    $('.bookings-list .actions .item-action').click(function () {
        var tabId = 'bookingRequestID' + $(this).data('booking-request-id');
        TabbedUX.createTab('#main', tabId,
            $(this).closest('.bookings-list').find('.user-public-name:eq(0)').text());
        TabbedUX.focusTab("#" + tabId);
    });
});