/**
 * UserFees
 *
 * @module activities/user-fees
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import Address from '../../models/Address';
import InputPaymentMethod from '../../models/InputPaymentMethod';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import paymentPlans from '../../data/paymentPlans';
import { show as showError } from '../../modals/error';
import { show as showNotification } from '../../modals/notification';
import template from './template.html';
import userPaymentPlan from '../../data/userPaymentPlan';

const ROUTE_NAME = 'user-fees';

export default class UserFees extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.helpLink = '/help/relatedArticles/201964153-how-owner-user-fees-work';
        this.navBar = Activity.createSubsectionNavBar('Account', {
            backLink: '/account',
            helpLink: this.helpLink
        });
        this.title = 'Loconomics plans';

        this.__defViewProperties();
        this.__defViewMethods();
    }

    __defViewProperties() {
        this.plans = paymentPlans.availablePlans;
        this.activeUserPaymentPlan = userPaymentPlan.data;
        this.selectedPaymentPlanID = ko.observable('');
        this.paymentMethod = new InputPaymentMethod();
        this.paymentMethod.billingAddress(new Address());
        this.isLoading = ko.pureComputed(() => paymentPlans.state.isLoading() || userPaymentPlan.isLoading());
        this.isSaving = ko.observable(false);
        this.isLocked = ko.pureComputed(() => this.isLoading() || this.isSaving());
        this.isNew = this.activeUserPaymentPlan.isNew;
        this.activePaymentPlan = ko.pureComputed(() => {
            var id = this.activeUserPaymentPlan.paymentPlan();
            if (id) {
                return paymentPlans.getObservableItem(id)();
            }
            else {
                return null;
            }
        });
        this.submitText = ko.pureComputed(() => {
            const r =
            this.isLoading() ?
            'loading...' :
            this.isSaving() ?
            'saving...' :
            //else/default
            'Save';
            return r;
        });
    }

    __defViewMethods() {
        var createSubscription = () => {
            var plain = {
                paymentPlan: this.selectedPaymentPlanID(),
                paymentMethod: this.paymentMethod.model.toPlainObject(true)
            };
            userPaymentPlan.createSubscription(plain)
            .then(() => {
                this.isSaving(false);
                showNotification({
                    title: 'Payment plan saved',
                    message: 'Thank you'
                })
                .then(() => {
                    // Move forward:
                    this.app.successSave();
                });
            })
            .catch((error) => {
                this.isSaving(false);
                showError({
                    title: 'Error creating your subscription',
                    error
                });
            });
        };
        this.save = () => {
            this.isSaving(true);
            if (this.isNew()) {
                createSubscription();
            }
            else {
                throw {
                    name: 'NotImplemented',
                    description: 'Change active plan'
                };
            }
        };
        this.changePlan = () => {
            showNotification({
                title: 'Not Implemented',
                message: 'Not Implemented'
            });
        };
    }

    show(state) {
        super.show(state);

        // Request to sync plans, just in case there are remote changes
        paymentPlans.sync();
        // Load active plan, if any
        userPaymentPlan.sync();
    }
}

activities.register(ROUTE_NAME, UserFees);
