/**
 * ContactForm
 *
 * @module activities/contact-form
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import VocElementEnum from '../../models/VocElementEnum';
import feedback from '../../data/feedback';
import ko from 'knockout';
import onboarding from '../../data/onboarding';
import { show as showError } from '../../modals/error';
import template from './template.html';
import { data as user } from '../../data/userProfile';

const ROUTE_NAME = 'contact-form';

export default class ContactForm extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = null;
        this.navBar = Activity.createSubsectionNavBar('Back');
        this.title = 'Contact us';

        // View properties
        this.isInOnboarding = onboarding.inProgress;
        this.message = ko.observable('');
        this.isSending = ko.observable(false);
        this.vocElementID = ko.observable(0);
        this.emailSubject = ko.observable('');

        this.submitText = ko.pureComputed(() => {
            const label = this.isSending() ? 'Sending..' : 'Send';
            return label;
        });
        this.isValid = ko.pureComputed(() => {
            var m = this.message();
            return m && !/^\s*$/.test(m);
        });
        this.anonymousButtonUrl = ko.pureComputed(() => {
            if (!user.isAnonymous()) return '';

            var subject = encodeURIComponent(this.emailSubject() || 'I need help!');
            var body = encodeURIComponent(this.message());
            var url = 'mailto:support@loconomics.com?subject=' + subject + '&body=' + body;
            return url;
        });

        // View methods
        this.send = () => {
            // Check is valid, and do nothing if not
            if (!this.isValid() || user.isAnonymous()) {
                return;
            }
            this.isSending(true);
            var msg = this.message();
            if (this.emailSubject()) {
                msg = this.emailSubject() + ': ' + msg;
            }
            feedback.postSupport({
                message: msg,
                vocElementID: this.vocElementID()
            })
            .then(function() {
                // Success
                app.successSave({
                    message: 'Thank you, we\'ll be in touch soon!'
                });
                // Reset after being sent
                this.message('');
            }.bind(this))
            .catch(function(err) {
                showError({
                    title: 'There was an error sending your feedback',
                    error: err
                });
            })
            .then(function() {
                // Always
                this.isSending(false);
            }.bind(this));
        };
    }

    show(state) {
        super.show(state);

        var params = state.route.segments || [];
        var elementName = params[0] || '';
        var elementID = VocElementEnum[elementName] |0;

        this.emailSubject(state.route.query.subject || '');
        this.message(state.route.query.body || state.route.query.message || '');

        if (!elementName) {
            console.warn('Feedback Support: Accessing without specify an element, using General (0)');
        }
        else if (!VocElementEnum.hasOwnProperty(elementName)) {
            console.error('Feedback Support: given a bad VOC Element name:', elementName);
        }

        this.vocElementID(elementID);
    }
}

activities.register(ROUTE_NAME, ContactForm);
