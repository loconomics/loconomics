/**
 * Earnings activity that enables professionals to view
 * a summary of their total earnings in and outside of
 * Loconomics.
 *
 * @module activities/_examples/a-basic-activity
 *
 */

import '../../kocomponents/earnings/report';
import '../../utils/Time';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import template from './template.html';

const ROUTE_NAME = 'earnings';

export default class EarningsActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);

        /**
         * A job title for the summary query. Defualt value is
         * null for all job titles.
         * @member {KnockoutObservable<integer>}
         */
        this.jobTitleID = ko.observable(null);

        /** Filters -  @iagosrl - WIP */
        /**
         * A start date for the summary query. Default value is
         * the 1st of the current month until today's date.
         * @member {KnockoutObservable<string>}
         */
        // this.timeRange = ko.observableArray({'2/1/2018': '2/2/2018'});

        /**
         *
         * @method
         */
        // this.selectFilters = function(filters) {
        //     this.earningsEntryID(ko.unwrap(filters.earningsEntryID));
        //     this.goNextStep();
        // }.bind(this);

        /**
         * A platformID for the summary query. Defualt value is
         * null for all platforms.
         * @member {KnockoutObservable<integer>}
         */
        this.platformID = ko.observable(null);

        this.accessLevel = UserType.serviceProfessional;
        this.navBar = Activity.createSectionNavBar(null);
        this.navBar.rightAction(null);

        /**
         * Earnings summary returned given query parameters.
         * @member {KnockoutObservable<boolean>}
         */
        this.showFilter = ko.observable(false);

        this.showFilters = function() {
            if (this.showFilter() == false) {
                this.showFilter(true);
            }
            else {
                this.showFilter(false);
            }
        };

        this.title = 'Earnings';
    }
}

activities.register(ROUTE_NAME, EarningsActivity);
