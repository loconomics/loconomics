function bookingChangeLocation() {
    var sel = $(this);
    // :hidden selectors is a hack because jQuery doesn't
    // hide elements that are inside a hidden parent.
    if (sel.val() == "0") {
        sel.siblings('.enter-new-location').show('fast');
    } else {
        sel.siblings('.enter-new-location, .enter-new-location:hidden').hide('fast');
    }
}
function lcTime (hour, minute, second) {
    this.hour = Math.floor(parseFloat(hour || 0));
    this.minute = Math.floor(parseFloat(minute || 0));
    this.second = Math.floor(parseFloat(second || 0));

    this.toString = function () {
        var h = this.hour.toString();
        if (h.length == 1)
            h = '0' + h;
        var m = this.minute.toString();
        if (m.length == 1)
            m = '0' + m;
        var s = this.second.toString();
        if (s.length == 1)
            s = '0' + s;
        return h + lcTime.delimiter + m + lcTime.delimiter + s;
    };
    this.addHours = function (hours) {
        this.addMinutes(hours * 60);
        return this;
    };
    this.addMinutes = function (minutes) {
        var m = this.hour * 60 + this.minute;
        var ntime = minutes + m;
        this.hour = Math.floor(ntime / 60);
        this.minute = ntime % 60;
        return this;
    };
};
// For spanish and english works good ':' as delimiter
lcTime.delimiter = ':';
lcTime.parse = function (strtime) {
    strtime = (strtime || '').split(this.delimiter);
    if (strtime.length > 1) {
        return new lcTime(strtime[0], strtime[1], (strtime.length > 2 ? strtime[2] : 0));
    }
    return null;
};

$(document).ready(function () {
    // Check when location changes:
    $('body')
    .on('change', '.select-location', bookingChangeLocation)
    .on('click', '.availability-calendar .datetimes > li', function () {
        var $t = $(this);
        if ($t.hasClass('free') || $t.hasClass('tentative')) {
            // Recognizing selected day and time
            var pos = $t.index() + 1; // base 1
            var row = Math.ceil(pos / 7) - 1; // base 0
            var col = (pos % 7) - 1; // base 0
            // For selDay, first we get the first-week-day from calendar and then calculate the selected:
            var selDay = new Date($t.closest('.calendar').data('showed-date'));
            selDay.setDate(selDay.getDate() + col);
            var selHour = new lcTime(7 + (row / 2), (row % 2 == 1 ? 30 : 0), 0);
            //console.log('Selected date-time: ' + selDay.getFullYear() + '/' + (selDay.getMonth() + 1) + '/' + selDay.getDate() + " " + selHour);
            // Setting in the form the date and time
            var $f = $t.closest('.tab-body').find('form.schedule');
            var fields = preferredF = getSelectDateTimeFieldsFor('preferred-option', $f);
            if (fields.date.val())
                fields = getSelectDateTimeFieldsFor('alternative-option-1', $f);
            if (fields.date.val())
                fields = getSelectDateTimeFieldsFor('alternative-option-2', $f);
            if (fields.date.val())
                fields = preferredF;
            fields.date.val($.datepicker.formatDate($.datepicker._defaults.dateFormat, selDay));
            fields.startTime.val(selHour.toString())
                .change(); // Force change event to auto-update endTime

            // If is in a popup:
            var popupContainer = $t.closest('.calendar').data('popup-container'); console.log(popupContainer);
            if (popupContainer)
                smoothBoxBlock(null, popupContainer);
        }

        // dateSet can be: preferred-option, alternative-option-1, alternative-option-2
        function getSelectDateTimeFieldsFor(dateSet, $container) {
            $container = $container.find('.select-date-time.' + dateSet);
            return {
                date: $container.find('.date :input'),
                startTime: $container.find('.start-time :input'),
                endTime: $container.find('.end-time :input')
            };
        }
    });

    $('#booking-schedule').on('endLoadWizardStep', function () {
        // Getting the tab content for payment that is not loaded at the start
        var tab = $('#schedule');

        // Loading, with retard
        var loadingtimer = setTimeout(function () {
            tab.block(loadingBlock);
        }, gLoadingRetard);


        $.ajax({
            // Request $Payment partial page, with all the original url parameters
            url: UrlUtil.LangPath + "Booking/$Schedule/" + location.search,
            type: 'GET',
            success: function (data, text, jx) {
                // load tab content
                tab.html(data);

                // Execute first time when showing the step
                $.proxy(bookingChangeLocation, $('.select-location'))();

                applyDatePicker(tab);
            },
            error: ajaxErrorPopupHandler,
            complete: function () {
                // Disable loading
                clearTimeout(loadingtimer);
                // Unblock
                tab.unblock();
            }
        });
    }).on('reloadedHtmlWizardStep', function () {
        // Execute after reloading html of this step
        $.proxy(bookingChangeLocation, $('.select-location'))();
    }).on('change', '.start-time :input', function () {
        // a var serviceDurationHours must be created by the $Schedule page
        if (typeof (serviceDurationHours) != 'undefined') {
            // our minimum time interval is half hours, .5, round upper to that
            var rest = serviceDurationHours % .5;
            if (rest > 0)
                serviceDurationHours = serviceDurationHours + 0.5 - rest;
            var $t = $(this);
            var starttime = lcTime.parse($t.val());
            $t.closest('fieldset').find('.end-time :input').val(starttime.addHours(serviceDurationHours).toString());
        }
    });

    // Load payment content on step change:
    $('#booking-payment').bind('endLoadWizardStep', function () {
        // Getting the tab content for payment that is not loaded at the start
        var paymentTab = $('#payment');

        // Loading, with retard
        var loadingtimer = setTimeout(function () {
            paymentTab.block(loadingBlock);
        }, gLoadingRetard);

        $.ajax({
            // Request $Payment partial page, with all the original url parameters
            url: UrlUtil.LangPath + "Booking/$Payment/" + location.search,
            type: 'GET',
            success: function (data, text, jx) {
                // load tab content
                paymentTab.html(data);
            },
            error: ajaxErrorPopupHandler,
            complete: function () {
                // Disable loading
                clearTimeout(loadingtimer);
                // Unblock
                paymentTab.unblock();
            }
        });
    });
});