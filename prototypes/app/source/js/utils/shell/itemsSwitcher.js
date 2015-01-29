/**
**/
'use strict';

function itemsSwitcher($from, $to, notifier) {                
    if (!$to.is(':visible')) {
        notifier.willOpen($to);
        $to.show();
        // Its enough visible to perform initialization tasks:
        notifier.ready($to);
        // When its completely opened
        notifier.opened($to);
    } else {
        // Its ready; maybe it was but sub-location
        // or state change need to be communicated
        notifier.ready($to);
    }

    if ($from.is(':visible')) {
        notifier.willClose($from);
        $from.hide();
        notifier.closed($from);
    }
}

module.exports = itemsSwitcher;
