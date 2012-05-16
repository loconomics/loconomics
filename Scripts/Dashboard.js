
/*
 * For Messaging, waiting for loadHashBang to know if we must load
 * an specific message thread at page loading
 */
$(document).bind('loadHashBang', function (event, hashbangvalue) {
    // Hashbangvalue is something like: Thread-1_Message-2
    // Where '1' is the ThreadID and '2' the optional MessageID
    var pars = hashbangvalue.split('_');
    var urlParameters = {};
    for (var i = 0; i < pars.length; i++) {
        var parsvalues = pars[i].split('-');
        if (parsvalues.length == 2) {
            urlParameters[parsvalues[0]] = parsvalues[1];
        }
    }
    // Analize parameters values
    if (urlParameters.Thread) {
        openMessageThreadInTab(urlParameters.Thread, "Message Thread " + urlParameters.Thread, urlParameters.Message);
    }
});

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

        var bid = $(this).data('booking-id');
        var brid = $(this).data('booking-request-id');
        var data = { BookingRequestID: brid };
        var url = "Booking/$BookingRequestDetails/";
        var tabId = 'bookingRequestID' + brid;

        if (bid) {
            url = "Booking/$BookingDetails/";
            data.BookingID = bid;
            tabId += '_bookingID' + bid;
        }

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
        } else
        // Tab couln't be created, already must exist, focus it
            TabbedUX.focusTab('#' + tabId);
    });

    /*
    * Booking Request confirmation
    */
    $('body').delegate('.booking-request .button-confirm-datetime, .booking-request .button-decline-booking', 'click', function () {
        var brId = $(this).data('booking-request-id');
        var $tab = $(this).closest('.tab-body');
        var options = { autoUnblockLoading: true };
        var data = { BookingRequestID: brId };
        var $t = $(this);
        var url;
        if ($t.hasClass('button-confirm-datetime')) {
            data.ConfirmedDateType = $(this).data('date-type');
            url = 'Booking/$ConfirmBookingRequest/';
        } else if ($t.hasClass('button-decline-booking')) {
            url = 'Booking/$DeclineBookingRequest/';
        } else {
            // Bad handler:
            return;
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
                if (!dashboardGeneralJsonCodeHandler(data, $tab, options)) {
                    // Unknowed sucessfull code (if this happen in production there is a bug!)
                    alert("Result Code: " + data.Code);
                }

                // After update request, bookings-list tab need be reloaded
                $('#bookings-all').reload();
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


    /*=========
    * Messaging
    */
    $('.message-thread-list .actions .item-action').click(function () {
        openMessageThreadInTab(
            $(this).data('message-thread-id'),
            $(this).closest('.message-thread-list').find('.user-public-name:eq(0)').text());
    });

    $('body').delegate('.conversation-messages > li.new-message textarea', 'focus', function () {
        $(this).animate({ height: 250 });
    });

});

function openMessageThreadInTab(threadId, tabTitle, highlightMessageId) {
    var tid = threadId;
    var data = { MessageThreadID: tid };
    var url = "Messaging/$MessageThread/";
    var tabId = 'messageThreadID-' + tid;

    var tab = TabbedUX.createTab('#main', tabId, tabTitle);
    if (tab) {
        TabbedUX.focusTab(tab);

        var $tab = $(tab);

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

                // Updating the tab title, because when is loaded by URL, the title is the ID,
                // here is setted something more usable:
                TabbedUX.setTabTitle($tab, $tab.find('.user-public-name:eq(0)').text());

                if (highlightMessageId) {
                    $tab.find('.message-' + highlightMessageId + ' > .message-section').addClass('highlighted');
                }
            }
        });
    } else {
        // Tab couln't be created, already must exist, focus it
        TabbedUX.focusTab('#' + tabId);
        // Search MessageID to highlight it
        if (highlightMessageId) {
            $('#' + tabId).find('.message-' + highlightMessageId + ' > .message-section').addClass('highlighted');
        }
    }
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
            // Special Code 2: show login popup (with the given url at data.Result)
            container.unblock();
            popup(data.Result, { width: 410, height: 320 });
        } else if (data.Code == 3) {
            // Special Code 3: reload current page content to the given url at data.Result)
            // Note: to reload same url page content, is better return the html directly from
            // this ajax server request.
            //container.unblock(); is blocked and unblocked againg by the reload method:
            options.autoUnblockLoading = false;
            container.reload(data.Result);
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