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

            var bid = $(this).data('booking-id');
            var brid = $(this).data('booking-request-id');
            var data = { BookingRequestID: brid };
            var url = "Booking/$BookingRequestDetails/";

            if (bid) {
                url = "Booking/$BookingDetails/";
                data.BookingID = bid;
            }

            // Loading, with retard
            var loadingtimer = setTimeout(function () {
                $tab.block(loadingBlock);
            }, gLoadingRetard);

            // Do the Ajax post
            $.ajax({
                url: UrlUtil.LangPath + url,
                data: data,
                success: function (data, text, jx) {
                    if (!dashboardGeneralJsonCodeHandler(data, $tab)) {
                        // Unknowed sucessfull code (if this happen in production there is a bug!)
                        alert("Result Code: " + data.Code);
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

    /*
    * Booking Request confirmation
    */
    $('body').delegate('.booking-request .button-confirm-datetime', 'click', function () {
        var dateType = $(this).data('date-type');
        var brId = $(this).data('booking-request-id');
        var $tab = $(this).closest('.tab-body');
        var options = { autoUnblockLoading: true };

        // Loading, with retard
        var loadingtimer = setTimeout(function () {
            $tab.block(loadingBlock);
        }, gLoadingRetard);

        // Do the Ajax post
        $.ajax({
            url: UrlUtil.LangPath + "Booking/$ConfirmBookingRequest/",
            data: { BookingRequestID: brId, ConfirmedDateType: dateType },
            success: function (data, text, jx) {
                if (!dashboardGeneralJsonCodeHandler(data, $tab, options)) {
                    // Unknowed sucessfull code (if this happen in production there is a bug!)
                    alert("Result Code: " + data.Code);
                }

                // After update request, bookings-list tab need be reloaded
                reloadBookingsList();
            },
            error: ajaxErrorPopupHandler,
            complete: function () {
                // Disable loading
                clearTimeout(loadingtimer);
                // Unblock
                if (options.autoUnblockLoading) {
                    $tab.unblock();
                }
            }
        });
    });
});
function reloadBookingsList() {
    $('#bookings-all').load(UrlUtil.LangPath + "Booking/$BookingsList/");
}
/* Return true for 'handled' and false for 'not handled' (there is a custom data.Code to be managed) */
function dashboardGeneralJsonCodeHandler(data, container, options) {
    if (!container) container = $(document);

    // If is a JSON result:
    if (typeof (data) === 'object') {
        if (data.Code == 0) {
            // Special Code 0: general success code, show message saying that 'all was fine'

            // Unblock loading:
            container.unblock();
            // Block with message:
            var message = data.Result || container.data('success-ajax-message') || 'Confirmed!';
            container.block({
                message: message,
                css: popupStyle(popupSize('small'))
            })
            .click(function () { container.unblock(); });
            // Do not unblock in complete function!
            options.autoUnblockLoading = false;
        } else if (data.Code == 1) {
            // Special Code 1: do a redirect
            window.location = data.Result;
        } else if (data.Code == 2) {
            container.unblock();
            popup(data.Result, { width: 410, height: 320 });
        } else if (data.Code > 0) {
            // Not handled!
            return false;
        } else { // data.Code < 0
            // There is an error code.

            // Unblock loading:
            container.unblock();
            // Block with message:
            var message = data.Code + ": " + (data.Result ? data.Result.ErrorMessage ? data.Result.ErrorMessage : data.Result : '');
            container.block({
                message: 'Error: ' + message,
                css: popupStyle(popupSize('small'))
            })
            .click(function () { container.unblock(); });

            // Do not unblock in complete function!
            options.autoUnblockLoading = false;
        }
    } else {
        container.html(data);
    }
    return true;
}