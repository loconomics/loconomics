/**
  AvailabilityCalendar Module
**/
var $ = require('jquery'),
  dateISO = require('LC/dateISO8601');

var classes = {
  calendar: 'AvailabilityCalendar',
  loading: 'is-loading',
  preloading: 'is-preloading',
  currentWeek: 'is-currentWeek',
  actions: 'AvailabilityCalendar-actions',
  prevAction: 'Actions-prev',
  nextAction: 'Actions-next',
  days: 'AvailabilityCalendar-days',
  slots: 'AvailabilityCalendar-slots',
  slotHour: 'AvailabilityCalendar-hour',
  slotStatusPrefix: 'is-',
  legend: 'AvailabilityCalendar-legend',
  legendAvailable: 'AvailabilityCalendar-legend-available',
  legendUnavailable: 'AvailabilityCalendar-legend-unavailable'
};

var statusTypes = ['unavailable', 'available'];

var defaults = {
  classes: classes,
  dataSourceUrl: '/calendar/get-availability/',
  texts: {
    abbrWeekDays: [
      'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
    ],
    today: 'Today',
    // Allowed special values: M:month, D:day
    abbrDateFormat: 'M/D'
  }
};

function on(selector, options) {
  options = $.extend(true, {}, defaults, options);
  selector = selector || '.' + options.classes.calendar;

  $(selector).each(function () {
    var calendar = $(this);
    var user = calendar.data('calendar-user');
    var dataSourceUrl = calendar.data('source-url') || options.dataSourceUrl;
    var dataSource = calendar.data('source') || {};
    if (typeof(dataSource) == 'string')
      dataSource = JSON.parse(dataSource);

    function fetchData(start, end, preloading) {
      var fetchStateClass = preloading ? options.classes.preloading : options.classes.loading;
      calendar.addClass(fetchStateClass);
      return $.getJSON(dataSourceUrl,
        {
          user: user,
          start: dateISO.datetimeLocal(start, true),
          end: dateISO.datetimeLocal(end, true)
        },
        function(data){
          if (data && data.Code === 0) {
            $.extend(true, dataSource, data.Result);
            calendar.removeClass(fetchStateClass);
          } else {
            // TODO Manage error
            if (console && console.error) console.error('AvailabilityCalendar fetch data error %o', data);
          }
        }
      );
    }

    // Fetch current week
    var start = getFirstWeekDate(new Date()),
        end = getLastWeekDate(new Date());

    var request = fetchData(start, end).done(function(){
      bindData(calendar, dataSource, options, start, end);
      // Prefetching 3 weeks in advance
      request = fetchData(addDays(start, 7), addDays(end, 21), true);
    });
    checkCurrentWeek(calendar, start, options);

    function moveBindRangeInDays(days) {
      var
        start = addDays( calendar.data('calendar-start-date'), days ),
        end = addDays( calendar.data('calendar-end-date'), days );

      // Support for prefetching:
      if (request && request.status != 200) {
        // Wait for the fetch to perform and sets loading to notify user
        calendar.addClass(options.classes.loading);
        request.done(function(){
          moveBindRangeInDays(days);
          calendar.removeClass(options.classes.loading);
        });
        return;
      }

      // Check cache: if there is almost one date in the range
      // without data, we set inCache as false and fetch the data:
      var inCache = true;
      eachDateInRange(start, end, function(date) {
        var datekey = dateISO.dateLocal(date, true);
        if (!dataSource.slots[datekey]) {
          inCache = false;
          return false;
        }
      });

      if (inCache)
        // Just show the data
        bindData(calendar, dataSource, options, start, end);
      else
        // Fetch (download) the data and show on ready:
        fetchData(start, end).done(function(){
          bindData(calendar, dataSource, options, start, end);
        });
    }

    calendar.on('click', '.' + options.classes.prevAction, function prev(){
      moveBindRangeInDays(-7);
    });

    calendar.on('click', '.' + options.classes.nextAction, function next(){
      moveBindRangeInDays(7);
    });
  });
}

