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
        var tab = TabbedUX.createTab('#main', tabId,
            $(this).closest('.bookings-list').find('.user-public-name:eq(0)').text());
        if (tab) {
            TabbedUX.focusTab(tab);

            var $tab = $(tab);

            // Loading, with retard
            var loadingtimer = setTimeout(function () {
                $tab.block(loadingBlock);
            }, gLoadingRetard);

            // Do the Ajax post
            $.ajax({
                url: UrlUtil.LangPath + "Booking/$BookingRequestDetails/",
                data: { BookingRequestID: $(this).data('booking-request-id') },
                success: function (data, text, jx) {
                    $tab.html(data);
                },
                error: ajaxErrorPopupHandler,
                complete: function () {
                    // Disable loading
                    clearTimeout(loadingtimer);
                    // Unblock
                    $tab.unblock();
                }
            });
        }
    });
});