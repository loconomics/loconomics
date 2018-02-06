/**
    Activity base class
**/
'use strict';

var ko = require('knockout');
var NavAction = require('../viewmodels/NavAction');
var NavBar = require('../viewmodels/NavBar');

require('../utils/Function.prototype._inherits');
var showConfirm = require('../modals/confirm').show;
var insertCss = require('insert-css');

/**
    Activity class definition
**/
function Activity($activity, app) {

    this.$activity = $activity;
    this.app = app;

    // Default access level: anyone
    // Activities can use the enumeration: this.app.UserType
    this.accessLevel = null;

    // By default, reset scroll to top on activity.show
    this.resetScroll = true;

    // Object to hold the options passed on 'show' as a result
    // of a request from another activity
    this.requestData = null;

    // Default navBar object.
    this.navBar = new NavBar({
        title: null, // null for logo
        leftAction: null,
        rightAction: null
    });

    /**
     * When the activity is being shown (just at ending of method 'show'),
     * false for hidden (restored at ending of method 'hide')
     * @member {KnockoutObservable<boolean>}
     */
    this.isShown = ko.observable(false);

    /**
     * Observable property to allow each activity to set-up a title.
     * This first value is a placeholder, can be replaced by a constant string
     * or a computed at the activity constructor (before first 'show').
     * @member {KnockoutObservable<string>|string}
     */
    this.title = ko.observable('');

    // Knockout binding of viewModel delayed to first show
    // to avoid problems with subclasses replacing the viewModel property
}

module.exports = Activity;

/**
 * The text to attach as suffix to the instance title as part of the
 * window/tab title.
 * @member {string}
 * @readonly
 * @static
 */
Activity.TRAILING_WINDOW_TITLE = ' - Loconomics';

/**
 * Applies a new title to the window.
 * This utility is fine to be used as a callback.
 * @param {string} title New title to set in the window (the common trailing
 * text will be appended)
 * @static
 */
Activity.applyTitle = function (title) {
    // A specific title per activity is being MANDATORY, so we throw
    // a console error to make devs aware of that.
    if (!title) {
        console.error('A title for the activity is mandatory, empty was given.');
    }
    document.title = (title || '') + Activity.TRAILING_WINDOW_TITLE;
};

/**
    Set-up visualization of the view with the given options/state,
    with a reset of current state.
    Must be executed every time the activity is put in the current view.
**/
Activity.prototype.show = function show(options) {
    /* eslint complexity:"off" */
    //console.log('Activity show', this.constructor.name);
    if (!this.__bindingDone) {
        // Default viewModel: the Activity instance (for more simple scenarios)
        this.viewModel = this.viewModel || this;
        // Share title field with viewModel
        if (!this.viewModel.title) {
            this.viewModel.title = this.title;
        }
        if (!this.viewModel.isShown) {
            this.viewModel.isShown = this.isShown;
        }
        // Set-up dynamic update of the title on observable value change
        if (ko.isObservable(this.title)) {
            this.registerHandler({
                target: this.title,
                handler: Activity.applyTitle
            });
        }
        // A view model and bindings being applied is ever required
        // even on Activities without need for a view model, since
        // the use of components and templates, or any other data-bind
        // syntax, requires to be in a context with binding enabled:
        ko.applyBindings(this.viewModel, this.$activity.get(0));

        this.__bindingDone = true;

        // Additionally to binding, inject styles is needed too only first time
        /**
         * Enable the own activity style CSS, if there is someone.
         * @private
         */
        this.__styleElement = this.constructor.style && insertCss(this.constructor.style, {
            container: this.$activity.get(0)
        });
    }

    options = options || {};
    this.requestData = options;

    // Apply current title
    Activity.applyTitle(ko.unwrap(this.title));

    // Enable registered handlers
    // Validation of each settings object is performed
    // on registered, avoided here.
    if (this._handlers &&
        this._handlersAreConnected !== true) {
        this._handlers.forEach(function(settings) {
            // Check if is an observable subscription
            if (!settings.event && settings.target.subscribe) {
                var subscription = settings.target.subscribe(settings.handler);
                // Observables has not a 'unsubscribe' function,
                // they return an object that must be 'disposed'.
                // Saving that with settings to allow 'unsubscribe' later.
                settings._subscription = subscription;

                // Inmediate execution: if current observable value is different
                // than previous one, execute the handler:
                // (this avoid that a changed state get omitted because happened
                // when subscription was off; it means a first time execution too).
                // NOTE: 'undefined' value on observable may cause this to fall
                if (settings._latestSubscribedValue !== settings.target()) {
                    settings.handler.call(settings.target, settings.target());
                }
            }
            else if (settings.selector) {
                settings.target.on(settings.event, settings.selector, settings.handler);
            }
            else if (settings.target.on) {
                settings.target.on(settings.event, settings.handler);
            }
            else {
                console.error('Activity.show: Bad registered handler', settings);
            }
        });
        // To avoid double connections:
        // NOTE: may happen that 'show' gets called several times without a 'hide'
        // in between, because 'show' acts as a refresher right now even from segment
        // changes from the same activity.
        this._handlersAreConnected = true;
    }

    // Scroll to top immediately, if wanted by the activity (defaults to true):
    if (this.resetScroll)
        this.$activity.scrollTop(0);

    this.isShown(true);
};

