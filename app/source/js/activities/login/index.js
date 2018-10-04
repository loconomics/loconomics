/**
 * Login
 *
 * @module activities/login
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import FormCredentials from '../../viewmodels/FormCredentials';
import UserType from '../../enums/UserType';
import ValidatedPasswordViewModel from '../../viewmodels/ValidatedPassword';
import auth from '../../data/auth';
import fb from '../../utils/facebookUtils';
import ko from 'knockout';
import onboarding from '../../data/onboarding';
import shell from '../../app.shell';
import { show as showError } from '../../modals/error';
import { show as showNotification } from '../../modals/notification';
import template from './template.html';
import { data as user } from '../../data/userProfile';

const ROUTE_NAME = 'login';

export default class Login extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.navBar = Activity.createSectionNavBar(null);
        this.title = 'Sign in to your account';

        this.__defViewProperties();
        this.__defViewMethods();
        this.__syncViewAndUrl();

        // Preload Facebook lib to speed-up the button reaction
        fb.load();
    }

    __defViewProperties() {
        var credentials = new FormCredentials();
        this.username = credentials.username;
        this.password = credentials.password;
        this.validatedPassword = new ValidatedPasswordViewModel();
        this.resetToken = ko.observable('');
        this.view = ko.observable('login');
        this.requestResetMessage = ko.observable('');
        this.isWorking = ko.observable(false);
        this.redirectUrl = ko.observable('');

        this.loginButtonText = ko.pureComputed(() => this.isWorking() && 'Signing you in...' || 'Sign in');
        this.requestResetButtonText = ko.pureComputed(() => this.isWorking() && 'Requesting a reset code...' || 'Reset my password');
        this.confirmResetButtonText = ko.pureComputed(() => this.isWorking() && 'Resetting password...' || 'Reset my password');
        this.facebookButtonText = ko.pureComputed(() => fb.isReady() && 'Sign in with Facebook' || 'Loading Facebook...');
        this.enableFacebookButton = ko.pureComputed(() => fb.isReady());
    }

    __defViewMethods() {
        this.reset = () => {
            this.username('');
            this.password('');
            this.validatedPassword.reset();
            this.resetToken('');
            this.requestResetMessage('');
            this.isWorking(false);
            // The view is NEVER reset here, because can cause infinite loops. Must be managed outside by the
            // activity.show, properly.
            //this.view('login');
        };

        this.performLogin = () => {
            // Validation
            if (this.username.error() ||
                this.password.error() ||
                !this.username() ||
                !this.password()) {
                showError({
                    title: 'Validation',
                    error: 'Type a valid e-mail and a password'
                });
                return;
            }
            this.isWorking(true);

            auth.login(
                this.username(),
                this.password()
            ).then((/*loginData*/) => {
                // Is implicit at reset: this.isWorking(false);
                this.reset();
                this.isWorking(false);

                onboarding.setStep(user.onboardingStep());

                if (onboarding.goIfEnabled()) {
                    return;
                }
                else if (this.redirectUrl()) {
                    shell.go(this.redirectUrl());
                }
                else {
                    this.app.goDashboard();
                }
            })
            .catch((err) => {
                this.isWorking(false);
                var msg = err && err.responseJSON && err.responseJSON.errorMessage ||
                    err && err.statusText ||
                    'Invalid username or password';
                showError({
                    title: 'Error logging in',
                    error: msg
                });
            });
        };

        this.requestReset = () => {
            this.isWorking(true);
            auth.resetPassword({ username: this.username() })
            .then((result) => {
                this.requestResetMessage(result.message);
                this.isWorking(false);
                this.goConfirm();
            })
            .catch((error) => {
                this.isWorking(false);
                showError({
                    title: 'Error requesting a password reset',
                    error: error
                });
            });
        };

        this.confirmReset = () => {
            if (!this.validatedPassword.isValid()) {
                showError({
                    title: 'Validation',
                    error: 'Please create a valid password'
                });
                return;
            }

            this.isWorking(true);

            auth.confirmResetPassword({
                password: this.validatedPassword.password(),
                token: this.resetToken()
            })
            .then((result) => {
                showNotification({
                    title: 'Done!',
                    message: result.message
                });
                this.isWorking(false);
                this.goLogin();
            })
            .catch((error) => {
                this.isWorking(false);
                showError({
                    title: 'Error resetting the password',
                    error: error
                });
            });
        };

        // Facebook Login
        this.facebook = () => {
            facebookLogin()
            .then((result) => {
                var accessToken = result.authResponse && result.authResponse.accessToken || result.auth && result.auth.accessToken;
                this.isWorking(true);
                return auth.facebookLogin(accessToken)
                .then((/*loginData*/) => {
                    // Is implicit at reset: this.isWorking(false);
                    this.reset();
                    this.isWorking(false);

                    if (this.redirectUrl()) {
                        shell.go(this.redirectUrl());
                    }
                    else {
                        this.app.goDashboard();
                    }
                });
            })
            .catch((err) => {
                this.isWorking(false);
                var msg = err && err.responseJSON && err.responseJSON.errorMessage ||
                    err && err.statusText ||
                    'Invalid Facebook login';
                showError({
                    title: 'Error logging in',
                    error: msg
                });
            });
        };

        this.goLogin = () => {
            this.view('login');
        };
        this.goReset = () => {
            this.view('reset-password');
        };
        this.goConfirm = () => {
            this.view('confirm-reset');
        };
    }

    __syncViewAndUrl() {
        this.registerHandler({
            target: this.view,
            handler: (view) => {
                if (!this.isNotFirstTime) return;
                switch (view) {
                    case 'reset-password': {
                        this.app.shell.pushState(undefined, undefined, '/login/reset-password');
                        break;
                    }
                    case 'confirm-reset': {
                        this.app.shell.pushState(undefined, undefined, '/login/reset-password/confirm');
                        break;
                    }
                    default:
                    case 'login': {
                        this.app.shell.pushState(undefined, undefined, '/login');
                        break;
                    }
                }
            }
        });
    }

    show(state) {
        super.show(state);

        this.reset();
        const params = state.route.segments;
        const query = state.route.query;

        var redirectUrl = state.redirectUrl || query.redirectUrl;
        if (!redirectUrl && state.requiredLevel) {
            // Called from the shell access control after a failed access to an activity,
            // automatically use previous activity and returning URL
            redirectUrl = shell.referrerRoute && shell.referrerRoute.url;
        }
        this.redirectUrl(redirectUrl);

        if (params[0] === 'reset-password') {
            var t = query.token || '';
            this.resetToken(t);
            if (params[1] === 'confirm') {
                this.goConfirm();
            }
            else {
                this.goReset();
            }
        }
        else {
            this.goLogin();
        }
        // Needed to avoid a problem of an early execution of the 'view handler' (at the super.show call)
        // that uses the default value for 'view' rather than the value that the URL sets.
        this.isNotFirstTime = true;
    }
}

activities.register(ROUTE_NAME, Login);

// Facebook login support: native/plugin or web?
var facebookLogin = function() {
    if (window.facebookConnectPlugin) {
        // native/plugin
        return new Promise((s, e) => {
            window.facebookConnectPlugin.login(['email'], s, e);
        });
    }
    else {
        return fb.login({ scope: 'email' });
    }
};
