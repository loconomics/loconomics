/**
 * PrivacySettings
 *
 * @module activities/privacy-settings
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import onboarding from '../../data/onboarding';
import privacySettings from '../../data/privacySettings';
import { show as showError } from '../../modals/error';
import template from './template.html';
import { data as user } from '../../data/userProfile';

const ROUTE_NAME = 'privacy-settings';

const helpLinkProfessionals = '/help/relatedArticles/201967106-protecting-your-privacy';
const helpLinkClients = '/help/relatedArticles/201960903-protecting-your-privacy';

export default class PrivacySettings extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.navBar = new Activity.NavBar(getNavBar());
        this.title = 'Privacy settings';

        this.__defViewProperties();
        this.__defViewMethods();
        this.__connectHandlers();
    }

    __defViewProperties() {
        this.isServiceProfessional = user.isServiceProfessional;
        this.helpLink = ko.pureComputed(() => {
            const link = user.isServiceProfessional() ?
                helpLinkProfessionals :
                helpLinkClients;
            return link;
        });
        this.__settingsVersion = privacySettings.newVersion();
        this.__settingsVersion.isObsolete.subscribe((itIs) => {
            if (itIs) {
                // new version from server while editing
                // FUTURE: warn about a new remote version asking
                // confirmation to load them or discard and overwrite them;
                // the same is need on save(), and on server response
                // with a 509:Conflict status (its body must contain the
                // server version).
                // Right now, just overwrite current changes with
                // remote ones:
                this.__settingsVersion.pull({ evenIfNewer: true });
            }
        });
        // Actual data for the form:
        this.settings = this.__settingsVersion.version;
        this.isLocked = privacySettings.isLocked;
        this.submitText = ko.pureComputed(() => {
            const r =
            privacySettings.isLoading() ?
            'loading...' :
            privacySettings.isSaving() ?
            'saving...' :
            //else/default
            'Save';
            return r;
        });
    }

    __defViewMethods() {
        this.discard = () => {
            this.__settingsVersion.pull({ evenIfNewer: true });
        };
        this.save = () => {
            this.__settingsVersion.pushSave()
            .then(() => {
                this.app.successSave();
            })
            .catch(() => {
                // catch error, managed on event
            });
        };
    }

    __connectHandlers() {
        this.registerHandler({
            target: privacySettings,
            event: 'error',
            handler: (err) => {
                var msg = err.task === 'save' ? 'Error saving privacy settings.' : 'Error loading privacy settings.';
                showError({
                    title: msg,
                    error: err && err.task && err.error || err
                });
            }
        });
    }

    updateNavBarState() {
        if (!onboarding.updateNavBar(this.navBar)) {
            // Reset
            this.navBar.model.updateWith(getNavBar(), true);
        }
    }

    show(state) {
        super.show(state);

        // Keep data updated:
        privacySettings.sync();
        // Discard any previous unsaved edit
        this.discard();
        this.updateNavBarState();
    }
}

activities.register(ROUTE_NAME, PrivacySettings);

// Utils
const serviceProfessionalNavBar = Activity.createSubsectionNavBar('Account', {
    backLink: '/account',
    helpLink: helpLinkProfessionals
}).model.toPlainObject(true);
const clientNavBar = Activity.createSubsectionNavBar('Account', {
    backLink: '/account',
    helpLink: helpLinkClients
}).model.toPlainObject(true);

function getNavBar() {
    return user.isServiceProfessional() ? serviceProfessionalNavBar : clientNavBar;
}