/**
    Perform tasks to stop anything running or stop handlers from listening.
    Must be executed every time the activity is hidden/removed
    from the current view.
**/
Activity.prototype.hide = function hide() {
    // Disable registered handlers
    if (this._handlers) {
        this._handlers.forEach(function(settings) {
            // Check if is an observable subscription
            if (settings._subscription) {
                settings._subscription.dispose();
                // Save latest observable value to make a comparision
                // next time is enabled to ensure is executed if there was
                // a change while disabled:
                settings._latestSubscribedValue = settings.target();
            }
            else if (settings.target.off) {
                if (settings.selector)
                    settings.target.off(settings.event, settings.selector, settings.handler);
                else
                    settings.target.off(settings.event, settings.handler);
            }
            else if (settings.target.removeListener) {
                settings.target.removeListener(settings.event, settings.handler);
            }
            else {
                console.error('Activity.hide: Bad registered handler', settings);
            }
        });

        this._handlersAreConnected = false;
    }

    this.isShown(false);
};

/**
 * Dispose any ressources that cannot be done automatically.
 *
 * IMPORTANT: Currently, this is only executed on activities that are removed
 * from DOM and 'singleton' instance; that's applied only to new folder-based
 * bundle activities, aplying the new activity lifecycle #457.
 */
Activity.prototype.dispose = function() {
    if (this.__styleElement) {
        this.__styleElement.parentNode.removeChild(this.__styleElement);
    }
};

/**
    Register a handler that acts on an event or subscription notification,
    that will be enabled on Activity.show and disabled on Activity.hide.

    @param settings:object {
        target: jQuery, EventEmitter, Knockout.observable. Required
        event: string. Event name (can have namespaces, several events allowed). Its required except when the target is an observable, there must
            be omitted.
        handler: Function. Required,
        selector: string. Optional. For jQuery events only, passed as the
            selector for delegated handlers.
    }
**/
Activity.prototype.registerHandler = function registerHandler(settings) {

    if (!settings)
        throw new Error('Register require a settings object');

    if (!settings.target || (!settings.target.on && !settings.target.subscribe))
        throw new Error('Target is null or not a jQuery, EventEmmiter or Observable object');

    if (typeof(settings.handler) !== 'function') {
        throw new Error('Handler must be a function.');
    }

    if (!settings.event && !settings.target.subscribe) {
        throw new Error('Event is null; it\'s required for non observable objects');
    }

    this._handlers = this._handlers || [];

    this._handlers.push(settings);
};

/**
    Static utilities
**/
// For commodity, common classes are exposed as static properties
Activity.NavBar = NavBar;
Activity.NavAction = NavAction;

// Quick creation of common types of NavBar
Activity.createSectionNavBar = function createSectionNavBar(title) {
    return new NavBar({
        title: title,
        leftAction: NavAction.menuIn
        // NOTE: Removed as of #726 until a new menu for it is implemented as of #191 child issues.
        //rightAction: NavAction.menuNewItem
    });
};

