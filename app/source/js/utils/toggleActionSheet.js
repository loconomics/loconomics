/**
    Adds Toggle option to enable a web ActionSheet.
    
    It enables links like next to trigger ActionSheet elements using data attributes
    Example:
    <a href="#" data-toggle="ActionSheet" data-target="more-options-sheet">More options</a>
**/
'use strict';
var $ = require('jquery');

exports.on = function() {
    function closeActionSheet(el) {
        el = el || $('.ActionSheet');
        el.attr('hidden', 'hidden')
        .trigger('close.ActionSheet');
        $('body').removeClass('has-ActionSheet-open');
    }

    $(document).on('click', '[data-toggle=ActionSheet]', function() {
        var $e = $(this),
            t = $e.data('target'),
            $t = $('#' + t);

        // toggleAttr:
        if ($t.attr('hidden')) {
            // Close all others
            closeActionSheet();
            // Show:
            $t.removeAttr('hidden')
            .trigger('open.ActionSheet');
            $('body').addClass('has-ActionSheet-open');
        }
        else {
            closeActionSheet($t);
        }

        // Auto hide:
        $t.one('click', function() {
            closeActionSheet($t);
        });
    });
};