function bindData(calendar, dataSource, options, start, end) {
  var slotsContainer = calendar.find('.' + options.classes.slots),
    slots = slotsContainer.find('td');

  // Save the date range being showed in the calendar instance
  calendar.data('calendar-start-date', start);
  calendar.data('calendar-end-date', end);

  checkCurrentWeek(calendar, start, options);

  updateLabels(calendar, options);

  // Remove any previous status class from all slots
  for (var s = 0; s < statusTypes.length; s++) {
    slots.removeClass( options.classes.slotStatusPrefix + statusTypes[s] );
  }

  // Set all slots with default status
  slots.addClass( options.classes.slotStatusPrefix + dataSource.defaultStatus );

  eachDateInRange(start, end, function(date, i) {
    var datekey = dateISO.dateLocal(date, true);
    var dateSlots = dataSource.slots[datekey];
    if (dateSlots) {
      for (s = 0; s < dateSlots.length; s++) {
        var slot = dateSlots[s];
        var slotCell = findSlotCell(slotsContainer, i, slot);
        // Remove default status
        slotCell.removeClass( options.classes.slotStatusPrefix + dataSource.defaultStatus );
        // Adding status class
        slotCell.addClass( options.classes.slotStatusPrefix + dataSource.status );
      }
    }
  });
}

function updateLabels(calendar, options) {
  var start = calendar.data('calendar-start-date'),
      end = calendar.data('calendar-end-date');

  // TODO
  var days = calendar.find('.' + options.classes.days + ' th');
  var today = dateISO.dateLocal(new Date());
  // First cell is empty ('the cross headers cell'), then offset is 1
  var offset = 1;
  eachDateInRange(start, end, function (date, i) {
    var cell = $(days.get(offset + i)),
        sdate = dateISO.dateLocal(date),
        label = sdate;

    if (today == sdate)
      label = options.texts.today;
    else
      label = options.texts.abbrWeekDays[date.getDay()] + ' ' + formatDate(date, options.texts.abbrDateFormat);

    cell.text(label);
  });
}

function findSlotCell(slotsContainer, day, slot) {
  slot = dateISO.parse(slot);
  var
    x = Math.round( slot.getHours() ),
    // Time frames (slots) are 15 minutes divisions
    y = Math.round( slot.getMinutes() / 15 ),
    tr = slotsContainer.children(':eq(' + Math.round( x * 4 + y ) + ')' );
  
  // Slot cell for o'clock hours is at 1 position offset
  // because of the row-head cell
  var dayOffset = ( y === 0 ? day + 1 : day );
  return tr.children(':eq(' + dayOffset + ')');
}

/**
  Mark calendar as current-week and disable prev button,
  or remove the mark and enable it if is not.
**/
function checkCurrentWeek(calendar, date, options) {
    var yep = isInCurrentWeek(date);
    calendar.toggleClass(options.classes.currentWeek, yep);
    calendar.find('.' + options.classes.prevAction).prop('disabled', yep);
  }

function getFirstWeekDate(date) {
  var d = new Date(date);
  d.setDate( d.getDate() - d.getDay() );
  return d;
}

function getLastWeekDate(date) {
  var d = new Date(date);
  d.setDate( d.getDate() + (7 - d.getDay()) );
  return d;
}

function isInCurrentWeek(date) {
  return dateISO.dateLocal(getFirstWeekDate(date)) == dateISO.dateLocal(getFirstWeekDate(new Date()));
}

function addDays(date, days) {
  var d = new Date(date);
  d.setDate( d.getDate() + days );
  return d;
}

function eachDateInRange(start, end, fn) {
  if (!fn.call) throw new Error('fn must be a function or "call"able object');
  var date = new Date(start);
  var i = 0, ret;
  while (date <= end) {
    ret = fn.call(fn, date, i);
    // Allow fn to cancel the loop with strict 'false'
    if (ret === false)
      break;
    date.setDate(date.getDate() + 1);
    i++;
  }
}

/** Very simple custom-format function to allow 
  l10n of texts.
  Cover cases:
  - M for month
  - D for day
**/
function formatDate(date, format) {
  var s = format,
      M = date.getMonth() + 1,
      D = date.getDate();
  s = s.replace(/M/g, M);
  s = s.replace(/D/g, D);
  return s;
}

// Public API:
exports.defaults = defaults;
exports.on = on;