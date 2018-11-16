/**
 * PaymentAccount
 *
 * @module activities/payment-account
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import PostalCodeVM from '../../viewmodels/PostalCode';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import onboarding from '../../data/onboarding';
import paymentAccount from '../../data/paymentAccount';
import { show as showError } from '../../modals/error';
import style from './style.styl';
import template from './template.html';

const ROUTE_NAME = 'payment-account';

export default class PaymentAccount extends Activity {

    static get template() { return template; }

    static get style() { return style; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.helpLink = '/help/relatedArticles/201967096-accepting-and-receiving-payments';
        this.navBar = Activity.createSubsectionNavBar('Account', {
            backLink: '/account',
            helpLink: this.helpLink
        });
        this.defaultNavBar = this.navBar.model.toPlainObject(true);
        this.title = 'Payment Account';

        this.__defViewProperties();
        this.__defViewMethods();
        this.__registerErrorHandler();
    }

    __defViewProperties() {
        this.isInOnboarding = onboarding.inProgress;
        /**
         * Sets if the form must reduce the number of fields.
         * This is enabled automatically if we are in onboarding
         * (change is observed, and is set too at the 'discard' method).
         * Additionally, the value switchs off if an error is throw on saving,
         * letting the user to fix any error at hidden fields (#196)
         */
        this.simplifiedFormEnabled = ko.observable(false);
        this.isInOnboarding.subscribe((itIs) => this.simplifiedFormEnabled(itIs));
        this.errorMessages = paymentAccount.errorMessages;
        this.__dataVersion = paymentAccount.newVersion();
        this.__dataVersion.isObsolete.subscribe((itIs) => {
            if (itIs) {
                // new version from server while editing
                // FUTURE: warn about a new remote version asking
                // confirmation to load them or discard and overwrite them;
                // the same is need on save(), and on server response
                // with a 509:Conflict status (its body must contain the
                // server version).
                // Right now, just overwrite current changes with
                // remote ones:
                this.__dataVersion.pull({ evenIfNewer: true });
                this.formVisible(!this.__dataVersion.version.status());
            }
        });
        // Actual data for the form:
        this.paymentAccount = this.__dataVersion.version;
        this.isLocked = paymentAccount.isLocked;
        this.submitText = ko.pureComputed(() => {
            const t =
                onboarding.inProgress() ?
                'Save and continue' :
                paymentAccount.isLoading() ?
                'loading...' :
                paymentAccount.isSaving() ?
                'saving...' :
                //else/default
                'Save';
            return t;
        });
        this.formVisible = ko.observable(false);
        /// Postal Code
        this.errorMessages = {
            postalCode: ko.observable()
        };
        // On change to a valid code, do remote look-up
        this.postalCodeVM = new PostalCodeVM({
            address: this.paymentAccount,
            postalCodeError: this.errorMessages.postalCode
        });
        // Postal code VM needs to know when the form data has loaded
        paymentAccount.isLoading.subscribe((isLoading) => {
            if(!isLoading) {
                this.postalCodeVM.onFormLoaded();
            }
        });
        /// Kind of account
        // Null by default, since it represents an immediate selection from the user for current session.
        this.userSelectedAccount = ko.observable(null);
        this.isVenmoAccount = ko.pureComputed(() => {
            // Quick return: on user selection
            if (this.userSelectedAccount()) {
                return this.userSelectedAccount() === 'venmo';
            }
            // On new record, no status, show as 'is bank', so 'false' here:
            if (!this.paymentAccount.status()) return false;
            // If there is no bank data, is Venmo
            return !(this.paymentAccount.accountNumber() && this.paymentAccount.routingNumber());
        });
        this.isBankAccount = ko.pureComputed(() => !this.isVenmoAccount());
    }

    __defViewMethods() {
        this.discard = () => {
            this.__dataVersion.pull({ evenIfNewer: true });
            this.formVisible(!this.__dataVersion.version.status());
            this.userSelectedAccount(null);
            this.simplifiedFormEnabled(this.isInOnboarding());
        };
        this.save = () => {
            // If clicking 'save and continue' and no form visible
            // just skip saving:
            // is at onboarding, user has added payment info already and didn't
            // want to edit it. This allows to skip some buggy situations #196
            if (this.isInOnboarding() &&
                this.__dataVersion.version.status() &&
                !this.formVisible()) {
                onboarding.goNext();
            }
            else {
                // Save
                this.__dataVersion.pushSave()
                .then(() => {
                    // Move forward:
                    if (onboarding.inProgress()) {
                        onboarding.goNext();
                    } else {
                        this.app.successSave();
                    }
                })
                // Show all fields, letting user to fix error in previously
                // hidden fields.
                .catch(() => this.simplifiedFormEnabled(false));
            }
        };
        this.onSkip = () => this.app.model.onboarding.goNext();
        this.showForm = () => this.formVisible(true);
        this.chooseVenmoAccount = () => this.userSelectedAccount('venmo');
        this.chooseBankAccount = () => this.userSelectedAccount('bank');
    }

    __registerErrorHandler() {
        this.registerHandler({
            target: paymentAccount,
            event: 'error',
            handler: (err) => {
                var msg = err.task === 'save' ? 'Unable to save your payment account.' : 'Unable to load your payment account.';
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
            this.navBar.model.updateWith(this.defaultNavBar, true);
        }
    }

    show(state) {
        super.show(state);

        this.updateNavBarState();
        // Discard any previous unsaved edit
        this.viewModel.discard();
        // Keep data updated:
        paymentAccount.sync();
    }
}

activities.register(ROUTE_NAME, PaymentAccount);
