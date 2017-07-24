/**
 * Defines a class to manage events individually,
 * by attaching an instance of SingleEvent to a variable
 * or property that is responsible only to emit and subscribe
 * to one type of event.
 * This allows to explicitly define which events are supported
 * rather than rely on arbitrary strings for each event type name.
 * @module utils/SingleEvent
 *
 * NOTE: As a design decission, if additional features for subscribing
 * a handler want to be added, typicals ones like 'once' option
 * (to auto remove the handler after first execution)
 * or 'match' (to filter when the handler is executed depending on
 * given values), rather than extend SingleEvent with specialized
 * methods, is the Subscription object returned at 'subscribe' the
 * one that must be extended.
 * SingleEvent must be udpated only for any internal generic required to
 * allow that implementations possible.
 * Proposal: Subscription..justOnce, Subscription..limitTo(x times),
 * Subscription..match(x => {boolean})
 *
 * Q: Would be useful a clear/unsubscribeAll method?
 */
'use strict';

/**
 * A subscriber object can subscribe or unsubscribe
 * to event notifications
 * @typedef {Object} Subscriber
 * @property {function} subscribe
 * @property {function} unsubscribe
 */

/**
 * Descriptor of a subscription to an event
 * @typedef {Object} Subscription
 * @property {number} id Internal identifier
 * @property {function} handler Reference to the handler subscribed
 * @property {function<Subscription>} dispose Cancels the subscription,
 * getting removed from the internal stack, and returns it.
 * AKA: unsubscribe, cancel
 */

/**
 * Class for emitting and subscribing events,
 * specialized in one type of event per instance.
 * @param {Object} [context=] Defines the context
 * when executing each subscribed handler (the `this`
 * value inside the function).
 * Defaults to the SingleEvent instance
 */
function SingleEvent(context) {

    // Defaults to the own instance
    context = context || this;

    /**
     * List of registered subscriptions,
     * containing the attached handlers (functions)
     * @private
     * @type {Array<Subscription>}
     */
    var subscriptions = [];

    /**
     * Tracks the amount of subscriptions disposed/cancelled.
     * That means, the number of holes in the subscriptions array
     * that must be discarded from the total length.
     */
    var unsubscriptionsCount = 0;

    /**
     * Emits an event occurrence, executing
     * all the subscribed hanlders.
     * AKA: triggerEvent
     * @param {...any} values Data to provide
     * to each handler
     * @returns {number} Count of handlers executed
     */
    this.emit = function() {
        var values = arguments;
        // forEach don't iterates array holes
        // then no need to take additional action
        subscriptions.forEach(function (sub) {
            sub.handler.apply(context, values);
        });
        return subscriptions.length - unsubscriptionsCount;
    };

    /**
     * Removes the given subscription by its ID
     * preventing further executions.
     * AKA: removeHandler, removeListener, off
     * @param {number} subscriptionID
     * @returns {Subscription} The removed subscription object,
     * null if not found.
     */
    this.unsubscribe = function(subscriptionID) {
        var subscription = subscriptions[subscriptionID];
        if (subscription) {
            // We will have array holes
            delete subscriptions[subscriptionID];
            unsubscriptionsCount++;
            // Cannot use 'splice' method like
            // > subscriptions.splice(subscriptionID, 1);
            // because it alters the index--ids for any
            // subscription after that
            // and is worse in performance
        }
        return subscription || null;
    };

    /**
     * Adds a handler for execution on each event occurrence.
     * AKA: listen, addHandler, addListener, on
     * @param {function} handler It will receive the values
     * emited by the event.
     * @returns {Subscription} It lets you to manage
     * your newly created subscription.
     */
    this.subscribe = function(handler) {
        if (typeof(handler) !== 'function') {
            throw new Error('Handler must be a function');
        }
        var id = subscriptions.length;
        var ev = this;
        // Creates a Subscription object (see typedef
        // members descriptions)
        var subscription = {
            get id() {
                return id;
            },
            get handler() {
                return handler;
            },
            dispose: function () {
                return ev.unsubscribe(id);
            }
        };
        subscriptions.push(subscription);
        return subscription;
    };

    /**
     * Returns an object that cannot emit the event,
     * only subscribe/unsubscribe to it.
     * Useful to return the public interface of the
     * event, usually as a class property
     * @member {Subscriber}
     */
    this.subscriber = {
        subscribe: this.subscribe.bind(this),
        unsubscribe: this.unsubscribe.bind(this)
    };
}

module.exports = SingleEvent;
