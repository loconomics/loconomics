/* Date picker initialization and use
 */
var $ = require('jquery');
require('jquery-ui');

function setupDatePicker() {
    // Date Picker
    $.datepicker.setDefaults($.datepicker.regional[$('html').attr('lang')]);
    applyDatePicker();
}
function applyDatePicker(element) {
    $(".date-pick", element || document)
    //.val(new Date().asString($.datepicker._defaults.dateFormat))
    .datepicker({
        showAnim: "blind"
    });
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        init: setupDatePicker,
        apply: applyDatePicker
    };
