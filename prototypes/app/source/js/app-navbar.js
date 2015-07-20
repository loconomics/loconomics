/**
    Navbar extension of the App,
    adds the elements to manage a view model
    for the NavBar and automatic changes
    under some model changes like user login/logout
**/
'use strict';

var ko = require('knockout'),
    $ = require('jquery'),
    NavBar = require('./viewmodels/NavBar'),
    NavAction = require('./viewmodels/NavAction');

exports.extends = function (app) {
    
    // REVIEW: still needed? Maybe the per activity navBar means
    // this is not needed. Some previous logic was already removed
    // because was useless.
    //
    // Adjust the navbar setup depending on current user,
    // since different things are need for logged-in/out.
    function adjustUserBar() {

        var user = app.model.user();

        if (user.isAnonymous()) {
            app.navBar().leftAction(NavAction.menuOut);
        }
    }
    // Commented lines, used previously but unused now, it must be enough with the update
    // per activity change
    //app.model.user().isAnonymous.subscribe(updateStatesOnUserChange);
    //app.model.user().onboardingStep.subscribe(updateStatesOnUserChange);
    
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
    **/
    app.updateAppNav = function updateAppNav(activity, state) {

        // if the activity has its own
        if ('navBar' in activity) {
            // Use specializied activity bar data
            app.navBar(activity.navBar);
        }
        else {
            // Use default one
            app.navBar(new NavBar());
        }
        
        app.applyNavbarMustReturn(state);

        // TODO Double check if needed.
        // Latest changes, when needed
        adjustUserBar();
        
        refreshNav();
        autoRefreshNav(app.navBar().leftAction());
        autoRefreshNav(app.navBar().rightAction());
    };
    
    app.applyNavbarMustReturn = function(state) {
        if (state && state.route && state.route.query &&
            state.route.query.mustReturn) {
            var returnLink = decodeURIComponent(state.route.query.mustReturn);
            // A text can be provided
            var returnText = decodeURIComponent(state.route.query.returnText || '');

            if (returnLink === '1' || returnLink === 'true') {
                // Left action forced to be a go-back
                app.navBar().leftAction(NavAction.goBack.model.clone({
                    text: returnText,
                    isShell: true,
                    isTitle: true
                }));
            }
            else {
                // Left action force to return to the given URL
                app.navBar().leftAction(NavAction.goBack.model.clone({
                    link: returnLink,
                    text: returnText,
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
    app.updateMenu = function updateMenu(name) {
        
        var $menu = $('.App-menus .navbar-collapse');
        
        // Remove any active
        $menu
        .find('li')
        .removeClass('active');
        // Add active
        $menu
        .find('.go-' + name)
        .closest('li')
        .addClass('active');
        // Hide menu
        $menu
        .filter(':visible')
        .collapse('hide');
    };
    
    app.setupNavBarBinding = function setupNavBarBinding() {
        // Set model for the AppNav
        app.navBarBinding = {
            navBar: app.navBar,
            // Both: are later filled with a call to the model once loaded and ready
            photoUrl: ko.observable('about:blank'),
            userName: ko.observable('Me')
        };
        ko.applyBindings(app.navBarBinding, $('.AppNav').get(0));
    };
    
    /**
        Performs the 'back' task from the navbar link, if any.
        That is, trigger the left action.
        Fallback to shell goBack
    **/
    app.performsNavBarBack = function performsNavBarBack(options) {
        var nav = this.navBar(),
            left = nav && nav.leftAction(),
            $btn = $('.SmartNavBar-edge.left > a.SmartNavBar-btn');

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
        var msg = settings && settings.message || 'Hello World!',
            duration = settings && settings.duration || 2000,
            transitionDuration = settings && settings.transitionDuration || 400,
            $el = $('.AppNav .SmartNavBar-notification');

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
