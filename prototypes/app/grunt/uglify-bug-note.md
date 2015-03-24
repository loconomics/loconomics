# Example of source and uglify code that gets broken.
Detail: variables with underscore under settings are missing when the reading happens, but was checked that exists just after write them (console.log)
See issue #709

## Source
<code>
                    Activity.prototype.show = function (options) {
                        options = options || {
                        },
                        this.requestData = options,
                        this._handlers && this._handlersAreConnected !== !0 && (this._handlers.forEach(function (settings) {
                            if (!settings.event && settings.target.subscribe) {
                                var subscription = settings.target.subscribe(settings.handler);
                                settings._subscription = subscription,
                                settings._latestSubscribedValue !== settings.target() && settings.handler.call(settings.target, settings.target())
                            } else settings.selector ? settings.target.on(settings.event, settings.selector, settings.handler)  : settings.target.on(settings.event, settings.handler)
                        }), this._handlersAreConnected = !0)
                    },
                    Activity.prototype.hide = function () {
                        this._handlers && (this._handlers.forEach(function (settings) {
                            settings._subscription ? (settings._subscription.dispose(), settings._latestSubscribedValue = settings.target())  : settings.target.off ? settings.selector ? settings.target.off(settings.event, settings.selector, settings.handler)  : settings.target.off(settings.event, settings.handler)  : settings.target.removeListener(settings.event, settings.handler)
                        }), this._handlersAreConnected = !1)
                    },
                    Activity.prototype.registerHandler = function (settings) {
                        if (!settings) throw new Error('Register require a settings object');
                        if (!settings.target || !settings.target.on && !settings.target.subscribe) throw new Error('Target is null or not a jQuery, EventEmmiter or Observable object');
                        if ('function' != typeof settings.handler) throw new Error('Handler must be a function.');
                        if (!settings.event && !settings.target.subscribe) throw new Error('Event is null; it\'s required for non observable objects');
                        this._handlers = this._handlers || [],
                        this._handlers.push(settings)
                    },
</code>

## Uglify (default options)
<code>
                    Activity.prototype.show = function show(options) {
                        options = options || {
                        };
                        this.requestData = options;
                        if (this._handlers && this._handlersAreConnected !== true) {
                            this._handlers.forEach(function (settings) {
                                if (!settings.event && settings.target.subscribe) {
                                    var subscription = settings.target.subscribe(settings.handler);
                                    settings._subscription = subscription;
                                    console.log('on handlers has subscription', settings, settings._subscription, subscription);
                                    if (settings._latestSubscribedValue !== settings.target()) {
                                        settings.handler.call(settings.target, settings.target())
                                    }
                                } else if (settings.selector) {
                                    settings.target.on(settings.event, settings.selector, settings.handler)
                                } else {
                                    settings.target.on(settings.event, settings.handler)
                                }
                            });
                            this._handlersAreConnected = true
                        }
                    };
                    Activity.prototype.hide = function hide() {
                        if (this._handlers) {
                            this._handlers.forEach(function (settings) {
                                console.log('off settings', settings);
                                if (settings._subscription) {
                                    settings._subscription.dispose();
                                    settings._latestSubscribedValue = settings.target()
                                } else if (settings.target.off) {
                                    if (settings.selector) settings.target.off(settings.event, settings.selector, settings.handler);
                                     else settings.target.off(settings.event, settings.handler)
                                } else {
                                    console.log('NOT settings.target.removeListener', !!settings.target.removeListener, settings);
                                    settings.target.removeListener(settings.event, settings.handler)
                                }
                            });
                            this._handlersAreConnected = false
                        }
                    };
                    Activity.prototype.registerHandler = function registerHandler(settings) {
                        if (!settings) throw new Error('Register require a settings object');
                        if (!settings.target || !settings.target.on && !settings.target.subscribe) throw new Error('Target is null or not a jQuery, EventEmmiter or Observable object');
                        if (typeof settings.handler !== 'function') {
                            throw new Error('Handler must be a function.')
                        }
                        if (!settings.event && !settings.target.subscribe) {
                            throw new Error('Event is null; it\'s required for non observable objects')
                        }
                        this._handlers = this._handlers || [];
                        this._handlers.push(settings)
                    };
</code>
