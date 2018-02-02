/**
 * The ReactiveEvent class allows to set-up hooks triggered when a subscription
 * happens, before or after. The hooks are callbacks triggered to react when
 * a method of the event object is triggered.
 * Individual reactions are allowed for all public methods: subscribe,
 * unsubscribe and emit.
 * All reaction hooks are optional.
 * Hooks of type 'before' receives same parameters as the method
 * Hooks of type 'after' receives same parameters as the method plus the returning value as last parameter
 * For the rest, the behavior is the same as a usual SingleEvent
 * @module utils/SingleEvent/ReactiveEvent
 * @example
 * ```
 * const onData = new ReactiveEvent({
 *     beforeSubscribe: () => triggerADataLoad()
 * });
 * ```
 * @example
 * ```
 * const onData = new ReactiveEvent({
 *     beforeSubscribe: () => console.log('after subscribe', arguments),
 *     afterSubscribe: () => console.log('after subscribe', arguments),
 *     beforeUnsubscribe: () => console.log('before unsubscribe', arguments),
 *     afterUnsubscribe: () => console.log('after unsubscribe', arguments),
 *     beforeEmit: () => console.log('before emit', arguments),
 *     afterEmit: () => console.log('after emit', arguments)
 * });
 * ```
 */
//TODO: Unit Tests
/**
 * @typedef {Object} Hooks
 * @member {Function} [beforeSubscribe]
 * @member {Function} [afterSubscribe]
 * @member {Function} [beforeUnsubscribe]
 * @member {Function} [afterUnsubscribe]
 * @member {Function} [beforeEmit]
 * @member {Function} [afterEmit]
 */
import SingleEvent from './index';

export default class ReactiveEvent extends SingleEvent {
    /**
     * Class constructor
     * @param {Hooks} hooks All hooks are optional
     * @param {Objec} [context]
     */
    constructor(hooks, context) {
        super(context);
        // Replace methods with reactive versions
        this.constructor.convert(this, hooks);
    }

    /**
     * Modifies a given event to react to method calls with the given hooks.
     * @param {SingleEvent} singleEvent The event to convert into a reactive event
     * @param {Hooks} hooks All hooks are optional
     * @return {SingleEvent} Same instance given as singleEvent param, upgraded
     */
    static convert(singleEvent, hooks) {
        if (hooks.beforeSubscribe || hooks.afterSubscribe) {
            const subscribe = singleEvent.subscribe;
            singleEvent.subscribe = () => {
                if (hooks.beforeSubscribe) {
                    hooks.beforeSubscribe.apply(singleEvent, arguments);
                }
                const result = subscribe.apply(singleEvent, arguments);
                if (hooks.afterSubscribe) {
                    hooks.afterSubscribe.call(singleEvent, ...arguments, result);
                }
            };
        }
        if (hooks.beforeUnsubscribe || hooks.afterUnsubscribe) {
            const unsubscribe = singleEvent.unsubscribe;
            singleEvent.unsubscribe = () => {
                if (hooks.beforeUnsubscribe) {
                    hooks.beforeUnsubscribe.apply(singleEvent, arguments);
                }
                const result = unsubscribe.apply(singleEvent, arguments);
                if (hooks.afterUnsubscribe) {
                    hooks.afterUnsubscribe.call(singleEvent, ...arguments, result);
                }
            };
        }
        if (hooks.beforeEmit || hooks.afterEmit) {
            const emit = singleEvent.emit;
            singleEvent.emit = () => {
                if (hooks.beforeEmit) {
                    hooks.beforeEmit.apply(singleEvent, arguments);
                }
                const result = emit.apply(singleEvent, arguments);
                if (hooks.afterEmit) {
                    hooks.afterEmit.call(singleEvent, ...arguments, result);
                }
            };
        }
        return singleEvent;
    }
}
