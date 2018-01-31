'use strict';

import AggregatedEvent from '../../../js/utils/SingleEvent/AggregatedEvent';
import SingleEvent from '../../../js/utils/SingleEvent';

describe('utils/SingleEvent/AggregatedEvent', function() {

    describe('emit', function() {
        var event = new AggregatedEvent([new SingleEvent()]);
        it('should not allow emitting', function() {
            expect(event.emit).to.be.undefined;
        });
    });

    describe('subscribe', function() {
        var eventA = new SingleEvent();
        var eventB = new SingleEvent();
        var event = new AggregatedEvent([eventA, eventB]);

        // Expected things inherit from SingleEvent are not tested.
        // We go with test that it aggregates the events properly
        it('should notify when aggregated events emit', function() {
            var given;
            event.subscribe(function(data) {
                given = data;
            });
            eventA.emit('A');
            expect(given).to.be.equals('A');
            eventB.emit('B');
            expect(given).to.be.equals('B');
        });
    });

    // methods unsubsribe, subscriber comes inherit from SingleEvent and
    // behaves the same, no need to test them
});
