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
import userProfile from '../../data/userProfile';

const ROUTE_NAME = 'earnings-copy';

export default class EarningsCopyActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);
        /**
         * Passes in the current user's ID as an observable.
         */
        this.userID = userProfile.data.userID;

        this.accessLevel = UserType.serviceProfessional;
        this.navBar = Activity.createSubsectionNavBar(null);

        /**
         * Earnings summary returned given query parameters.
         * @member {KnockoutObservable<boolean>}
         */
        // this.earningsSelected = ko.observable(false);
        
        // this.earningsSelected = function() {
        //     if (this.earningsSelected() == false) {
        //         this.earningsSelected(true);
        //     }
        //     else {
        //         this.earningsSelected(false);
        //     }
        // }; 

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
         * Earnings to be copied.
         * @method
         */
        this.selectEarnings = function(earnings) {
            this.earningsEntryID(ko.unwrap(earnings.earningsEntryID));
            this.goNextStep();
        }.bind(this);

        this.title = 'Copy earnings';
    }

    show(state) {
        super.show(state);
        // Check other examples for some code using 'state'
    }
}

activities.register(ROUTE_NAME, EarningsCopyActivity);
