/** Availability: Weekly Schedule section setup
**/
var $ = require('jquery');
var availabilityCalendar = require('LC/availabilityCalendar');

exports.on = function () {

  var monthlyList = availabilityCalendar.Monthly.enableAll();

  $.each(monthlyList, function (i, v) {
    var monthly = this;

    // Setuping the WorkHours calendar data save when the form is submitted
    var form = monthly.$el.closest('form.ajax, fieldset.ajax');
    var field = form.find('[name=monthly]');
    if (field.length === 0)
      field = $('<input type="hidden" name="monthly" />').appendTo(form);
    form.on('presubmit', function () {
      field.val(JSON.stringify(monthly.data));
    });

  });
};
