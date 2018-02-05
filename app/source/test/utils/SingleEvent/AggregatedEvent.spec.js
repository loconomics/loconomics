'use strict';

import AggregatedEvent from '../../../js/utils/SingleEvent/AggregatedEvent';
import SingleEvent from '../../../js/utils/SingleEvent';

describe('utils/SingleEvent/AggregatedEvent', function() {

    describe('constructor', function() {
        var eventA = new SingleEvent();
        var event = new AggregatedEvent([eventA]);

        it('should have not subscribed to the source event still', function() {
            expect(eventA.count).to.be.equals(0);
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
    // adding just some more tests for specific behavior of AggregatedEvent

    describe('unsubscribe', function() {
        var eventA = new SingleEvent();
        var eventB = new SingleEvent();
        var event = new AggregatedEvent([eventA, eventB]);
        var subs1 = null;
        var subs2 = null;

        it('should automatically unsubscribe from source events when no active subscriptions left', function() {
            /// should have a subscription first
            subs1 = event.subscribe(() => {});
            // Suscribed 1 to aggregated
            expect(event.count).to.be.equals(1);
            // Aggregated have subscribed itself to the source events
            expect(eventA.count).to.be.equals(1);
            expect(eventB.count).to.be.equals(1);

            /// should keep subscription to the source events after 1 of 2 subscribers unsubscribed
            // 2 subscription
            subs2 = event.subscribe(() => {});
            // Suscribed 2 to aggregated
            expect(event.count).to.be.equals(2);
            // Aggregated have subscribed itself to the source events
            expect(eventA.count).to.be.equals(1);
            expect(eventB.count).to.be.equals(1);
            // Unsubscribe only 1 from aggregated
            subs1.dispose();
            expect(event.count).to.be.equals(1);
            expect(eventA.count).to.be.equals(1);
            expect(eventB.count).to.be.equals(1);

            /// should automatically unsubscribe from source events when no active subscriptions left
            subs2.dispose();
            expect(event.count).to.be.equals(0);
            expect(eventA.count).to.be.equals(0);
            expect(eventB.count).to.be.equals(0);
        });
    });
});
