/**
 * FeedbackForm
 *
 * @module activities/feedback-form
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import * as userProfile from '../../data/userProfile';
import Activity from '../../components/Activity';
import VocElementEnum from '../../models/VocElementEnum';
import feedback from '../../data/feedback';
import ko from 'knockout';
import onboarding from '../../data/onboarding';
import { show as showError } from '../../modals/error';
import template from './template.html';

const ROUTE_NAME = 'feedback-form';
const user = userProfile.data;
const helpLinkProfessionals = '/help/relatedArticles/201960863-providing-feedback-to-us';
const helpLinkClients = '/help/relatedArticles/202894686-providing-feedback-to-us';

export default class FeedbackForm extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = null;
        this.helpLink = ko.pureComputed(() => user.isServiceProfessional() && helpLinkProfessionals || helpLinkClients);
        this.navBar = new Activity.NavBar(getNavBar());
        this.title('Send us feedback');

        this.__defViewProperties();
        this.__defViewMethods();
    }

    __defViewProperties() {
        this.isInOnboarding = onboarding.inProgress;
        this.message = ko.observable('');
        this.becomeCollaborator = ko.observable(false);
        // Get reference to know if is already a collaborator
        this.isCollaborator = user.isCollaborator;
        this.isSending = ko.observable(false);
        this.vocElementID = ko.observable(0);
        this.emailSubject = ko.observable('');

        this.submitText = ko.pureComputed(() => this.isSending() && 'Sending..' || 'Send');

        this.isValid = ko.pureComputed(() => {
            var m = this.message();
            return m && !/^\s*$/.test(m);
        });

        this.anonymousButtonUrl = ko.pureComputed(() => {
            if (!user.isAnonymous()) return '';

            var subject = encodeURIComponent('Feedback');
            var body = encodeURIComponent(this.message());
            var url = 'mailto:support@loconomics.com?subject=' + subject + '&body=' + body;
            return url;
        });
    }

    __defViewMethods() {
        this.send = () => {
            // Check is valid, and do nothing if not
            if (!this.isValid() || user.isAnonymous()) {
                return;
            }
            this.isSending(true);
            feedback.postIdea({
                message: this.message(),
                becomeCollaborator: this.becomeCollaborator(),
                vocElementID: this.vocElementID()
            })
            .then(() => {
                // Update local profile in case marked becameCollaborator and was not already
                if (!this.isCollaborator() && this.becomeCollaborator()) {
                    // Tag locally already
                    this.isCollaborator(true);
                    // But ask the profile to update, by request a 'save' even if
                    // will not save the flag but will get it updated from database and will cache it
                    userProfile.save();
                }
                // Success
                this.app.successSave({
                    message: 'Sent! Thank you for your input.'
                });
                // Reset after being sent
                this.message('');
                this.becomeCollaborator(false);
            })
            .catch((error) => {
                showError({
                    title: 'There was an error sending your feedback',
                    error
                });
            })
            .then(() => {
                // Always
                this.isSending(false);
            });
        };
    }

    show(state) {
        super.show(state);

        this.updateNavBarState();

        var params = state.route.segments || [];
        var elementName = params[0] || '';
        var elementID = VocElementEnum[elementName] |0;

        this.message(state.route.query.body || state.route.query.message || '');

        if (!elementName) {
            console.warn('Feedback Ideas: Accessing feedback without specify an element, using General (0)');
        }
        else if (!VocElementEnum.hasOwnProperty(elementName)) {
            console.error('Feedback Ideas: given a bad VOC Element name:', elementName);
        }

        this.vocElementID(elementID);
    }

    updateNavBarState() {
        if (!onboarding.updateNavBar(this.navBar)) {
            // Reset
            this.navBar.model.updateWith(getNavBar(), true);
        }
    }
}

activities.register(ROUTE_NAME, FeedbackForm);

/// Utils
const serviceProfessionalNavBar = Activity.createSubsectionNavBar('Back', {
    helpLink: helpLinkProfessionals
}).model.toPlainObject(true);
const clientNavBar = Activity.createSubsectionNavBar('Back', {
    helpLink: helpLinkClients
}).model.toPlainObject(true);

function getNavBar() {
    return user.isServiceProfessional() ? serviceProfessionalNavBar : clientNavBar;
}
