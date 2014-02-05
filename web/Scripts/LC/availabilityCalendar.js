/**
  AvailabilityCalendar Module
**/
var $ = require('jquery'),
  dateISO = require('LC/dateISO8601');

var classes = {
  calendar: 'AvailabilityCalendar',
  loading: 'is-loading',
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

    function fetchData(start, end) {
      calendar.addClass(options.classes.loading);
      return $.getJSON(dataSourceUrl,
        {
          user: user,
          start: start,
          end: end
        },
        function(data){
          if (data && data.Code === 0) {
            $.extend(true, dataSource, data.Result);
            calendar.removeClass(options.classes.loading);
          } else {
            // TODO Manage error
            if (console && console.error) console.error('AvailabilityCalendar fetch data error %o', data);
          }
        }
      );
    }

    calendar.on('click', options.classes.prevAction, function prev(){
    });

    calendar.on('click', options.classes.nextAction, function next(){
    });

    // Fetch current week
    var start = getFirstWeekDate(new Date()),
      end = getLastWeekDate(new Date());

    fetchData(start, end).done(function(){
      bindData(calendar, dataSource, options, start, end);
    });
  });
}

function bindData(calendar, dataSource, options, start, end) {
  var slotsContainer = calendar.find('.' + options.classes.slots),
    slots = slotsContainer.find('td');

  // Remove any previous status class from all slots
  for (var s = 0; s < statusTypes.length; s++) {
    slots.removeClass( options.classes.slotStatusPrefix + statusTypes[s] );
  }

  // Set all slots with default status
  slots.addClass( options.classes.slotStatusPrefix + dataSource.defaultStatus );

  var date = new Date(start);
  for (var i = 0; i < 7; i++) {
    var datekey = dateISO.dateLocal(date);
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

    // Next date:
    date.setDate(date.getDate() + 1);
  }
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

// Public API:
exports.defaults = defaults;
exports.on = on;