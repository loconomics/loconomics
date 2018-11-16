/**
 * OwnerAcknowledgment
 *
 * @module activities/owner-acknowledgment
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import ownerAcknowledgment from '../../data/ownerAcknowledgment';
import { show as showError } from '../../modals/error';
import style from './style.styl';
import template from './template.html';

const ROUTE_NAME = 'owner-acknowledgment';

export default class OwnerAcknowledgment extends Activity {

    static get template() { return template; }

    static get style() { return style; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.navBar = Activity.createSubsectionNavBar('Cooperative', {
            backLink: '/account',
            helpLink: '/help/relatedArticles/201964153-how-owner-user-fees-work'
        });
        this.title = 'Cooperative Owner Disclosure';

        this.isLoading = ownerAcknowledgment.isLoading;
        this.isSaving = ownerAcknowledgment.isSaving;
        this.acknowledgment = ownerAcknowledgment.data;
        this.ownerFullName = ko.observable('');
    }

    reset() {
        this.ownerFullName('');
    }

    acknowledge() {
        ownerAcknowledgment
        .acknowledge({ ownerFullName: this.ownerFullName() })
        .then(() => {
            this.app.successSave();
        })
        .catch(function(error) {
            showError({
                title: 'Error saving',
                error
            });
        });
    }

    show(state) {
        super.show(state);

        this.reset();
        // Load data, if any
        ownerAcknowledgment.sync();
    }
}

activities.register(ROUTE_NAME, OwnerAcknowledgment);
