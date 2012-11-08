/* Author: Loconomics */
// OUR namespace (abbreviated Loconomics)
var LC = window['LC'] || {};

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
    /* Print only hours and minutes in the common time of the day format
        (AM/PM in US, 24h on ES)
    */
    this.toDayTimeString = function () {
        switch ($('html').attr('lang')) {
            case 'es':
                var h = this.hour.toString();
                if (h.length == 1)
                    h = '0' + h;
                var m = this.minute.toString();
                if (m.length == 1)
                    m = '0' + m;
                return h + lcTime.delimiter + m;
            case 'en':
            default:
                var h = this.hour.toString();
                var sufix = ' AM';
                if (h >= 12 && h < 24)
                    sufix = ' PM';
                if (h > 12)
                    h = h % 12;
                if (h == 0)
                    h = 12;
                var m = this.minute.toString();
                if (m.length == 1)
                    m = '0' + m;
                return h + lcTime.delimiter + m + sufix;
        }
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

LC.setupScheduleCalendar = function () {
    var $scheduleStep = $('#booking-schedule')
    .on('click', '#weekDaySelector .week-slider', function () {
        var $week = $('#weekDaySelector');
        var date = new Date($week.data('date'));
        switch (this.getAttribute('href')) {
            case '#previous-week':
                date.setDate(date.getDate() - 7);
                break;
            case '#next-week':
                date.setDate(date.getDate() + 7);
                break;
        }
        var strdate = date.getFullYear().toString() + '-' + (date.getMonth() + 1).toString() + '-' + date.getDate().toString();
        $week.reload(UrlUtil.LangPath + "Booking/$ScheduleCalendarElements/WeekDaySelector/" +
            encodeURIComponent(strdate) + '/');
        $week.data('date', date);
        return false;
    })
    .on('click', '#weekDaySelector .day-selection-action', function () {
        var $day = $('#dayHoursSelector');
        var date = new Date($(this).data('date'));
        var strdate = date.getFullYear().toString() + '-' + (date.getMonth() + 1).toString() + '-' + date.getDate().toString();
        var hours = $day.data('duration-hours');
        var userid = $day.data('user-id');
        $day.reload(UrlUtil.LangPath + "Booking/$ScheduleCalendarElements/DayHoursSelector/" +
            encodeURIComponent(strdate) + '/' + hours + '/' + userid + '/');
        $day.data('date', date);
        return false;
    })
    .on('change', '#dayHoursSelector select.choice-selector', function () {
        var $s = $(this), v = $s.val();
        if (v) {
            // Get row date and time
            var $row = $s.closest('tr');
            var $table = $row.closest('table');
            var start = $row.find('.start').text();
            var end = $row.find('.end').text();
            var date = $table.data('date');
            var dateshowed = $table.find('caption').text();

            // Show date and time
            var choice = $(this).closest('form').find('.selected-schedule').find('.' + v + '-choice');
            choice.find('.date').text(date);
            choice.find('.date-showed').text(dateshowed);
            choice.find('span.start-time').text(start);
            choice.find('span.end-time').text(end);
            choice.find('input.start-time').val(start);
            choice.find('input.end-time').val(end);
        }
    });
};

$(document).ready(function () {
    // Setup Schedule step:
    $('#schedule').on('endLoadWizardStep', function () {
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

                LC.setupScheduleCalendar();
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
        LC.setupScheduleCalendar();
    });
    $('body').on('change', '.start-time :input', function () {
        // a var serviceDurationHours must be created by the $Schedule page
        if (typeof (serviceDurationHours) != 'undefined') {
            // our minimum time interval is half hours, .5, round upper to that
            var rest = serviceDurationHours % .5;
            if (rest > 0)
                serviceDurationHours = serviceDurationHours + 0.5 - rest;
            var $t = $(this);
            var starttime = lcTime.parse($t.val());
            $t.closest('fieldset').find('.end-time :input').val(starttime.addHours(serviceDurationHours).toDayTimeString());
        }
    })
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
            var popupContainer = $t.closest('.calendar').data('popup-container');
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

    // Load payment content on step change:
    $('#payment').bind('endLoadWizardStep', function () {
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