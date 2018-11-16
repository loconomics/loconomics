/**
 * Welcome activity
 *
 * @module activities/welcome
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import onboarding from '../../data/onboarding';
import { pureComputed } from 'knockout';
import style from './style.styl';
import template from './template.html';
import userProfile from '../../data/userProfile';

const ROUTE_NAME = 'welcome';
const user = userProfile.data;

export default class WelcomeActivity extends Activity {

    static get template() { return template; }

    static get style() { return style; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        var serviceProfessionalNavBar = Activity.createSubsectionNavBar(onboarding.navbarTitle(), {
            leftAction: Activity.NavAction.goLogout,
            helpLink: this.helpLinkProfessionals
        });
        this.serviceProfessionalNavBar = serviceProfessionalNavBar.model.toPlainObject(true);
        var clientNavBar = Activity.createSubsectionNavBar(onboarding.navbarTitle(), {
            leftAction: Activity.NavAction.goLogout,
            helpLink: this.helpLinkClients
        });
        this.clientNavBar = clientNavBar.model.toPlainObject(true);
        this.navBar = user.isServiceProfessional() ? serviceProfessionalNavBar : clientNavBar;
        this.title = pureComputed(() => user.firstName() && `Welcome, ${user.firstName()}!` || ' Welcome!');

        /// TODO: Old ViewModel class members copied, need refactor
        this.isInOnboarding = onboarding.inProgress;
        this.isServiceProfessional = user.isServiceProfessional;
        this.helpLinkProfessionals = '/help/relatedArticles/201211855-getting-started';
        this.helpLinkClients = '/help/relatedArticles/201313875-getting-started';
        this.helpLink = pureComputed(() => user.isServiceProfessional() && this.helpLinkProfessionals || this.helpLinkClients);
        this.startProffesionalOnboarding = () => {
            userProfile.becomeServiceProfessional();
            onboarding.goNext();
        };
        this.startClientOnboarding = () => {
            onboarding.goNext();
        };
        this.isUSUser = user.isUSUser;
    }

    show(state) {
        super.show(state);

        this.updateNavBarState();

        // Country specific code:
        // If the user is non for the current country set-up (fixed as USA for now #728)
        // we are displaying a notice of non-availability while skipping onboarding
        // steps; to prevent they get trapped in onboarding forever #722, we should
        // immediately finish it.
        if (!user.isUSUser()) {
            onboarding.finish();
            userProfile.saveOnboardingStep(onboarding.stepName());
        }
    }

    updateNavBarState() {
        if (!onboarding.updateNavBar(this.navBar)) {
            // Reset
            var nav = user.isServiceProfessional() ? this.serviceProfessionalNavBar : this.clientNavBar;
            this.navBar.model.updateWith(nav, true);
        }
    }
}

activities.register(ROUTE_NAME, WelcomeActivity);
