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
                    // If is a JSON result:
                    if (typeof (data) === 'object') {
                        // Special Code 1: do a redirect
                        if (data.Code == 1) {
                            window.location = data.Result;
                        } else if (data.Code == 2) {
                            $tab.unblock();
                            popup(data.Result, { width: 410, height: 320 });
                        } else { // data.Code < 0
                            // There is an error code.

                            // Unblock loading:
                            box.unblock();
                            // Block with message:
                            var message = data.Code + ": " + (data.Result ? data.Result.ErrorMessage ? data.Result.ErrorMessage : data.Result : '');
                            box.block({
                                message: 'Error: ' + message,
                                css: popupStyle(popupSize('small'))
                            })
                            .click(function () { box.unblock(); });

                            // Do not unblock in complete function!
                            autoUnblockLoading = false;
                        }
                    } else {
                        $tab.html(data);
                    }
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