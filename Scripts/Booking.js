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

LC.showDateHours = function (date) {
    // Load date hours:
    var $day = $('#dayHoursSelector');
    var strdate = LC.dateToInterchangleString(date);
    var hours = $day.data('duration-hours');
    var userid = $day.data('user-id');
    $day.reload(UrlUtil.LangPath + "Booking/$ScheduleCalendarElements/DayHoursSelector/" +
            encodeURIComponent(strdate) + '/' + hours + '/' + userid + '/');
    $day.data('date', date);
};
LC.showWeek = function (date) {
    var $week = $('#weekDaySelector');

    if (/(previous|next)/.test(date.toString())) {
        var x = date;
        date = new Date($week.data('date'));
        if (/previous/.test(x))
            date.setDate(date.getDate() - 7);
        else if (/next/.test(x))
            date.setDate(date.getDate() + 7);
    }

    var strdate = LC.dateToInterchangleString(date);
    $week.reload(UrlUtil.LangPath + "Booking/$ScheduleCalendarElements/WeekDaySelector/" +
        encodeURIComponent(strdate) + '/',
        function () { LC.selectWeekDay(date); LC.showDateHours(date); });
    $week.data('date', date);
};
LC.selectWeekDay = function (date) {
    var $week = $('#weekDaySelector');
    // Mark selected day in calendar
    $week.find('.day-selection-action').removeClass('current')
    .filter(function () {
        var elDate = new Date($(this).data('date'));
        return (elDate.toDateString() == date.toDateString());
    }).addClass('current');
};
LC.setupScheduleCalendar = function () {
    var $scheduleStep = $('#booking-schedule')
    .on('click', '#weekDaySelector .week-slider', function () {

        LC.showWeek(this.getAttribute('href').substring(1));

        return false;
    })
    .on('click', '#weekDaySelector .day-selection-action', function () {
        var date = new Date($(this).data('date'));

        LC.showDateHours(date);
        LC.selectWeekDay(date);

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
            var date = new Date($table.data('date'));
            var dateshowed = $table.find('caption').text();

            // Show date and time
            var choice = $(this).closest('form').find('.selected-schedule').find('.' + v + '-choice');
            choice.find('span.date-showed').text(dateshowed);
            choice.find('span.start-time').text(start);
            choice.find('span.end-time').text(end);
            choice.find('input.date').val($.datepicker.formatDate('yy-mm-dd', date));
            choice.find('input.start-time').val(start);
            choice.find('input.end-time').val(end);

            // Others Select with this same option selected must be reset:
            $s.closest('tr').siblings().find('option[value=' + v + ']:selected').closest('select').val('');
        }
    });

    // Select current day in week selector
    LC.selectWeekDay(new Date($('#dayHoursSelector').data('date')));
};

LC.initScheduleStep = function () {
    var tab = $('#schedule');

    // Execute first time when showing the step
    $.proxy(bookingChangeLocation, $('.select-location'))();
    $('.select-location').change(bookingChangeLocation);

    applyDatePicker(tab);

    // Read current hidden date to be set in show date (previous apply datepicker options)
    var date = $('#hideDate').val();

    $("#showDate")
    .datepicker('setDate', date)
    .datepicker('option', 'dateFormat', 'DD, M d, yy')
    .datepicker('option', 'altField', $('#hideDate'))
    .datepicker('option', 'altFormat', $.datepicker._defaults.dateFormat)
    .datepicker('option', 'numberOfMonths', 2)
    .datepicker('option', 'onSelect', function () {
        var date = new Date($('#hideDate').val());
        LC.showDateHours(date);
        LC.showWeek(date);
    });

    LC.setupScheduleCalendar();
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

                LC.initScheduleStep();
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
        LC.initScheduleStep();
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
