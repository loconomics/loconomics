
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
    /* Special urls */
    function checkSpecialURIs() {
        if (location.hash == '#!pricing') {
            // go to the first position pricing tab
            if (/\/Dashboard\/Positions\//i.test(location.pathname)) {
                // Find first position, pricing tab
                var u = $('#main.tabbed > .tabs > li:eq(0) > a').attr('href') + '-pricing';
                window.location = u;
            } else {
                // Redirect to positions page
                window.location = LcUrl.LangPath + 'Dashboard/Positions/#!pricing';
            }
        }
    }
    checkSpecialURIs();
    if ($.fn.hashchange)
        $(window).hashchange(checkSpecialURIs);

    /*
    * Delete position
    */
    $('.delete-position a').click(function () {
        var c = $(this).closest('.tab-body');
        c.on('click', '.cancel-action', function () {
            smoothBoxBlock(null, c);
        });
        var lres = c.find('.position-ressources');
        c.on('ajaxSuccessPostMessageClosed', '.ajax-box', function () {
            window.location.reload();
        });
        var b = smoothBoxBlock(lres.children('.delete-message-confirm').clone(), c);
        if (b) {
            $('html,body').stop(true, true).animate({ scrollTop: b.offset().top }, 500, null);
        }
        return false;
    });
    /**
    * Change position state
    */
    (function () {

        function changeState($t, loadingMessageClass, fromState, toState, page) {
            var pos = $t.closest('.position-tab');
            var posID = pos.data('position-id');
            pos
            .on('ajaxSuccessPost', function (event, data, t, j, ctx) {
                if (data && data.Code > 100) {
                    if (data.Code == 101) {
                        pos.find('.position-state.on-off-switch')
                        .removeClass(fromState)
                        .addClass(toState);
                    } else {
                        // Show message:
                        ctx.autoUnblockLoading = false;
                        var msg = $('<div class="info"/>').append(data.Result.Message);
                        smoothBoxBlock(msg, pos, 'position-state-change', { closable: true, center: false, autofocus: false });
                    }
                }
            })
            .reload({
                url: LcUrl.LangPath + 'Dashboard/' + page + '/?PositionID=' + posID,
                autofocus: false
            });
        }

        $('.dashboard').on('click', '.position-state.on-off-switch.off', function () {
            changeState($(this), '.enabling-position-profile',
                'off', 'on',
                '$ReactivatePosition');
        })
        .on('click', '.position-state.on-off-switch.on', function () {
            changeState($(this), '.disabling-position-profile',
                'on', 'off',
                '$DeactivatePosition');
        });
    })();

    /*
    * Change Photo
    */
    $('#changephoto').click(function () {
        popup(LcUrl.LangPath + 'Dashboard/ChangePhoto/', { width: 240, height: 240 });
        return false;
    });
    /*
    * Modify position photos: Upload Photo, Edit, Delete
    */
    initPositionPhotos();
    $('.positionphotos').parent().on('click', '.positionphotos-tools-upload > a', function () {
        var posID = $(this).closest('form').find('input[name=PositionID]').val();
        popup(LcUrl.LangPath + 'Dashboard/UploadPhoto/?PositionID=' + posID, 'small');
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

    /*
    * Position Services
    */
    $('.positionservices').each(function () {
        var f = $(this);
        f.data('customValidation', {
            validate: function () {
                var valid = true, lastValid = true;
                var v = f.find('.validation-summary-errors, .validation-summary-valid');
                f.find('.required-attribute-category').each(function () {
                    var fs = $(this);
                    var cat = fs.children('legend').text();
                    // What type of validation apply?
                    if (fs.is('.validation-select-one'))
                    // if the cat is a 'validation-select-one', a 'select' element with a 'positive'
                    // :selected value must be checked
                        lastValid = !!(fs.find('option:selected').val());
                    else
                    // Otherwise, look for 'almost one' checked values:
                        lastValid = (fs.find('input:checked').length > 0);

                    if (!lastValid) {
                        valid = false;
                        fs.addClass('group-validation-error');
                        var err = LC.getText('required-attribute-category-error', cat);
                        if (v.find('li[title="' + escapeJQuerySelectorValue(cat) + '"]').length == 0)
                            v.children('ul').append($('<li/>').text(err).attr('title', cat));
                    } else {
                        fs.removeClass('group-validation-error');
                        v.find('li[title="' + escapeJQuerySelectorValue(cat) + '"]').remove();
                    }
                });

                if (valid) {
                    v.removeClass('validation-summary-errors').addClass('validation-summary-valid');
                } else {
                    v.addClass('validation-summary-errors').removeClass('validation-summary-valid');
                }
                return valid;
            }
        });
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
                $t.closest('.bookings-list').find('.user-public-name:eq(0) > .first-name').text()
            );
    });
    /*
    * Booking actions
    */
    $('body').delegate('.booking-action', 'click', performBookingRequestAction);
    /*
    * Booking Request actions
    */
    function performBookingRequestAction(e, confirmed) {
        var $t = $(this);
        var brId = $t.data('booking-request-id');
        var $tab = $t.closest('.tab-body');
        var options = { autoUnblockLoading: true };
        var data = { BookingRequestID: brId };
        var bID = $t.data('booking-id');
        if (bID)
            data.BookingID = bID;

        var url;
        if ($t.hasClass('button-confirm-datetime')) {
            data.ConfirmedDateType = $(this).data('date-type');
            url = 'Booking/$ConfirmBookingRequest/';
        } else if ($t.hasClass('button-decline-booking')) {
            url = 'Booking/$DeclineBookingRequest/';
        } else if ($t.hasClass('button-cancel-booking')) {
            if (!confirmed) {
                // Check if need confirmation
                var confirmbox = $($t.data('must-confirm'));
                if (confirmbox.length == 1) {
                    confirmbox = confirmbox.clone();
                    if (confirmbox.length == 1)
                        smoothBoxBlock(confirmbox, document, null, { closable: true, center: true });

                    confirmbox.on('click', 'a', function () {
                        var l = $(this).attr('href');
                        switch (l) {
                            case '#confirm-yes':
                                $.proxy(performBookingRequestAction, $t)(null, true);
                                break;
                        }
                        smoothBoxBlock(null, document);

                        return false;
                    });
                    // Wait for anwser:
                    return;
                }
            }
            if (bID)
                url = 'Booking/$CancelBooking/';
            else
                url = 'Booking/$CancelBookingRequest/';
        } else if ($t.hasClass('propose-booking-times-action')) {
            LC.messagePopup('Not Implemented Yet :-(');
            return;
        } else {
            // Bad handler:
            return;
        }
        var ctx = { form: $tab, box: $tab, boxIsContainer: true };

        // Loading, with retard
        ctx.loadingtimer = setTimeout(function () {
            $tab.block(loadingBlock);
        }, gLoadingRetard);

        // Do the Ajax post
        $.ajax({
            url: LcUrl.LangPath + url,
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
    };
    $('body')
    .on('click', '.booking-request-action', performBookingRequestAction)
    .on('click', '.review-booking-action', function () {
        var $t = $(this);
        var extraData = {};
        var asUserID = $t.data('as-user-id');
        if (asUserID)
            extraData = { AsUserID: asUserID };
        openBookingInTab(
            0,
            $t.data('booking-id'),
            $t.closest('.booking').find('.user-public-name:eq(0) > .first-name').text(),
            true,
            extraData
        );
    })
    .on('click', '.booking-review .open-booking-action', function () {
        var $t = $(this);
        openBookingInTab(
            0,
            $t.data('booking-id'),
            $t.closest('.booking-review').find('.user-public-name:eq(0) > .first-name').text()
        );
    });

    /*===============
    * Admin bookings
    */
    $('#admin-bookings').on('click', '.change-booking-status .set-status, .change-booking-status .see-payment-data', function () {
        var $t = $(this);
        var form = $t.closest('form');
        var h = form.find('.change-booking-state-action');
        h.val($t.val());
        if ($t.hasClass('set-status'))
            h.attr('name', 'change-booking-status-id');
        else if ($t.hasClass('see-payment-data'))
            h.attr('name', 'see-payment-data');
        form.submit();
    })
    .on('ajaxSuccessPostMessageClosed', '.change-booking-status-form', function (e, data) {
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
                $t.closest('.items-list').find('.user-public-name:eq(0) > .first-name').text()
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
    (function ($positionslocations) {
        // Fast quick
        if ($positionslocations.length == 0) return;

        $positionslocations.each(function () {
            var $locationsPanel = $(this);

            var ep = $locationsPanel.children('.edit-panel');
            var vp = $locationsPanel.children('.view-panel');

            vp.on('click', '.addlocation', function () {
                // We read the data-source-url attribute to get the Default value, with LocationID=0, instead the last reload value:
                ep.show().reload(ep.attr('data-source-url') + '&' + $(this).data('extra-query'));
                // Hide view panel on edit
                vp.hide('fast');
                return false;
            })
            .on('click', '.address .edit', function () {
                // We read the data-source-url attribute to get the Default value, and we replace LocationID=0 with the clicked location-id data:
                ep.show().reload(ep.attr('data-source-url').replace('LocationID=0', 'LocationID=' + $(this).closest('.address').data('location-id')));
                // Hide view panel on edit
                vp.hide('fast');
                return false;
            }).on('click', '.address .delete', function () {
                var res = vp.find('.lc-ressources');
                var loc = $(this).closest('.address');
                if (confirm(res.children('.confirm-delete-location-message').text())) {
                    smoothBoxBlock(res.children('.delete-location-loading-message'), loc);
                    var luse = loc.closest('.locations-set').data('location-use');
                    $.ajax({
                        url: ep.attr('data-source-url').replace('LocationID=0', 'LocationID=' + loc.data('location-id')) + '&action=delete&use=' + luse,
                        //LcUrl.LangPath + 'Dashboard/$PositionsLocationEdit/?action=delete&LocationID=' + loc.data('location-id'),
                        success: function (data) {
                            if (data && data.Code == 0) {
                                smoothBoxBlock('<div>' + data.Result + '</div>', loc);
                                loc.click(function () {
                                    smoothBoxBlock(null, loc);
                                    loc.hide('slow', function () { loc.remove() });
                                    // Show again addlocation button (only is hide on travel locations)
                                    vp.find('.positionlocations-itravel .addlocation').removeClass('hidden');
                                });
                            }
                        },
                        error: function (jx, message, ex) {
                            ajaxErrorPopupHandler(jx, message, ex);
                            smoothBoxBlock(null, loc);
                        }
                    });
                }
                return false;
            });
            function closeAndClearEditPanel() {
                ep.hide('slow', function () {
                    // Remove form to avoid a 'flickering cached data' effect next time is showed:
                    ep.children().remove()
                });
                // Show again view panel after edit
                vp.show('fast');
                return false;
            }
            ep.on('click', '.cancel-action', closeAndClearEditPanel)
            .on('ajaxSuccessPost', 'form', function (e, data) {
                if (data.Code == 0 || data.Code == 5 || data.Code == 6)
                    vp.show('fast', function () { vp.reload({ autofocus: true }) });
                if (data.Code == 5)
                    setTimeout(closeAndClearEditPanel, 1500);
            })
            .on('ajaxSuccessPostMessageClosed', '.ajax-box', closeAndClearEditPanel);
        });
    })($('.positionlocations'));

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
    function setup_license_request_form($selects) {
        $selects.each(function () {
            var $t = $(this);
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
        });
    }
    $('body').on('change', '.license-type-selector > select', function () {
        setup_license_request_form($(this));
    }).on('ajaxFormReturnedHtml', 'form.positionlicenses', function () {
        // Listen the form.ajax event about returning html after post the form:
        setup_license_request_form($(this).find('.license-type-selector > select'));
    }).on('ajaxSuccessPostMessageClosed', 'form.positionlicenses', function () {
        // Reloading the licenses page after succesful post, to show registered request and reset saved form:
        var c = $(this).closest('.position-licenses-container');
        var posID = c.data('position-id');
        c.closest('.tab-body').reload(LcUrl.LangPath + '$Dashboard/$PositionsLicenses/?PositionID=' + posID);
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
    *= .show-more-attributes
    */
    // Handler for 'show-more-attributes' button (used only on edit a package)
    $(document).on('click', '.show-more-attributes', function () {
        var $t = $(this);
        var atts = $t.siblings('.services-not-checked');
        if (atts.is(':visible')) {
            $t.text($t.data('show-text'));
            atts.stop().hide('fast');
        } else {
            $t.text($t.data('hide-text'));
            atts.stop().show('fast');
        }
        return false;
    });

    /*==========================
    * Provider Pricing Types
    * multi-pricing, package-based
    */
    (function () {
        // Handler for: Not to state price rate and price rate fields
        $('.dashboard').on('change', '.provider-pricing-types [name=no-price-rate]', function () {
            var $t = $(this),
                f = $t.closest('form'),
                pr = f.find('[name=price-rate],[name=price-rate-unit]');
            pr.prop('disabled', $t.prop('checked'));
        });
        $('.dashboard [name=no-price-rate]').change();

        // Sliders on Housekeeper price:
        LC.initProviderPackageSliders = function () {
            /* Houseekeeper pricing */
            function updateAverage($c, minutes) {
                $c.find('[name=provider-average-time]').val(minutes);
                minutes = parseInt(minutes);
                $c.find('.preview .time').text(LC.smartTime(LC.timeSpan.fromMinutes(minutes)));
            }
            $(".provider-average-time-slider").each(function () {
                var $c = $(this).closest('[data-slider-value]');
                var average = $c.data('slider-value'),
                    step = $c.data('slider-step') || 1;
                if (!average) return;
                var setup = {
                    range: "min",
                    value: average,
                    min: average - 3 * step,
                    max: average + 3 * step,
                    step: step,
                    slide: function (event, ui) {
                        updateAverage($c, ui.value);
                    }
                };
                var slider = $(this).slider(setup);
                $c.find('.provider-average-time').on('click', 'label', function () {
                    var $t = $(this);
                    if ($t.hasClass('below-average-label'))
                        slider.slider('value', setup.min);
                    else if ($t.hasClass('average-label'))
                        slider.slider('value', setup.value);
                    else if ($t.hasClass('above-average-label'))
                        slider.slider('value', setup.max);
                    updateAverage($c, slider.slider('value'));
                });
                // Setup the input field, hidden and with initial value synchronized with slider
                var field = $c.find('[name=provider-average-time]');
                field.hide();
                var currentValue = field.val() || average;
                updateAverage($c, currentValue);
                slider.slider('value', currentValue);
            });
        };
    })();

    /*===========================
    * Cancellation Policy
    */
    (function () {
        // Autosubmit form on changes (its a one choice form)
        $('.dashboard').on('change', '.cancellation-policy-form [name=cancellation-policy]', function () {
            var form = $(this).closest('form');
            form.submit();
        });
        // Sync visualization of cancellation options with the CRUDL viewer -- to don't show it when the editor is open #297
        var $cancelForm = $('.cancellation-policy-form');
        if ($cancelForm.length) {
            $('.dashboard-provider-pricing .crudl-viewer')
            .on('xshow', function (e, opts) {
                LC.showElement($cancelForm, opts);
            })
            .on('xhide', function (e, opts) {
                LC.hideElement($cancelForm, opts);
            });
        }
    })();

    /**==================
    * Background check 
    */
    $('.position-background-check-tab').on('click', '.position-background-check .buy-action', function () {
        var bcid = $(this).data('background-check-id');
        var posID = $(this).data('position-id');
        var cont = $(this).closest('.position-background-check');
        cont.closest('tab-body').data('position-id', posID);
        var ps1 = cont.find('.popup.buy-step-1');
        var f = ps1.find('form');
        f.find('[name=BackgroundCheckID]').val(bcid);
        f.find('.main-action').val($(this).text());

        smoothBoxBlock(ps1, cont, 'background-check');
        return false;
    })
    .on('ajaxFormReturnedHtml', '.popup.buy-step-1 form', function (e, ajaxBox, ajaxForm, jx) {
        var cont = ajaxForm.closest('.position-background-check');
        smoothBoxBlock(null, cont);
        var ps2 = cont.find('.popup.buy-step-2');
        setTimeout(function () {
            smoothBoxBlock(ps2, cont, 'background-check');
        }, 100);
    });

    /**==============
    * Preferences
    */
    $('.preferences').on('click', '.my-account a', function () {
        var c = $(this).closest('.tab-body');
        c.on('click', '.cancel-action', function () {
            smoothBoxBlock(null, c);
        });
        var lres = c.find('.my-account-ressources');
        c.on('ajaxSuccessPostMessageClosed', '.ajax-box', function () {
            window.location.reload();
        });
        var b;
        switch ($(this).attr('href')) {
            case '#delete-my-account':
                b = smoothBoxBlock(lres.children('.delete-message-confirm').clone(), c);
                break;
            case '#deactivate-my-account':
                b = smoothBoxBlock(lres.children('.deactivate-message-confirm').clone(), c);
                break;
            case '#reactivate-my-account':
                b = smoothBoxBlock(lres.children('.reactivate-message-confirm').clone(), c);
                break;
            default:
                return true;
        }
        if (b) {
            $('html,body').stop(true, true).animate({ scrollTop: b.offset().top }, 500, null);
        }
        return false;
    });

    /**================
    * Request Reviews
    **/
    $('.dashboard').on('ajaxSuccessPost', '.positionreviews', function (event, data) {
        $(this).find('[name=clientsemails]').val('')
        .attr('placeholder', data.Result.SuccessMessage || data.Result)
        // support for IE, 'non-placeholder-browsers'
        .placeholder();
    });

    /**================
    * Availability
    **/
    (function () {
        // Refresh provider availability calendar on any focus of the tab #319
        $('#availabilityCalendar').on('tabFocused', function () {
            console.log('focused', $('.availability-calendar .calendar-container', this));
            $('.availability-calendar .calendar-container', this).reload();
        });
        // Setup availability form
        var availcontainer = $('#availability');
        availcontainer.on('change', '.positionavailability-hours select', function () {
            var day = parseInt($(this).data('day-index'));
            if (!isNaN(day)) {
                $(this).closest('form')
                    .find('.positionavailability-days input[value=True][name=availday-' + day + ']')
                    .prop('checked', true);
            }
        });

        availcontainer.on('focus', '.calendar-private-url', function () {
            $(this).select();
        });
        availcontainer.on('click', '.reset-private-url-action', function () {
            var f = $(this).closest('form');
            f.append('<input type="hidden" name="reset-private-url" value="True" />')
                .submit();
        });
        availcontainer.on('change', '.positionavailability .all-days-times input', function () {
            if (this.checked) {
                var $f = $(this).closest('.positionavailability');
                // Set days as 'yes'
                $f.find('.positionavailability-days input[value=True]').prop('checked', true);
                // Set hours as 'all day - 12AM-12AM' (selecting the same option on both selects is fine)
                $f.closest('.positionavailability')
                    .find('.positionavailability-hours select option:first-child')
                    .prop('selected', true);
            }
        });
        availcontainer.on('change', '.positionavailability-hours :input, .positionavailability-days ul :input', function () {
            $(this).closest('form').find('.all-days-times input').prop('checked', false);
        });
    })();

    /**================
    * Alerts
    **/
    (function () {
        $('.dashboard').on('click', '.dashboard-alerts a.dismiss-alert', function () {
            var $t = $(this);
            $t.closest('.dashboard-alerts').reload($t.attr('href'));
            return false;
        });
    })();

    /**================
    * WebsiteTools
    **/
    (function () {
        /** Regenerates the button source-code and preview
        **/
        function regenerateButtonCode() {
            var c = $('.website-tools'),
                size = c.find('[name=size]:checked').val(),
                positionid = c.find('[name=positionid]:checked').val(),
                sourceContainer = c.find('[name=button-source-code]'),
                previewContainer = c.find('.button-preview'),
                buttonTpl = c.find('.button-source-code-template').text(),
                linkTpl = c.find('.link-source-code-template').text(),
                tpl = (size == 'link-only' ? linkTpl : buttonTpl),
                tplVars = $('.button-code');

            previewContainer.html(tpl);
            previewContainer.find('a').attr('href',
                tplVars.data('base-url') + (positionid ? positionid + '/' : ''));
            previewContainer.find('img').attr('src',
                tplVars.data('base-src') + size);
            sourceContainer.val(previewContainer.html().trim());
        }
        var c = $('.website-tools');
        // First generation
        if (c.length > 0) regenerateButtonCode();
        // and on any form change
        c.on('change', 'input', regenerateButtonCode);
    })();
});

function openBookingInTab(bookingRequestID, bookingID, tabTitle, openReview, extraData) {
    var bid = bookingID;
    var brid = bookingRequestID;
    var data = extraData || {};
    data.BookingRequestID = brid;
    var url = "Booking/$BookingDetailsWidget/";
    var tabId = 'bookingRequestID' + brid;

    if (bid && bid > 0) {
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
        $tab.data('source-url', LcUrl.LangPath + url);

        var ctx = { form: $tab, boxIsContainer: true };

        // Loading, with retard
        ctx.loadingtimer = setTimeout(function () {
            $tab.block(loadingBlock);
        }, gLoadingRetard);

        // Do the Ajax post
        $.ajax({
            url: LcUrl.LangPath + url,
            data: data,
            context: ctx,
            success: ajaxFormsSuccessHandler,
            error: ajaxErrorPopupHandler,
            complete: function () {
                $.proxy(ajaxFormsCompleteHandler, this)();

                // Updating the tab title, because when is loaded by URL, the title is the ID,
                // here is setted something more usable:
                TabbedUX.setTabTitle($tab, $tab.find('.user-public-name:eq(0) > .first-name').text());
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
            url: LcUrl.LangPath + url,
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
            // Reset hidden fields manually to avoid browser memory breaking things
            editPanel.find('[name=PhotoID]').val('');
            editPanel.find('[name=photo-caption]').val('');
            editPanel.find('[name=is-primary-photo]').prop('checked', false);
        }
        // Reset delete option
        editPanel.find('[name=delete-photo]').val('False');
    });
}
function openChangeBookingStateForm(bookingID, button) {
    var tab = button.closest('.tab-body');
    var editPanel = $('.change-booking-status.edit-popup', tab);
    var bookingID = button.data('booking-id');
    var url = editPanel.data('source-url').replace('BookingID=0', 'BookingID=' + bookingID);
    editPanel.reload(url);
    editPanel.show();
    editPanel.on('click', '.close-edit-popup', function () {
        editPanel.hide();
    });
}
/* User Photo */
function reloadUserPhoto() {
    // Force image reload, in the parent document! (this is an iframe)
    $('#dashboard-avatar > .avatar').each(function () {
        var src = this.getAttribute('src');
        // avoid cache this time
        src = src + "?v" + new Date();
        this.setAttribute('src', src);
    });
}
function deleteUserPhoto() {
    $.blockUI(loadingBlock);
    jQuery.ajax({
        url: LcUrl.LangUrl + "Dashboard/ChangePhoto/?delete=true",
        method: "GET",
        cache: false,
        dataType: "json",
        success: function (data) {
            if (data.Code == 0)
                $.blockUI(infoBlock(data.Result));
            else
                $.blockUI(errorBlock(data.Result.ErrorMessage));
            $('.blockUI .close-popup').click(function () { $.unblockUI() });
            reloadUserPhoto();
        },
        error: ajaxErrorPopupHandler
    });
}