
/*
 * For Messaging, waiting for loadHashBang to know if we must load
 * an specific message thread at page loading
 */
$(document).bind('loadHashBang', function (event, hashbangvalue) {
    var urlParameters = getHashBangParameters(hashbangvalue);
    // Analize parameters values
    if (urlParameters.Thread) {
        openMessageThreadInTab(urlParameters.Thread, "Message Thread " + urlParameters.Thread, urlParameters.Message);
    }
    if (urlParameters.BookingRequest) {
        openBookingInTab(urlParameters.BookingRequest, urlParameters.Booking,
            "Booking Request " + urlParameters.BookingRequest);
    } else if (urlParameters.Booking) {
        openBookingInTab(0, urlParameters.Booking,
            "Booking " + urlParameters.Booking, ('Review' in urlParameters));
    }
});

$(document).ready(function () {
    /*
    * Change Photo
    */
    $('#changephoto').click(function () {
        popup(UrlUtil.LangPath + 'Dashboard/ChangePhoto/', 'small');
        return false;
    });
    /*
    * Modify position photos: Upload Photo, Edit, Delete
    */
    initPositionPhotos();
    $('.positionphotos').parent().on('click', '.positionphotos-tools-upload > a', function () {
        var posID = $(this).closest('form').find('input[name=PositionID]').val();
        popup(UrlUtil.LangPath + 'Dashboard/UploadPhoto/?PositionID=' + posID, 'small');
        return false;
    })
    .on('click', '.positionphotos-gallery li a', function () {
        var $t = $(this);
        var form = $t.closest('form');
        var editPanel = $('.positionphotos-edit', form);
        smoothBoxBlockCloseAll(form);
        // Set this photo as selected
        var selected = $t.closest('li');
        selected.addClass('selected').siblings().removeClass('selected');
        //var selected = $('.positionphotos-gallery > ol > li.selected', form);
        if (selected != null && selected.length > 0) {
            var selImg = selected.find('img');
            // Moving selected to be edit panel
            var photoID = selected.attr('id').match(/^UserPhoto-(\d+)$/)[1];
            editPanel.find('[name=PhotoID]').val(photoID);
            editPanel.find('img').attr('src', selImg.attr('src'));
            editPanel.find('[name=photo-caption]').val(selImg.attr('alt'));
            var isPrimaryValue = selected.hasClass('is-primary-photo') ? 'True' : 'False';
            editPanel.find('[name=is-primary-photo]').prop('checked', false);
            editPanel.find('[name=is-primary-photo][value=' + isPrimaryValue + ']').prop('checked', true);
        }
        return false;
    })
    .on('click', '.positionphotos-edit-delete a', function () {
        var editPanel = $(this).closest('.positionphotos-edit');
        // Change the field delete-photo to True and send form for an ajax request with
        // server delete task and content reload
        editPanel.find('[name=delete-photo]').val('True');
        editPanel.closest('form').submit();
    })
    // Show a message to the user about all was saved fine
    .on('ajaxFormReturnedHtml', '.positionphotos', function () {
        ajaxFormMessageOnHtmlReturnedWithoutValidationErrors(this, "All was saved succesfully!");
    });

    /*
    * Booking list actions
    */
    $('body').delegate('.bookings-list .actions .item-action', 'click', function () {
        var $t = $(this);
        if ($t.hasClass('change-state'))
            openChangeBookingStateForm($t.data('booking-id'), $t);
        else
            openBookingInTab(
                $t.data('booking-request-id'),
                $t.data('booking-id'),
                $t.closest('.bookings-list').find('.user-public-name:eq(0)').text()
            );
    });

    /*
    * Booking Request confirmation
    */
    $('body').delegate('.booking-request-action', 'click', function () {
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
        } else if ($t.hasClass('button-cancel-booking')) {
            url = 'Booking/$CancelBookingRequest/';
        } else {
            // Bad handler:
            return;
        }
        var ctx = { form: $tab, boxIsContainer: true };

        // Loading, with retard
        ctx.loadingtimer = setTimeout(function () {
            $tab.block(loadingBlock);
        }, gLoadingRetard);

        // Do the Ajax post
        $.ajax({
            url: UrlUtil.LangPath + url,
            data: data,
            context: ctx,
            success: function (data, text, jx) {
                $.proxy(ajaxFormsSuccessHandler, this)(data, text, jx);
                // Some list updates
                // After update request, bookings-list tab need be reloaded
                $('#bookings-all').reload();
                // After update request, state changed, new message created, reload thread list to reflect it
                $('#inbox').reload();
            },
            error: ajaxErrorPopupHandler,
            complete: ajaxFormsCompleteHandler
        });
    })
    .delegate('.review-booking-action', 'click', function () {
        var $t = $(this);
        var extraData = {};
        var asUserID = $t.data('as-user-id');
        if (asUserID)
            extraData = { AsUserID: asUserID };
        openBookingInTab(
            0,
            $t.data('booking-id'),
            $t.closest('.booking').find('.user-public-name:eq(0)').text(),
            true,
            extraData
        );
    })
    .delegate('.booking-review .open-booking-action', 'click', function () {
        var $t = $(this);
        openBookingInTab(
            0,
            $t.data('booking-id'),
            $t.closest('.booking-review').find('.user-public-name:eq(0)').text()
        );
    });

    /*===============
    * Admin bookings
    */
    $('body').on('click', '.change-booking-status .set-status, .change-booking-status .see-payment-data', function () {
        var $t = $(this);
        var form = $t.closest('form');
        var h = form.find('.change-booking-state-action');
        h.val($t.val());
        if ($t.hasClass('set-status'))
            h.attr('name', 'change-booking-status-id');
        else if ($t.hasClass('see-payment-data'))
            h.attr('name', 'see-payment-data');
        form.submit();
    });
    $('#admin-bookings').on('ajaxSuccessPostMessageClosed', '.change-booking-status-form', function (e, data) {
        if (data.Code == 0) $(this).closest('.tab-body').reload();
    }).on('ajaxSuccessPost', '.change-booking-status-form', function (e, data) {
        if (data.Code == 0)
        // Reload bookings lists already loaded to refresh state (because could change the content)
            $(this).closest('.tab-body').siblings('.tab-body').each(function () {
                // only if already loaded:
                var $t = $(this);
                if ($t.children().length > 0)
                    $t.reload();
            });
    });

    /*=========
    * Messaging
    */
    $('body').delegate('.message-thread-list .actions .item-action', 'click', function () {
        var $t = $(this);
        var auxT = $t.data('message-aux-t');
        var auxID = $t.data('message-aux-id');
        if ((auxT == "Booking" || auxT == "BookingRequest") && auxID) {
            var brID = auxID;
            var bID = 0;
            if (auxT == "Booking") {
                brID = 0;
                bID = auxID;
            }
            openBookingInTab(
                brID,
                bID,
                $t.closest('.items-list').find('.user-public-name:eq(0)').text()
            );
        } else
            openMessageThreadInTab(
                $(this).data('message-thread-id'),
                $(this).closest('.message-thread-list').find('.user-public-name:eq(0)').text());
    })
    .delegate('.conversation-messages > li.new-message textarea', 'focus', function () {
        $(this).animate({ height: 250 });
    });

    /*** Locations ***/
    $('body').delegate('.positionlocations .addlocation', 'click', function () {
        var $t = $(this);
        var tab = $t.closest('.tab-body');
        var editPanel = $('.location-edit-panel:eq(0)', tab);
        var editLoc = editPanel.children('.edit-location:eq(0)');
        var locType = $t.closest('.locations-set').data('location-type'); // values: work, travel
        editLoc.children('input[name=location-type]').val(locType);
        editPanel.addClass('type-' + locType);
        // Form reset for new location:
        editLoc.attr('id', 'EDIT' + guidGenerator());
        editLoc.find('input[name=location-editor-id]').val(editLoc.attr('id'));
        editLoc.find('input[name=location-id]').val('0');
        editLoc.find('input[name=location-name]').val('');
        editLoc.find('input[name=location-addressline1]').val('');
        editLoc.find('input[name=location-addressline2]').val('');
        editLoc.find('input[name=location-city]').val('');
        editLoc.find('input[name=location-zipcode]').val('');
        //editLoc.find('input[name=location-travel-radius]').val('');
        //editLoc.find('input[name=location-travel-transport]').val('');
        // We don't reset the state, most cases will be the same again
        editPanel.show();
        return false;
    })
    .delegate('select[name=location-state]', 'change', function () {
        var $t = $(this);
        // Updating the hidden field with the state code, the state select use the state id for value.
        $t.siblings('input[name=location-state-code]').val($t.children('[value=' + $t.val() + ']').data('stateprovince-code'));
    })
    .delegate('.address > .tools > .edit', 'click', function () {
        var $t = $(this);
        var tab = $t.closest('.tab-body');
        var viewLoc = $t.closest('.address');
        var editPanel = tab.find('.location-edit-panel:eq(0)');
        var editLoc = editPanel.children('.edit-location:eq(0)');
        var locType = $t.closest('.locations-set').data('location-type'); // values: work, travel
        editLoc.children('input[name=location-type]').val(locType);
        editPanel.addClass('type-' + locType);
        if (!viewLoc.attr('id')) viewLoc.attr('id', 'ID' + guidGenerator());
        // Copying data from view to edit:
        editLoc.attr('id', 'EDIT' + viewLoc.attr('id'));
        editLoc.find('input[name=location-editor-id]').val(viewLoc.attr('id'));
        editLoc.find('input[name=location-id]').val(viewLoc.data('location-id'));
        editLoc.find('input[name=location-name]').val(viewLoc.find('.address-name').text());
        editLoc.find('input[name=location-addressline1]').val(viewLoc.find('.address-line1').text());
        editLoc.find('input[name=location-addressline2]').val(viewLoc.find('.address-line2').text());
        editLoc.find('input[name=location-city]').val(viewLoc.find('.address-city').text());
        editLoc.find('input[name=location-zipcode]').val(viewLoc.find('.address-zipcode').text());
        // State ID and Code
        var stateCode = viewLoc.find('.address-state').text();
        editLoc.find('input[name=location-state-code]').val(stateCode);
        var selectState = editLoc.find('select[name=location-state]');
        selectState.val(selectState.children('option[data-stateprovince-code=' + stateCode + ']').attr('value'));
        editLoc.find('select[name=location-travel-radius] option[value=' + viewLoc.find('.travel-radius').text() + ']').prop('selected', true);
        editLoc.find('input[name=location-travel-transport][value=' + viewLoc.find('.travel-transport').data('transport-id') + ']').prop('checked', true);
        editPanel.show();
        return false;
    })
    .delegate('.address > .tools > .map', 'click', function () {
        alert('To be implemented: here will go a Google Maps to get coordenates');
        return false;
    })
    .delegate('.address > .tools > .remove', 'click', function () {
        var $t = $(this);
        var tab = $t.closest('.tab-body');
        var viewLoc = $t.closest('.address');
        var locid = viewLoc.data('location-id');
        var idview = viewLoc.attr('id');
        if (idview)
            $('#HIDE-' + idview).remove();
        if (locid && locid != '0')
            tab.find('form.positionlocations').append('<input type="hidden" name="remove-locations" value="' +
                locid + '" id="HIDE-REMOVED-LOCATION-' + locid + '" />');
        viewLoc.remove();
        return false;
    })
    .delegate('.location-edit-form .button', 'click', function () {
        var $t = $(this);
        var tab = $t.closest('.tab-body');
        var editLoc = $t.closest('.edit-location');
        var editPanel = editLoc.closest('.location-edit-panel');
        var locType = editLoc.find('input[name=location-type]').val();
        editPanel.removeClass('type-' + locType);
        if ($t.hasClass('save')) {
            var form = $t.closest('form');
            // First at all, if unobtrusive validation is enabled, validate
            var valobject = form.data('unobtrusiveValidation');
            if (valobject && valobject.validate() == false)
            // Validation is actived, was executed and the result is 'false': bad data, stop:
                return false;

            // Looking for read-only location
            var viewLoc;
            // Find location readonly element if is not zero
            var locId = editLoc.find('[name=location-id]').val();
            if (/^EDIT/.test(editLoc.attr('id')))
                viewLoc = tab.find('.address#' + editLoc.attr('id').substr(4));
            // If Id is zero, or readonly element doesn't exist, create one from base and add to DOM
            if (!viewLoc || viewLoc.length == 0) {
                viewLoc = editPanel.find('.readonly-location-base > .address:eq(0)').clone();
                viewLoc.attr('id', 'ID' + guidGenerator());
                // add to DOM, in its list
                var locLi = $('<li></li>').append(viewLoc);
                tab.find('ul.' + locType + '-locations').append(locLi);
            }
            // Saving this form data as a serialized value into the main form
            var viewID = 'HIDE-' + viewLoc.attr('id');
            var fdata = $('#' + viewID);
            if (fdata && fdata.length > 0) {
                fdata.val(form.serialize());
            } else {
                fdata = $('<input type="hidden" name="locations" id="HIDE-' + viewLoc.attr('id') + '"/>');
                fdata.val(form.serialize());
                tab.find('form.positionlocations').append(fdata);
            }

            // Copy location data to read-only view
            viewLoc.find('.address-name').text(editLoc.find('[name=location-name]').val());
            viewLoc.find('.address-line1').text(editLoc.find('[name=location-addressline1]').val());
            viewLoc.find('.address-line2').text(editLoc.find('[name=location-addressline2]').val());
            viewLoc.find('.address-city').text(editLoc.find('[name=location-city]').val());
            viewLoc.find('.address-zipcode').text(editLoc.find('[name=location-zipcode]').val());
            viewLoc.find('.address-state').text(editLoc.find('[name=location-state-code]').val());
            viewLoc.find('.travel-radius').text(editLoc.find('select[name=location-travel-radius]').val());
            var tti = editLoc.find('input[name=location-travel-transport]:checked').val();
            var tts = editLoc.find('input[name=location-travel-transport]:checked').parent().text();
            viewLoc.find('.travel-transport')
                .data('transport-id', tti)
                .text(tts);
        }
        // Hidding
        editLoc.closest('.edit-popup').hide();
        return false;
    })
    .delegate('.edit-popup .close-edit-popup', 'click', function () {
        $(this).closest('.edit-popup').hide();
    })
    // Add handler for success post actions:
    .on('ajaxFormReturnedHtml', 'form.positionlocations', function () {
        var $t = $(this);
        // do first initialization of has-confirm:
        $t.find('fieldset.has-confirm > .confirm input').change();
        // Show success message, if there are one! (server will not retrieve one if there is an error)
        smoothBoxBlock($t.find('.popups > .saved'), $t)
            .click(function () { smoothBoxBlock(null, $t) });
    });

    /*==============
    * Payments
    */
    function payment_preference_check() {
        var bank = $('.bank-account-preference');
        var checkedvalue = null;
        $('input[name=payment-type]').each(function () {
            if (this.checked)
                checkedvalue = this.value;
        });
        if (checkedvalue == '4')
            bank.show(300);
        else
            if (bank.is(':visible'))
                bank.hide(300);
            else
                bank.css('display', 'none');
    }
    $('input[name=payment-type]').change(payment_preference_check);
    payment_preference_check();

    /*==============
    * Licenses
    */
    function setup_license_request_form($t) {
        var v = $t.val();
        var option = $t.find(':selected');
        var p = $t.parent();
        var form = p.closest('.positionlicenses');
        var licenseRequest = $('.license-request', form);
        var det = $('.license-details', p);
        if (v) {
            $('.license-description', det).text(option.data('description'));
            $('.license-state', det).text(option.data('state-name'));
            $('.license-authority', det).text(option.data('authority-name'))
                .attr('href', option.data('verification-url'));
            var geturl = option.data('get-license-url');
            if (geturl)
                $('.get-license-url', form).show().attr('href', geturl);
            else
                $('.get-license-url', form).hide();
            // Showing:
            det.show(300);
            licenseRequest.show(300);
            form.find('.actions button').show(300);
        } else {
            det.hide(300);
            licenseRequest.hide(300);
            form.find('.actions button').hide(300);
        }
    }
    $('body').delegate('.license-type-selector > select', 'change', function () {
        setup_license_request_form($(this));
    }).delegate('form.positionlicenses', 'ajaxFormReturnedHtml', function () {
        // Listen the form.ajax event about returning html after post the form:
        setup_license_request_form($('.license-type-selector > select'));
    });
    setup_license_request_form($('.license-type-selector > select'));
    /*==========================
    * Verified licenses widget
    */
    $('body').on('click', '.user-verified-licenses h5', function () {
        $(this).siblings('.verified-license-details').toggle(300);
        return false;
    });

    /*==========================
    * Pricing Wizard: packages
    */
    (function ($pricingPackage) {
        $pricingPackage.find('.add-package').click(function () {
            var editPanel = $(this).siblings('.edit-panel');
            // We read the data-source-url attribute to get the Default value, with ProviderPackageID=0, instead the last reload value:
            editPanel.show().reload(editPanel.attr('data-source-url'));
            $(this).hide('slow');
            return false;
        });
        $pricingPackage.find('.view-panel').on('click', '.provider-package .edit', function () {
            var editPanel = $(this).closest('.package-pricing-type').find('.edit-panel');
            editPanel.closest('.pricingwizard').find('.add-package').hide('slow');
            // We read the data-source-url attribute to get the Default value, and we replace ProviderPackageID=0 with the clicked provider-package-id data:
            editPanel.show().reload(editPanel.attr('data-source-url').replace('ProviderPackageID=0', 'ProviderPackageID=' + $(this).data('provider-package-id')));
            return false;
        }).on('click', '.provider-package .delete', function () {
            var pak = $(this).closest('.provider-package');
            var res = pak.closest('.view-panel').find('.lc-ressources');
            if (confirm(res.children('.confirm-delete-package-message').text())) {
                smoothBoxBlock(res.children('.delete-package-loading-message'), pak);
                $.ajax({ url: UrlUtil.LangPath + 'PricingWizard/$ProviderPackageEdit/?action=delete&ProviderPackageID=' + $(this).data('provider-package-id'),
                    success: function (data) {
                        if (data && data.Code == 0) {
                            smoothBoxBlock('<div>' + data.Result + '</div>', pak);
                            pak.click(function () { smoothBoxBlock(null, pak); pak.hide('slow', function () { pak.remove() }) });
                        }
                    },
                    error: function (jx, message, ex) {
                        ajaxErrorPopupHandler(jx, message, ex);
                        smoothBoxBlock(null, pak);
                    }
                });
            }
        });
        $pricingPackage.find('.edit-panel').each(function () {
            var editPanel = $(this);
            var pw = editPanel.closest('.pricingwizard');
            var hasEdit = editPanel.children().length == 0;
            pw.find('.add-package').toggle(hasEdit);
            editPanel.toggle(!hasEdit)
                    .on('click', '.cancel-action', function () {
                        editPanel.hide('slow', function () {
                            $(this).closest('.pricingwizard').find('.add-package').show('fast');
                            $(this).children().remove();
                        });
                    });
        });
        $pricingPackage.on('ajaxSuccessPost', '.edit-panel form', function (e, data) {
            if (data.Code == 0) {
                var pw = $(this).closest('.pricingwizard');
                pw.find('.your-packages').show('slow').reload();
            }
        }).on('ajaxSuccessPostMessageClosed', '.edit-panel .ajax-box', function (e, data) {
            $(this).closest('.edit-panel').hide('slow', function () {
                $(this).closest('.pricingwizard').find('.add-package').show('fast');
                $(this).children().remove()
            });
        });
    })($('.pricingwizard.package-pricing-type'));

    /**==================
    * Background check 
    */
    $('.position-background-check-tab').on('click', '.position-background-check .buy-action', function () {
        var bcid = $(this).data('background-check-id');
        var posID = $(this).data('position-id');
        var cont = $(this).closest('.position-background-check');
        cont.data('position-id', posID);
        var ps1 = cont.find('.popup.buy-step-1');
        var f = ps1.find('form');
        f.find('[name=BackgroundCheckID]').val(bcid);
        f.find('.main-action').val($(this).text());

        smoothBoxBlock(ps1, cont, 'background-check');
        return false;
    })
    .on('click', '.position-background-check .close-popup-action', function () {
        var cont = $(this).closest('.position-background-check');
        var posID = cont.data('position-id');
        smoothBoxBlock(null, cont);
        if ($(this).closest('.popup').is('.buy-step-2'))
            cont.closest('.tab-body').reload(UrlUtil.LangPath + 'Dashboard/$PositionsBackgroundCheck/?PositionID=' + posID);
        return false;
    })
    .on('ajaxSuccessPost', '.popup.buy-step-1 form', function (e, data) {
        if (data.Code == 101) {
            var cont = $(this).closest('.position-background-check');
            smoothBoxBlock(null, cont);
            var ps2 = cont.find('.popup.buy-step-2');
            smoothBoxBlock(ps2, cont, 'background-check');
        }
    });
});

