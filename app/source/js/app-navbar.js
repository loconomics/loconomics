/**
    Navbar extension of the App,
    adds the elements to manage a view model
    for the NavBar and automatic changes
    under some model changes like user login/logout
**/
'use strict';

import { amICollegeAdmin, amIPartnerAdmin } from './utils/partnerAdminAccessControl';

var ko = require('knockout');
var $ = require('jquery');
var NavBar = require('./viewmodels/NavBar');
var NavAction = require('./viewmodels/NavAction');
var user = require('./data/userProfile').data;

// Components in use by the AppNav template
require('./kocomponents/smart-nav-bar-action');

exports.extend = function (app) {

    // REVIEW: still needed? Maybe the per activity navBar means
    // this is not needed. Some previous logic was already removed
    // because was useless.
    //
    // Adjust the navbar setup depending on current user,
    // since different things are need for logged-in/out.
    function adjustUserBar() {
        /* eslint complexity:"off" */

        if (user.isAnonymous()) {
            var prev = app.navBar().leftAction();
            if (prev !== NavAction.menuIn) {
                app.navBar().leftAction(NavAction.menuIn);
                app.navBar().prevLeftAction = prev;
            }
            var prevRight = app.navBar().rightAction();
            if (prevRight === NavAction.menuNewItem) {
                app.navBar().rightAction(null);
                app.navBar().prevRightAction = prevRight;
            }
        }
        else {
            if (app.navBar().prevLeftAction) {
                app.navBar().leftAction(app.navBar().prevLeftAction);
                app.navBar().prevLeftAction = null;
            }
            // If we are in a 'section' activity, that is with the menuNewItem in the rightAction,
            // we need to change it for just-client profiles:
            if (!user.isServiceProfessional()) {
                // Only if is menuNewItem, otherwise we do NOT restore preRightAction (thats why
                // the nested 'if' rather than 'professional AND menuNewItem').
                if (app.navBar().rightAction() === NavAction.menuNewItem) {
                    // Replace default right-menu for professionals by
                    // a client link to go marketplace
                    app.navBar().preRightAction = app.navBar().rightAction();
                    app.navBar().rightAction(NavAction.goMarketplace);
                }
            }
            else if (app.navBar().preRightAction) {
                // Recovering previous right action, like after change it to a just-client option
                // and then entering with service-professional profile
                app.navBar().rightAction(app.navBar().preRightAction);
                app.navBar().preRightAction = null;
            }
        }
    }

    app.navBar = ko.observable(null);

    var refreshNav = function refreshNav() {
        // Trigger event to force a component update
        $('.AppNav').trigger('contentChange');
    };
    var autoRefreshNav = function autoRefreshNav(action) {
        if (action) {
            action.text.subscribe(refreshNav);
            action.isTitle.subscribe(refreshNav);
            action.icon.subscribe(refreshNav);
            action.isMenu.subscribe(refreshNav);
        }
    };

    /**
        Update the nav model using the Activity defaults
        // TODO Look a way to replace all this complex navbar logic, maybe per
        // activity nabvars, more model helpers and global state helpers.
    **/
    app.updateAppNav = function updateAppNav(activity, state) {

        // if the activity has its own
        if ('navBar' in activity) {
            if (activity.navBar === null) {
                // Activity requires no menu, create a hidden NavBar instance
                app.navBar(new NavBar({
                    hidden: true
                }));
            }
            else {
                // Use specializied activity bar data
                app.navBar(activity.navBar);
            }
        }
        else {
            // Use default one
            app.navBar(new NavBar());
        }

        if (!app.applyNavbarMustReturn(state)) {
            // Changes depending on non-logged user
            adjustUserBar();
        }

        refreshNav();
        autoRefreshNav(app.navBar().leftAction());
        autoRefreshNav(app.navBar().rightAction());
    };

    /**
     * It describes the values of a return-to request
     * @typedef {Object} ReturnRequestInfo
     * @property {string} [link] Local URL where the request must return to
     * @property {bool} isGoBack It's true in case must return with a 'go back'
     * call; it discards the link value since it will just go to previous step,
     * and the link value is required if this is false.
     * @property {string} [label] Text to display in the 'return' link
     */

    /**
     * Looks for parameters in the navigation state requesting to
     * use a specific setting for the current activity 'back' button.
     * It returns an object with values properly processed describing
     * the desired place to go back, or null if no parameters are present.
     * @returns {ReturnRequestInfo} Null if nothing is requested.
     */
    app.getReturnRequestInfo = function(state) {
        var q = state && state.route && state.route.query;

        if (q.mustReturn) {
            var data = {
                link: null,
                label: null,
                isGoBack: false
            };

            // Link: auto goBack or explicit link
            var returnLink = decodeURIComponent(q.mustReturn);
            if (returnLink === '1' || returnLink === 'true') {
                data.isGoBack = true;
            }
            else {
                data.link = returnLink;
            }
            // A text can be provided
            data.label = decodeURIComponent(q.returnText || '');
            return data;
        }
        return null;
    };

    /**
     * Detects parameters requesting a specific 'go back' behavior
     * and updates the navbar to reflect that, or left untouched if
     * no parameters present.
     * Parameter that triggers the logic: state.route.query.mustReturn
     * Optional parameter: state.route.query.returnText
     * @returns {bool} True if parameters present and changes to navbar
     * were applied, false if untouched.
     */
    app.applyNavbarMustReturn = function(state) {
        var info = app.getReturnRequestInfo(state);
        if (info) {
            if (info.isGoBack) {
                // Left action forced to be a go-back
                app.navBar().leftAction(NavAction.goBack.model.clone({
                    text: info.label,
                    isShell: true,
                    isTitle: true
                }));
            }
            else {
                // Left action force to return to the given URL
                app.navBar().leftAction(NavAction.goBack.model.clone({
                    link: info.link,
                    text: info.label,
                    isShell: false,
                    isTitle: true
                }));
            }
            return true;
        }
        return false;
    };


    /**
        Update the app menu to highlight the
        given link name
    **/
    app.updateMenu = function updateMenu(/*name*/) {

        var $menu = $('.App-menus .navbar-collapse');

        /* DONE WITH KNOCKOUT BINDING RIGHT NOW
        // Remove any active
        $menu
        .find('li')
        .removeClass('active');
        // Add active
        $menu
        .find('.go-' + name)
        .closest('li')
        .addClass('active');
        */

        // Hide menu
        $menu
        .filter(':visible')
        .collapse('hide');
    };

    // Set model for the AppNav
    app.navBarBinding = {
        navBar: app.navBar,
        // Both: are later filled with a call to the model once loaded and ready
        photoUrl: ko.observable('about:blank'),
        userName: ko.observable('Me'),
        isServiceProfessional: ko.observable(false),
        isClient: ko.observable(false),
        isApp: ko.observable(!!window.cordova),
        isInOnboarding: ko.observable(false),
        isAtCurrentOnboardingStep: ko.observable(false),
        active: ko.observable('')
    };

    var onboarding = require('./data/onboarding');
    ko.computed(function() {
        app.navBarBinding.isInOnboarding(onboarding.inProgress());
        app.navBarBinding.isAtCurrentOnboardingStep(onboarding.isAtCurrentStep());
    });

    app.navBarBinding.continueOnboarding = function() {
        onboarding.goCurrentStep();
    };

    app.shell.on(app.shell.events.itemReady, function() {
        app.navBarBinding.active(app.shell.currentRoute.name);
    });

    app.navBarBinding.isAnonymous = ko.pureComputed(function() {
        return !this.isServiceProfessional() && !this.isClient();
    }, app.navBarBinding);

    app.navBarBinding.cssIfActive = function(activityName) {
        return ko.computed(function() {
            return activityName === app.navBarBinding.active() ? 'active' : '';
        });
    };

    app.navBarBinding.isPartnerAdmin = ko.pureComputed(() => amIPartnerAdmin());
    app.navBarBinding.isCollegeAdmin = ko.pureComputed(() => amICollegeAdmin());

    app.setupNavBarBinding = function setupNavBarBinding() {
        app.navBarBinding.isApp(!!window.cordova);
        ko.applyBindings(app.navBarBinding, $('.AppNav').get(0));
    };

    /**
        Performs the 'back' task from the navbar link, if any.
        That is, trigger the left action.
        Fallback to shell goBack
    **/
    app.performsNavBarBack = function performsNavBarBack(options) {
        var nav = this.navBar();
        var left = nav && nav.leftAction();
        var $btn = $('.AppNav .SmartNavBar-edge.left > a.SmartNavBar-btn');

        // There is an action, trigger like a click so all the handlers
        // attached on spare places do their work:
        if (left && !left.isMenu()) {
            var event = $.Event('click');
            event.options = options || {};
            $btn.trigger(event);
        }
        else if (this.shell) {
            this.shell.goBack();
        }
    };

    /**
        It shows an unobtrusive notification on the navbar place, that
        hides after a short timeout
    **/
    var lastNotificationTimer = null;
    app.showNavBarNotification = function showNavBarNotification(settings) {
        var msg = settings && settings.message || 'Hello World!';
        var duration = settings && settings.duration || 2000;
        var transitionDuration = settings && settings.transitionDuration || 400;
        var $el = $('.AppNav .SmartNavBar-notification');

        $el.text(msg);
        $el.fadeIn(transitionDuration)
        .queue(function() {

            // Manual hide on clicking
            $el
            .off('click.manualHide')
            .on('click.manualHide', function() {
                $el.fadeOut(transitionDuration);
            });

            // Auto hide after timeout
            clearTimeout(lastNotificationTimer);
            lastNotificationTimer = setTimeout(function() {
                $el.fadeOut(transitionDuration);
            }, duration);

            $(this).dequeue();
        });
    };
};