Activity.createSubsectionNavBar = function createSubsectionNavBar(title, options) {

    options = options || {};

    var goBackOptions = {
        text: title,
        isTitle: true
    };

    if (options.backLink) {
        goBackOptions.link = options.backLink;
        goBackOptions.isShell = false;
    }

    var helpLink = options.helpLink;
    if (helpLink) {
        var del = helpLink.indexOf('?') > -1 ? '&' : '?';
        helpLink += del + 'mustReturn=true&returnText=' + encodeURIComponent(title);
    }

    var rightOptions = helpLink ?
        NavAction.goHelpIndex.model.clone({
            link: helpLink,
            text: "Help"
        }) :
        NavAction.goHelpIndex;

    return new NavBar({
        title: '', // No title
        leftAction: NavAction.goBack.model.clone(goBackOptions),
        rightAction: rightOptions
    });
};

Activity.prototype.createCancelAction = function createCancelAction(cancelLink, state) {

    var app = this.app;

    var action = new NavAction({
        link: cancelLink,
        text: 'Cancel',
        handler: function(event) {
            var link = this.link();
            var eoptions = event && event.options || {};

            var goLink = function() {
                if (link)
                    app.shell.go(link, state);
                else
                    app.shell.goBack(state);
            };

            // A silentMode passed to the event requires
            // avoid the modal (used when executing a saving task for example)
            if (eoptions.silentMode) {
                goLink();
            }
            else {
                // TODO L18N
                showConfirm({
                    title: 'Cancel',
                    message: 'Are you sure?',
                    yes: 'Yes',
                    no: 'No'
                })
                .then(function() {
                    // Confirmed cancellation:
                    goLink();
                });
            }
        }
    });

    return action;
};

Activity.prototype.convertToCancelAction = function convertToCancelAction(actionModel, cancelLink) {
    var cancel = this.createCancelAction(cancelLink);
    actionModel.model.updateWith(cancel);
    // DUDE: handler is cpied by updateWith?
    actionModel.handler(cancel.handler());
};

/**
    Singleton helper.
    With the name parameter, a named instance can be created allowing
    several instances per class not being purely 'singleton', more like
    a factory where singletons per name are created.
**/
var singletonInstances = {};
var createSingleton = function createSingleton(ActivityClass, $activity, app, name) {

    var key = ActivityClass.name + '::' + (name || '');

    if (singletonInstances[key] instanceof ActivityClass) {
        return singletonInstances[key];
    }
    else {
        var s = new ActivityClass($activity, app);
        singletonInstances[key] = s;
        return s;
    }
};
// Example of use
//exports.init = createSingleton.bind(null, ActivityClass);

// #457 workaround:
// IMPORTANT: Workaround used in conjuntion with shell/loader
// regarding a new activity lifecycle (#457) that disposes the instance
// and html-DOM when the activity stop being used.
// This new lifecycle applies only to folder-based activities, bundle individually
// with it's copy of html and css. Most activities still are *legacy*, and
// this is not used on that case.
// The new lifecycle allows to make safer assumptions on how the code runs
// (specially working with components) and result is a more clear code and less
// memory wasted.
//
// This method just removes the activity 'singleton' instance created, so is
// recreated next time, while DOM removal is at shell/loader.
Activity.deleteSingletonInstance = function(ActivityClass, name) {
    var key = ActivityClass.name + '::' + (name || '');
    if (singletonInstances[key] instanceof ActivityClass) {
        singletonInstances[key].dispose();
        delete singletonInstances[key];
    }
};

/**
    Static method extends to help inheritance.
    Additionally, it adds a static init method ready for the new class
    that generates/retrieves the singleton.
    NOTE: 'extends' cannot be used, reserved keyword, breaks some browsers and some future may broke too
    (so just removed the 's').
**/
Activity.extend = function extendsActivity(ClassFn) {

    ClassFn._inherits(Activity);

    ClassFn.init = function($activity, app, name) {
        return createSingleton(ClassFn, $activity, app, name);
    };

    return ClassFn;
};

Activity.init = function($activity, app, name) {
    return createSingleton(this, $activity, app, name);
};

/**
 * Must be implemented by derived classes
 * @static @member {string}
 */
Object.defineProperty(Activity, 'template', {
    get: function() { throw new Error('No activity template defined'); },
    enumerable: true,
    configurable: true
});

/**
 * CSS text defining the style created for the activity.
 * @static @member {string}
 */
Object.defineProperty(Activity, 'style', {
    get: function() { return undefined; },
    enumerable: true,
    configurable: true
});
