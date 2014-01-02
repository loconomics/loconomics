/* INIT */
$(function () {
    /*= Home Page (moved to _SiteLayout, loading without this script for minor footprint and faster load)
    */
    /*(function () {
    // Datepicker (dupe date initialization here, but to document, just next code is copied to _SiteLayout)
    $.datepicker.setDefaults($.datepicker.regional[$('html').attr('lang')]);
    $('.date-pick', document).datepicker({
    showAnim: 'blind'
    });
    // Location js-dropdown
    var s = $('#search-location');
    s.prop('readonly', true);
    s.autocomplete({
    source: LC.searchLocations
    , autoFocus: true
    , minLength: 0
    , select: function () {
    return false;
    }
    });
    s.on('focus click', function () { s.autocomplete('search', '') });
    })();*/
});