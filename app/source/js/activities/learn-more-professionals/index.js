/**
 * Example of the most basic activity, implementing base properties and a
 * minimal template that uses an example component.
 *
 * @module activities/learn-more-professionals
 */

import '../../kocomponents/nav/website-footer';
import * as activities from '../index';
import { ActionForValue } from '../../kocomponents/job-title-autocomplete';
import Activity from '../../components/Activity';
import SignupVM from '../../viewmodels/Signup';
import ko from 'knockout';
import snapPoints from '../../utils/snapPoints';
import style from './style.styl';
import template from './template.html';
import { data as user } from '../../data/userProfile';

const ROUTE_NAME = 'learn-more-professionals';
const SIGNUP_ELEMENT_SELECTOR = '#learnMoreProfessionals-signup';

export default class LearnMoreProfessionalsActivity extends Activity {

    static get template() { return template; }

    static get style() { return style; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = null;
        this.navBar = Activity.createSectionNavBar(null);
        this.navBar.additionalNavClasses('AppNav--home');
        this.title = 'List your services';

        // TODO: Refactor all next lines

        this.nav = app.navBarBinding;

        this.isServiceProfessional = user.isServiceProfessional;
        this.isClient = user.isClient;

        this.registerHandler({
            target: this.$activity,
            event: 'scroll-fixed-header',
            handler: (e, what) => {
                var cs = this.navBar.additionalNavClasses();
                if (what === 'after') {
                    this.navBar.additionalNavClasses(cs + ' is-fixed');
                }
                else {
                    this.navBar.additionalNavClasses(cs.replace('is-fixed', ''));
                }
            }
        });

        ///
        /// Signup
        // Component API entry point: expects SignupVM
        this.signup = ko.observable();
        this.resetSignup = function() {
            var signup = this.signup();
            if (signup instanceof SignupVM) {
                signup.reset();

                // Presets: settings we require to keep the same
                // like untouched by the reset
                signup.profile(SignupVM.profileType.serviceProfessional);
                // Hide and preset the country
                signup.isCountryVisible(false);
                // default preset is already united state in the VM
            }
        };
        this.signup.subscribe(this.resetSignup.bind(this));
        // Redirect on success signup
        this.signupRedirect = function() {
            app.goDashboard();
        };
        this.setSignupJobTitle = function(id, name) {
            var signup = this.signup();
            if (signup instanceof SignupVM) {
                signup.jobTitleID(id || undefined);
                signup.jobTitleName(name || undefined);
            }
        };

        // A static utility (currently only used to conditionally show/hide DownloadApp links)
        this.inApp = ko.observable(!!window.cordova);

        /**
         * @member {KnockoutComputed<string>} suggestionButtonText Gives the text
         * for each suggestion button based on the action triggered after select
         * one
         */
        this.suggestionButtonText = ko.pureComputed(function() {
            var anon = user.isAnonymous();
            return anon ? 'Sign up' : 'Add';
        }, this);

        /**
         * @method onSelectJobTitle
         * Component event handler for selecting a suggested job-title:
         * - It moves anonymous users to the Sign-up form integrated on this
         *   activity, including the job-title for automatic addition.
         * - It moves non-anonymous users to dashboard 'add job title' activity
         *   to continue setting-up the selected one.
         * @param {string} jobTitleName As typed by the user or selected value
         * @param {Object} [jobTitle] Record for a selected job title; will be null
         * when no one exists and just a typed name is included.
         */
        this.onSelectJobTitle = function(jobTitleName, jobTitle) {
            var url;
            if (jobTitle && jobTitle.jobTitleID) {
                if (user.isAnonymous()) {
                    this.setSignupJobTitle(jobTitle.jobTitleID());
                    app.shell.scrollTo(SIGNUP_ELEMENT_SELECTOR, true);
                }
                else {
                    // For logged users, assist them to add the job title:
                    url = 'addJobTitle?s=' + encodeURIComponent(jobTitle.singularName()) +
                        '&id=' + encodeURIComponent(jobTitle.jobTitleID()) +
                        "&autoAddNew=true";
                    app.shell.go(url);
                }
            }
            else {
                if (user.isAnonymous()) {
                    this.setSignupJobTitle(null, jobTitleName);
                    app.shell.scrollTo(SIGNUP_ELEMENT_SELECTOR, true);
                }
                else {
                    // Go to addJobTitle
                    url = 'addJobTitle?s=' + encodeURIComponent(jobTitleName) + '&autoAddNew=true';
                    app.shell.go(url);
                }
            }
            return {
                value: ActionForValue.clear
            };
        }.bind(this);
    }

    _registerSnapPoints() {
        var pointsEvents = {
            // Just after start scrolling
            0: 'scroll-fixed-header'
        };

        snapPoints(this.$activity, pointsEvents);
    }

    show(state) {
        super.show(state);

        this._registerSnapPoints();
    }
}

activities.register(ROUTE_NAME, LearnMoreProfessionalsActivity);
