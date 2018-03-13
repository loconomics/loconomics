/**
 * Earnings activity that enables professionals to view
 * a summary of their total earnings in and outside of
 * Loconomics.
 *
 * @module activities/earnings
 *
 */

import '../../kocomponents/earnings/filters';
import '../../kocomponents/earnings/report';
import '../../utils/Time';
import * as activities from '../index';
import Activity from '../../components/Activity';
import TimeRangeOption from '../../kocomponents/earnings/filters/TimeRangeOption';
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

        /**
         * A platformID for the summary query. Defualt value is
         * null for all platforms.
         * @member {KnockoutObservable<integer>}
         */
        this.platformID = ko.observable(null);

        this.accessLevel = UserType.serviceProfessional;
        this.navBar = Activity.createSectionNavBar(null);
        this.navBar.rightAction(null);

        this.title = 'Earnings';

        /**
         * The default option to use at filters for predefined time-range.
         */
        this.defaultTimeRangeOption = TimeRangeOption.thisYear;

        /**
         * Whether to display filters or not.
         * @member {KnockoutObservable<boolean>}
         */
        this.areFiltersVisible = ko.observable(false);

        /**
         * Toggle visualization of filters
         * @method
         */
        this.showFilters = () => {
            this.areFiltersVisible(!this.areFiltersVisible());
        };

        /**
         * Holds the of filtering values, as given by the earnings-filters
         * and accepted by the earnings-report
         * @member {KnockoutObservable<boolean>}
         */
        this.reportFilters = ko.observable(null);
    }
}

activities.register(ROUTE_NAME, EarningsActivity);
