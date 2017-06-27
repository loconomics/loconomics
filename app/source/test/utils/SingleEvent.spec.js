'use strict';

var SingleEvent = require('../../js/utils/SingleEvent');

describe('utils/SingleEvent', function() {

    describe('emit', function() {
        var event = new SingleEvent();

        it('should trigger event', function() {
            var touched = false;
            event.subscribe(function() {
                touched = true;
            });
            var count = event.emit();

            expect(touched).to.be.true;
            expect(count).to.equal(1);
        });

        it('should pass a value', function() {
            var EMITTED_VALUE = 'something';
            var value = null;
            event.subscribe(function(receivedValue) {
                value = receivedValue;
            });
            event.emit(EMITTED_VALUE);

            expect(value).to.be.equal(EMITTED_VALUE);
        });

        it('should pass arbitray amount of values', function() {
            var EMITTED_FIRST = 'Hello';
            var EMITTED_SECOND = 23;
            var EMITTED_THIRD = { hello: 'world!' };
            var EMITTED_FOURTH = true;
            var first = null;
            var second = null;
            var third = null;
            var fourth = null;

            event.subscribe(
                function(received1, received2, received3, received4) {
                    first = received1;
                    second = received2;
                    third = received3;
                    fourth = received4;
                }
            );
            event.emit(EMITTED_FIRST, EMITTED_SECOND, EMITTED_THIRD, EMITTED_FOURTH);

            expect(first).to.be.equal(EMITTED_FIRST);
            expect(second).to.be.equal(EMITTED_SECOND);
            expect(third).to.be.equal(EMITTED_THIRD);
            expect(fourth).to.be.equal(EMITTED_FOURTH);
        });
    });

    describe('subscribe', function() {
        var event = new SingleEvent();
        var subscriptionA = null;
        var subscriptionB = null;
        var touchedByA = false;
        var touchedByB = false;
        var handlerA = function() {
            touchedByA = true;
        };
        var handlerB = function() {
            touchedByB = true;
        };

        it('should receive a function', function() {
            var bad = function() {
                event.subscribe('what?');
            };
            expect(bad).to.throw();
        });

        it('should returns a subscription', function() {
            subscriptionA = event.subscribe(handlerA);

            expect(subscriptionA).to.not.be.null;
            expect(subscriptionA.id).to.be.equal(0);
        });

        it('should returns a different subscription each time', function() {
            subscriptionB = event.subscribe(handlerB);

            expect(subscriptionB).to.not.be.equals(subscriptionA);
            expect(subscriptionB.id).to.be.equal(1);
        });

        describe('id', function() {
            it('should returns a number', function() {
                expect(subscriptionA.id).to.be.finite;
            });
        });

        describe('handler', function() {
            it('should returns a function', function() {
                expect(subscriptionA.handler).to.be.a('function');
            });
            it('should returns the original subscribed function', function() {
                expect(subscriptionA.handler).to.be.equal(handlerA);
            });
        });

        describe('dispose', function() {
            it('should returns the subscription', function() {
                var cancelledSubscription = subscriptionA.dispose();

                expect(cancelledSubscription).to.equal(subscriptionA);
            });

            it('should prevents execution (only for that subscription)', function() {
                event.emit();
                expect(touchedByA).to.be.false;
                expect(touchedByB).to.be.true;
            });
        });
    });

    describe('unsubscribe', function() {
        var event = new SingleEvent();
        var touched = false;
        var subscription = event.subscribe(function() {
            touched = true;
        });

        it('should run before unsubscribe', function() {
            var count = event.emit();

            expect(touched).to.be.true;
            expect(count).to.equal(1);
        });

        it('should not run after unsubscribe', function() {
            // reset flag to test later
            touched = false;
            // Unsubscribe
            event.unsubscribe(subscription.id);
            var count = event.emit();

            expect(touched).to.be.false;
            expect(count).to.equal(0);
        });
    });

    describe('subscriber', function() {
        var event = new SingleEvent();
        var subscriber = event.subscriber;
        var subscription = null;
        var touched = false;

        it('should return a subscriber-only object', function() {
            expect(subscriber.subscribe).to.be.a('function');
            expect(subscriber.unsubscribe).to.be.a('function');
            expect(subscriber.emit).to.not.be.a('function');
        });

        it('should receive emitted events', function() {
            subscription = subscriber.subscribe(function() {
                touched = true;
            });
            event.emit();

            expect(touched).to.be.true;
        });

        it('should allow to unsubscribe', function() {
            // reset flag
            touched = false;
            subscription.dispose();
            event.emit();

            expect(touched).to.be.false;
        });

        it('should use same underlying subscription stack (compatible ID with event.subscribe)', function() {
            // Only one subscriber.subsription at the moment
            // so current given ID is 0, next should be 1, 2, 3
            // from any method
            expect(subscription.id).to.be.equal(0);
            // Subscription from event.subscribe
            var eventSubs = event.subscribe(function() {});
            expect(eventSubs.id).to.be.equal(1);
            // next subscriber.subscribe
            var nextSubs = subscriber.subscribe(function() {});
            expect(nextSubs.id).to.be.equal(2);
        });
    });
});
