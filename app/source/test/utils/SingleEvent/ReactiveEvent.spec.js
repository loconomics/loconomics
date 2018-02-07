'use strict';

import ReactiveEvent from '../../../js/utils/SingleEvent/ReactiveEvent';

describe('utils/SingleEvent/ReactiveEvent', function() {

    describe('emit', function() {
        let resultBefore;
        let resultAfter;
        var event = new ReactiveEvent({
            beforeEmit: (a, b) => {
                resultBefore = {
                    a,
                    b
                };
            },
            afterEmit: (a, b, r) => {
                resultAfter = {
                    a,
                    b,
                    r
                };
            }
        });
        var r = event.emit('a', 'b');
        it('should trigger before hook', function() {
            expect(resultBefore).to.not.be.undefined;
            expect(resultBefore && resultBefore.a).to.be.equals('a');
            expect(resultBefore && resultBefore.b).to.be.equals('b');
        });
        it('should trigger after hook', function() {
            expect(resultAfter).to.not.be.undefined;
            expect(resultAfter && resultAfter.a).to.be.equals('a');
            expect(resultAfter && resultAfter.b).to.be.equals('b');
        });
        it('should trigger after hook including the result value', function() {
            expect(resultAfter && resultAfter.r).to.be.equals(r);
        });
    });

    describe('subscribe', function() {
        let resultBefore;
        let resultAfter;
        let resultHandler;
        const handler = (a, b) => {
            resultHandler = {
                a,
                b
            };
        };
        var event = new ReactiveEvent({
            beforeSubscribe: (h) => {
                resultBefore = {
                    h
                };
            },
            afterSubscribe: (h, r) => {
                resultAfter = {
                    h,
                    r
                };
            }
        });
        var s = event.subscribe(handler);
        it('should trigger before hook', function() {
            expect(resultBefore).to.not.be.undefined;
            expect(resultBefore && resultBefore.h).to.be.equals(handler);
        });
        it('should trigger after hook', function() {
            expect(resultAfter).to.not.be.undefined;
            expect(resultAfter && resultAfter.h).to.be.equals(handler);
        });
        it('should trigger after hook including the result value', function() {
            expect(resultAfter && resultAfter.r).to.be.equals(s);
        });
        it('should not trigger subscribe if not emitted', function() {
            expect(resultHandler).to.not.be.undefined;
        });
        event.emit('a', 'b');
        it('should trigger subscribe after emitted', function() {
            expect(resultHandler && resultHandler.a).to.be.equals('a');
            expect(resultHandler && resultHandler.b).to.be.equals('b');
        });
        s.dispose();
    });

    describe('unsubscribe', function() {
        let resultBefore;
        let resultAfter;
        const handler = () => {};
        var event = new ReactiveEvent({
            beforeUnsubscribe: (id) => {
                resultBefore = {
                    id
                };
            },
            afterUnsubscribe: (id, r) => {
                resultAfter = {
                    id,
                    r
                };
            }
        });
        // event.unsubscribe(s.id) and s.dispose are the same, we test both
        // with two subscriptions just in case, same batch of tests
        function tests() {
            it('should trigger before hook', function() {
                expect(resultBefore).to.not.be.undefined;
                expect(resultBefore && resultBefore.id).to.be.equals(s.id);
            });
            it('should trigger after hook', function() {
                expect(resultAfter).to.not.be.undefined;
                expect(resultAfter && resultAfter.id).to.be.equals(s.id);
            });
            it('should trigger after hook including the result value', function() {
                expect(resultAfter && resultAfter.r).to.be.equals(s);
            });
        }
        let s = event.subscribe(handler);
        event.unsubscribe(s.id);
        tests();
        s = event.subscribe(handler);
        s.dispose();
        tests();
    });

    // other behaviors inherit from SingleEvent remains the same
});
