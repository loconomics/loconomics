'use strict';

import AggregatedEvent from '../../../js/utils/SingleEvent/AggregatedEvent';
import SingleEvent from '../../../js/utils/SingleEvent';

describe('utils/SingleEvent/AggregatedEvent', function() {

    describe('constructor', function() {
        var eventA = new SingleEvent();
        var event = new AggregatedEvent([eventA]);

        it('should have added a subscription to the source event', function() {
            // Have subscribed the source event
            expect(eventA.count).to.be.equals(1);
            // Since no subscriptions to the aggregated exist.
            expect(event.count).to.be.equals(0);
        });
    });

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

        it('should have subscribed to source event', function() {
            event.subscribe(() => {});
            // Suscribed 1 to aggregated
            expect(event.count).to.be.equals(1);
            // Aggregated have subscribed itself to the source events
            expect(eventA.count).to.be.equals(1);
            expect(eventB.count).to.be.equals(1);
        });

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
