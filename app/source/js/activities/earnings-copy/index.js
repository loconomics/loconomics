/**
 * Allows a professional to copy earning entries they have
 * entered in the past and edit the existing values to create
 * a new entry.
 *
 * @module activities/earnings-copy
 *
 */

import '../../kocomponents/earnings/editor';
import '../../kocomponents/earnings/list';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import template from './template.html';

const ROUTE_NAME = 'earnings-copy';

export default class EarningsCopyActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.navBar = Activity.createSubsectionNavBar('Add Earnings', {
            backLink: '/earnings-add'
        });

        this.earningsEntryID = ko.observable();

        /// Steps management
        /**
         * Keeps track of the current step being displayed
         * @member {KnockoutObservable<number>}
         */
        this.currentStep = ko.observable(1);

        /**
         * Returns which step the user is on in the form.
         * @member {KnockoutComputed<boolean>}
         */
        this.isAtStep = function(number) {
            return ko.pureComputed( () => this.currentStep() === number);
        };

        /**
         * Takes the user to the next step in the form.
         * @member {KnockoutComputed<number>}
         */
        this.goNextStep = function() {
            this.currentStep(this.currentStep() + 1);
        };

        /**
         * Prepare given earnings entry to be copied by the editor and go there.
         * @method
         */
        this.selectEarnings = (entry) => {
            this.earningsEntryID(ko.unwrap(entry.earningsEntryID));
            this.goNextStep();
        };

        this.title = 'Copy earnings';

        /**
         * After data being saved, notice and go back
         */
        this.onSaved = () => {
            app.successSave({
                link: '/earnings'
            });
        };
    }
}

activities.register(ROUTE_NAME, EarningsCopyActivity);
