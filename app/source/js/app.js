'use strict';

/** Global dependencies **/
var $ = require('jquery');
// Make jquery reference global, may still be needed by some shimed plugins
window.$ = window.jQuery = $;
require('detect_swipe');
var ko = require('knockout');
ko.bindingHandlers.format = require('ko/formatBinding').formatBinding;
ko.bindingHandlers.domElement = require('ko/domElementBinding').domElementBinding;
var bootknock = require('./utils/bootknockBindingHelpers');
require('./utils/Function.prototype._inherits');
require('./utils/Function.prototype._delayed');
// Polyfill for useful non-standard feature Function.name for IE9+
// (feature used to simplify creation of Activities and Models)
require('./utils/Function.prototype.name-polyfill');
// Promise polyfill, so its not 'require'd per module:
require('es6-promise').polyfill();

var layoutUpdateEvent = require('layoutUpdateEvent');
var onboarding = require('./data/onboarding');
var ga = require('./data/googleAnalytics');

// Register the special locale
require('./locales/en-US-LC');

var attachFastClick = require('fastclick').attach;

/**
    A set of fixes/workarounds for Bootstrap behavior/plugins
    to be executed before Bootstrap is included/executed.
    For example, because of data-binding removing/creating elements,
    some old references to removed items may get alive and need update,
    or re-enabling some behaviors.
**/
function preBootstrapWorkarounds() {
    // Internal Bootstrap source utility
    function getTargetFromTrigger($trigger) {
        var href,
            target = $trigger.attr('data-target') ||
            (href = $trigger.attr('href')) &&
            href.replace(/.*(?=#[^\s]+$)/, ''); // strip for ie7

        return $(target);
    }

    // Bug: navbar-collapse elements hold a reference to their original
    // $trigger, but that trigger can change on different 'clicks' or
    // get removed the original, so it must reference the new one
    // (the latests clicked, and not the cached one under the 'data' API).
    // NOTE: handler must execute before the Bootstrap handler for the same
    // event in order to work.
    $(document).on('click.bs.collapse.data-api.workaround', '[data-toggle="collapse"]', function() {
        var $t = $(this),
            $target = getTargetFromTrigger($t),
            data = $target && $target.data('bs.collapse');

        // If any
        if (data) {
            // Replace the trigger in the data reference:
            data.$trigger = $t;
        }
        // On else, nothing to do, a new Collapse instance will be created
        // with the correct target, the first time
    });
}

/**
    App static class
**/
var app = {
    shell: require('./app.shell'),

    /** Load activities controllers (not initialized) **/
    activities: require('./app.activities'),

    modals: require('./app.modals'),

    /**
        Just redirect the better place for current user and state.
        NOTE: Its a delayed function, since on many contexts need to
        wait for the current 'routing' from end before do the new
        history change.
        TODO: Maybe, rather than delay it, can stop current routing
        (changes on Shell required) and perform the new.
        TODO: Maybe alternative to previous, to provide a 'replace'
        in shell rather than a go, to avoid append redirect entries
        in the history, that create the problem of 'broken back button'
    **/
    goDashboard: function goDashboard() {

        // To avoid infinite loops if we already are performing
        // a goDashboard task, we flag the execution
        // being care of the delay introduced in the execution
        if (goDashboard._going === true) {
            return;
        }
        else {
            // Delayed to avoid collisions with in-the-middle
            // tasks: just allowing current routing to finish
            // before perform the 'redirect'
            // TODO: change by a real redirect that is able to
            // cancel the current app.shell routing process.
            setTimeout(function() {

                goDashboard._going = true;

                if(!onboarding.goIfEnabled()) {
                    this.shell.go('/dashboard');
                }

                // Just because is delayed, needs
                // to be set off after an inmediate to
                // ensure is set off after any other attempt
                // to add a delayed goDashboard:
                setTimeout(function() {
                    goDashboard._going = false;
                }, 1);
            }.bind(this), 1);
        }
    }
};

/** Continue app creation with things that need a reference to the app **/

require('./app-navbar').extend(app);

require('./app-components').registerAll(app);

app.getActivity = function getActivity(name) {
    var activity = this.activities[name];
    if (activity) {
        var $act = this.shell.items.find(name);
        if ($act && $act.length)
            return activity.init($act, this, name);
    }
    return null;
};

app.getActivityControllerByRoute = function getActivityControllerByRoute(route) {
    // From the route object, the important piece is route.name
    // that contains the activity name except if is the root
    var actName = route.name || this.shell.indexName;

    return this.getActivity(actName);
};

// accessControl setup: cannot be specified on Shell creation because
// depends on the app instance
app.shell.accessControl = require('./utils/accessControl')(app);

// Shortcut to UserType enumeration used to set permissions
app.UserType = require('./models/User').UserType;

// New method for common forms behavior after a successful save operation,
// the activity goes back (following the navbar back-link or shell.goBack())
// and notifying with a temporary unobtrusive navbar notification
app.successSave = function successSave(settings) {
    // defaults
    settings = $.extend({
        message: 'Your changes have been saved',
        link: null
    }, settings);

    // show notification
    this.showNavBarNotification(settings);

    // requested link or current activity go back
    if (settings.link)
        this.shell.go(settings.link);
    else
        this.performsNavBarBack({ silentMode: true });
};

/** App Init **/
var appInit = function appInit() {
    /*jshint maxstatements:70,maxcomplexity:16 */

    var userProfile = require('./data/userProfile');
    var user = userProfile.data;

    attachFastClick(document.body);

    // NOTE: Put any jQuery-UI used components here and document their use in the
    //  activities that require them; do NOT require it there because will break
    //  the use of touch-punch (few lines below). But is recommended to use
    //  alternative approaches, like knockout--custom-css (like done in autocompletes)
    // Knockout binding for jquery-ui sortable.
    // It loads jquery-ui sortable and draggable as dependencies:
    require('knockout-sortable');
    // Just AFTER jquery-ui is loaded (or the selected components), load
    // the fix for touch support:
    require('jquery.ui.touch-punch');

    // Enabling the 'layoutUpdate' jQuery Window event that happens on resize and transitionend,
    // and can be triggered manually by any script to notify changes on layout that
    // may require adjustments on other scripts that listen to it.
    // The event is throttle, guaranting that the minor handlers are executed rather
    // than a lot of them in short time frames (as happen with 'resize' events).
    layoutUpdateEvent.on();

    // Keyboard plugin events are not compatible with jQuery events, but needed to
    // trigger a layoutUpdate, so here are connected, mainly fixing bugs on iOS when the keyboard
    // is hidding.
    var trigLayout = function trigLayout() {
        $(window).trigger('layoutUpdate');
    };
    window.addEventListener('native.keyboardshow', trigLayout);
    window.addEventListener('native.keyboardhide', trigLayout);

    // IMPORTANT: WORKAROUND: iOS autoscroll problems
    // Race conditions may happen, making need a second call just a delay
    // after in case the first didn't make the trick
    window.addEventListener('native.keyboardshow', function() {
        // Removes iOS content scroll (no problems when used with an absolute positioned content)
        // (minor flickering, best solution)
        window.scrollTo(0, 0);
        setTimeout(function() {
            window.scrollTo(0, 0);
        }, 100);
    });

    // iOS-7+ status bar fix. Apply on plugin loaded (cordova/phonegap environment)
    // and in any system, so any other systems fix its solved too if needed
    // just updating the plugin (future proof) and ensure homogeneous cross plaftform behavior.
    if (window.StatusBar) {
        // Fix iOS-7+ overlay problem, and customize it
        // Is in config.xml too, but seems only affects to start-up splash screen,
        // so here can go different values.
        window.StatusBar.overlaysWebView(false);
        // background like our top navbar, since iOS styleguideline is to keep them homogeneous
        window.StatusBar.backgroundColorByHexString('#ffffff');
        window.StatusBar.styleDefault();
        // Android needs special color, keeping the black because the 'style' doesn't works here
        // the content keeps white, so cannot be read. And its styleguideline says to use a contrasting
        // color:
        if (window.cordova.platformId == 'android') {
            // Just use the Loconomics color :-)
            window.StatusBar.backgroundColorByHexString('#00989a');
        }
    }

    // Force an update delayed to ensure update after some things did additional work
    setTimeout(function() {
        $(window).trigger('layoutUpdate');
    }, 200);

    // Bootstrap
    preBootstrapWorkarounds();
    require('bootstrap');

    // Load Knockout binding helpers
    bootknock.plugIn(ko);
    require('./utils/pressEnterBindingHandler').plugIn(ko);

    // Plugins setup
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        // Explicitely, we WANT auto scroll on keyboard show up.
        // Can be disabled only if there is a javascript solution to autoscroll
        // on input focus, else a bug will happen specially on iOS where input
        // fields gets hidden by the on screen keyboard.
        window.cordova.plugins.Keyboard.disableScroll(false);
        // Fix bug on iOS 9.x with plugin version 2.2.0
        window.cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
    }

    // Easy links to shell actions, like goBack, in html elements
    // Example: <button data-shell="goBack 2">Go 2 times back</button>
    // NOTE: Important, registered before the shell.run to be executed
    // before its 'catch all links' handler
    $(document).on('click', '[data-shell]', function(e) {
        // Using attr rather than the 'data' API to get updated
        // DOM values
        var cmdline = $(this).attr('data-shell') || '',
            args = cmdline.split(' '),
            cmd = args[0];

        if (cmd && typeof(app.shell[cmd]) === 'function') {
            app.shell[cmd].apply(app.shell, args.slice(1));

            // Cancel any other action on the link, to avoid double linking results
            e.stopImmediatePropagation();
            e.preventDefault();
        }
    });

    // On Cordova/Phonegap app, special targets must be called using the window.open
    // API to ensure is correctly opened on the InAppBrowser (_blank) or system default
    // browser (_system).
    if (window.cordova) {
        $(document).on('click', '[target="_blank"], [target="_system"]', function(e) {
            window.open(this.getAttribute('href'), this.getAttribute('target'));
            e.preventDefault();
        });
    }

    // When an activity is ready in the Shell:
    app.shell.on(app.shell.events.itemReady, function($act, state) {

        // Must be the same:
        var routeName = app.shell.currentRoute.name;
        var actName = $act.data('activity');
        // If not, some race condition, not the same page go out
        if (routeName !== actName)
            return;

        // Connect the 'activities' controllers to their views
        var activity = app.getActivity(actName);
        // Trigger the 'show' logic of the activity controller:
        activity.show(state);

        // The show logic may do a redirect, loading other activity, double check
        routeName = app.shell.currentRoute.name;
        if (routeName !== actName)
            return;

        // Update menu
        var menuItem = activity.menuItem || actName;
        app.updateMenu(menuItem);

        // Update app navigation
        app.updateAppNav(activity, state);

        // For debugging purposes, give access to current activity
        app._currentActivity = activity;
    });
    // When an activity is hidden
    app.shell.on(app.shell.events.closed, function($act) {

        // Connect the 'activities' controllers to their views
        var actName = $act.data('activity');
        var activity = app.getActivity(actName);
        // Trigger the 'hide' logic of the activity controller:
        if (activity.hide)
            activity.hide();
    });
    // Catch errors on item/page loading, showing..
    app.shell.on('error', function(err) {
        app.modals.showError({ error: err });
    });

    // Scroll to element when clicking a usual fragment link (not a page link)
    var scrollToElement = require('./utils/scrollToElement');
    app.shell.on('fragmentNavigation', function(href) {
        // Check link, avoiding empty links
        // (href comes with the initial hash ever, so empty is just '#')
        if (href === '#') {
            // Notify for debugging, because this may be unwanted
            console.warn(
                'Navigation to an empty fragment, this may be not wanted. ' +
                'For root links, use "/"; on script handled links, call event.preventDefault; ' +
                'A touch event was listened on a link, but not the click event.'
            );
        }
        else {
            // Locate target
            var target = $(href);
            if (target.length) {
                // Smooth scrolling with animation
                var opts = { animation: { duration: 300 } };
                // Special case: if we are at the home page, the special, fixed header
                // must be an offset to avoid the content to fall behind it
                // (a generic attempt was done using 'header.is-fixed:visible' but had bug when
                // the header is still not-fixed -scroll still at the top).
                var act = target.closest('[data-activity]');
                var isHome = act.data('activity') === 'home';
                if (isHome) {
                    opts.topOffset = act.children('header').outerHeight();
                }
                scrollToElement(target, opts);
                // Move focus too
                var noTabindex = !target.attr('tabindex');
                if (noTabindex) {
                    // Set-up to allow programatic focus
                    target.attr('tabindex', -1);
                }
                setTimeout(function(){
                    target.focus();
                    // reset tabindex
                    if (noTabindex) {
                        target.removeAttr('tabindex');
                    }
                }, 100);
            }
        }
    });

    // Navbar binding
    app.setupNavBarBinding();

    var SmartNavBar = require('./components/SmartNavBar');
    var navBars = SmartNavBar.getAll();
    // Creates an event by listening to it, so other scripts can trigger
    // a 'contentChange' event to force a refresh of the navbar (to
    // calculate and apply a new size); expected from dynamic navbars
    // that change it content based on observables.
    navBars.forEach(function(navbar) {
        $(navbar.el).on('contentChange', function() {
            navbar.refresh();
        });
    });

    // Listen for menu events (collapse in SmartNavBar)
    // to apply the backdrop; add another class, explicit for know the menu/nav is opened
    var togglingBackdrop = false;
    $(document).on('show.bs.collapse hide.bs.collapse', '.AppNav .navbar-collapse', function(e) {
        if (!togglingBackdrop) {
            togglingBackdrop = true;
            var enabled = e.type === 'show';
//            $('body').toggleClass('use-backdrop', enabled);
            $('body').toggleClass('has-appNav-open', enabled);
            // Hide any other opened collapse
            $('.collapsing, .collapse.in').collapse('hide');
            togglingBackdrop = false;
        }
    });

    // Additional form elements attribute and behavior: data-autoselect=true
    // sets to automatically select the text content of an input text control
    // when gets the focus
    $(document).on('focus', '[data-autoselect="true"]', function() {
        $(this).select();
    });

    // App init:
    var alertError = function(err) {
        app.modals.showError({
            title: 'There was an error loading',
            error: err
        });
    };

    require('./utils/toggleActionSheet').on();

    // Supporting sub-domain/channels, set the site-url same like baseUrl
    // that was computed at the shell already, so the data drivers can read it for correct endpoint calls.
    if (app.shell.baseUrl) {
        $('html').attr('data-site-url', app.shell.baseUrl.replace(/^\//, ''));
    }

    // Set-up Google Analytics
    ga.setup(app.shell);

    var marketplaceProfile = require('./data/marketplaceProfile');
    /**
     * Set-up
     * some observables with user data with the global navbar
     * that needs to display the name, photo and type of user
     */
    var connectUserNavbar = function() {
        // Connect username in navbar, and type flags
        ko.computed(function() {
            app.navBarBinding.userName(user.firstName() || 'Me');
            app.navBarBinding.isServiceProfessional(user.isServiceProfessional());
            app.navBarBinding.isClient(user.isClient());
        });
        // Connect photoUrl in navbar: there are two sources, keep with more recent
        ko.computed(function() {
            var p = user.photoUrl();
            if (p) {
                app.navBarBinding.photoUrl(p);
            }
        });
        ko.computed(function() {
            var p = marketplaceProfile.data.photoUrl();
            if (p) {
                app.navBarBinding.photoUrl(p);
            }
        });
    };

    /**
     * Initializes the onboarding data module, getting locally stored user
     * data if is a logged user, and resume the onboarding process
     * when required
     * IMPORTANT: preloadUserProfile must be called before this,
     * that will update the global 'user' with the onboardingStep we need here.
     */
    var setupOnboarding = function() {

        try {
            // Set-up onboarding and current step, if any
            onboarding.init(app);
            onboarding.setStep(user.onboardingStep() || null);
        }
        catch(ex) {
            return Promise.reject(ex);
        }

        // Workaround #374: because the onboarding selectedJobTitleID is not stored
        // on server or at local profile, we need an speciallized method. This ensures
        // that the value is set in place when the async task ends, no further action is required.
        // NOTE: is not the ideal, a refactor for storing onboarding step and jobtitle together
        // is recommended (see #396)
        return onboarding.recoverLocalJobTitleID()
        .then(function() {
            // Now we are ready with values in place
            // Resume onboarding
            /*
                IMPORTANT: Exception: if the page is loading coming from itself,
                like from a target=_blank link, does not redirect to
                avoid to break the proposal of the link (like a help or FAQ link
                on onboarding)

                We check that there is a referrer (so comes from a link) and it shares the origin
                (be aware that referrer includes origin+pathname, we just look for same origin).
            */
            var r = window.document.referrer,
                fromItSelf = r && r.indexOf(window.document.location.origin) === 0;

            if (!fromItSelf) {
                onboarding.goIfEnabled();
            }
        });
    };

    /**
     * Performs the tasks to mark and visualize the app as ready.
     */
    var setAppAsReady = function() {
        // Mark the page as ready
        $('html').addClass('is-ready');
        // As app, hides splash screen
        if (window.navigator && window.navigator.splashscreen) {
            window.navigator.splashscreen.hide();
        }
    };

    /**
     * Loads the user profile from local storage if any,
     * filling in the shared copy of the data (userProfile.data),
     * and request a remote sync (in case is logged user).
     *
     * IMPORTANT Needs to be executed after session.restore and before
     * tasks like 'shell.run' (or accessControl checks will fail)
     * and 'onboarding' (or will not be able to resume from locally stored
     * onboarding step)
     */
    var preloadUserProfile = function() {
        // REQUIRED FOR ONBOARDING DETAILS:
        // This is needed to detect and resume an onboarding, like happens
        // if a user closes and go back to the app/site, or when coming
        // from a signup redirect like in a landing page (#381)
        // NOTE: the usual methods (load, getData) are not used since may
        // trigger a remote load, and even wait for it, with very bad side effects:
        // - 'unauthorized' remote error, if there are no credentials (anonymous user)
        // - worse performance, waiting for a remote request in order to start
        // (the app must be able to start up without remote connection), while
        // - remote data is not needed at all; if user is logged, the required
        // data is ever locally stored
        return userProfile.loadFromLocal()
        .then(function() {
            // we have a global reference to 'user' in place that
            // got updated with loadFromLocal
            if (!user.isAnonymous()) {
                userProfile.sync();
            }
        });
    };

    // Try to restore a user session ('remember login')
    var session = require('./data/session');
    session.restore()
    .then(preloadUserProfile)
    .then(app.shell.run.bind(app.shell))
    .then(connectUserNavbar)
    .then(setupOnboarding)
    .then(setAppAsReady)
    .catch(alertError);

    // DEBUG
    window.app = app;
};

// App init on page ready and phonegap ready
if (window.cordova) {
    // On DOM-Ready first
    $(function() {
        // Page is ready, device is too?
        // Note: Cordova ensures to call the handler even if the
        // event was already fired, so is good to do it inside
        // the dom-ready and we are ensuring that everything is
        // ready.
        $(document).on('deviceready', appInit);
    });
} else {
    // Only on DOM-Ready, for in browser development
    $(appInit);
}