function openBookingInTab(bookingRequestID, bookingID, tabTitle, openReview, extraData) {
    var bid = bookingID;
    var brid = bookingRequestID;
    var data = extraData || {};
    data.BookingRequestID = brid;
    var url = "Booking/$BookingRequestDetails/";
    var tabId = 'bookingRequestID' + brid;

    if (bid && bid > 0) {
        url = "Booking/$BookingDetails/";
        data.BookingID = bid;
        tabId = 'bookingID' + bid;

        if (openReview === true) {
            url = "Booking/$BookingReview/";
            tabId += "_Review";
            if (data.AsUserID)
                tabId += "_AsOtherUser";
        }
    }

    var tab = TabbedUX.createTab('#main', tabId, tabTitle);
    if (tab) {
        TabbedUX.focusTab(tab);

        var $tab = $(tab);

        // Set the data-source-url of the new tab to the to be loaded url to enable jQuery.reload()
        $tab.data('source-url', UrlUtil.LangPath + url);

        var ctx = { form: $tab, boxIsContainer: true };

        // Loading, with retard
        ctx.loadingtimer = setTimeout(function () {
            $tab.block(loadingBlock);
        }, gLoadingRetard);

        // Do the Ajax post
        $.ajax({
            url: UrlUtil.LangPath + url,
            data: data,
            context: ctx,
            success: ajaxFormsSuccessHandler,
            error: ajaxErrorPopupHandler,
            complete: function () {
                $.proxy(ajaxFormsCompleteHandler, this)();

                // Updating the tab title, because when is loaded by URL, the title is the ID,
                // here is setted something more usable:
                TabbedUX.setTabTitle($tab, $tab.find('.user-public-name:eq(0)').text());
            }
        });
    } else
    // Tab couln't be created, already must exist, focus it
        TabbedUX.focusTab('#' + tabId);
}
function openMessageThreadInTab(threadId, tabTitle, highlightMessageId) {
    var tid = threadId;
    var data = { MessageThreadID: tid };
    var url = "Messaging/$MessageThread/";
    var tabId = 'messageThreadID-' + tid;

    var tab = TabbedUX.createTab('#main', tabId, tabTitle);
    if (tab) {
        TabbedUX.focusTab(tab);

        var $tab = $(tab);
        var ctx = { form: $tab, boxIsContainer: true };

        // Loading, with retard
        ctx.loadingtimer = setTimeout(function () {
            $tab.block(loadingBlock);
        }, gLoadingRetard);

        // Do the Ajax post
        $.ajax({
            url: UrlUtil.LangPath + url,
            data: data,
            context: ctx,
            success: ajaxFormsSuccessHandler,
            error: ajaxErrorPopupHandler,
            complete: function () {
                $.proxy(ajaxFormsCompleteHandler, this)();

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

function initPositionPhotos() {
    $('form.positionphotos').each(function () {
        var form = $(this);
        // Prepare sortable script
        $(".positionphotos-gallery > ol", form).sortable({
            placeholder: "ui-state-highlight",
            update: function () {
                // Get photo order, a comma separated value of items IDs
                var order = $(this).sortable("toArray").toString();
                // Set order in the form element, to be sent later with the form
                $(this).closest('form').find('[name=gallery-order]').val(order);
            }
        });

        // Set primary photo to be edited
        var editPanel = $('.positionphotos-edit', form);
        // Look for a selected photo in the list
        var selected = $('.positionphotos-gallery > ol > li.selected', form);
        if (selected != null && selected.length > 0) {
            var selImg = selected.find('img');
            // Moving selected to be edit panel
            var photoID = selected.attr('id').match(/^UserPhoto-(\d+)$/)[1];
            editPanel.find('[name=PhotoID]').val(photoID);
            editPanel.find('img').attr('src', selImg.attr('src'));
            editPanel.find('[name=photo-caption]').val(selImg.attr('alt'));
            var isPrimaryValue = selected.hasClass('is-primary-photo') ? 'True' : 'False';
            editPanel.find('[name=is-primary-photo]').prop('checked', false);
            editPanel.find('[name=is-primary-photo][value=' + isPrimaryValue + ']').prop('checked', true);
        } else {
            if (form.find('.positionphotos-gallery > ol > li').length == 0) {
                smoothBoxBlock(form.find('.no-photos'), editPanel);
            } else {
                smoothBoxBlock(form.find('.no-primary-photo'), editPanel);
            }
        }
    });
}
function openChangeBookingStateForm(bookingID, button) {
    var tab = button.closest('.tab-body');
    var editPanel = $('.change-booking-status.edit-popup', tab);
    var bookingID = button.data('booking-id');
    var url = editPanel.data('source-url').replace('BookingID=0', 'BookingID=' + bookingID);
    editPanel.reload(url);
    editPanel.show();
}