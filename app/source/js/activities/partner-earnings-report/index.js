/**
 * Earnings report about students for partner admins.
 *
 * @module activities/partner-earnings-report
 */

import '../../kocomponents/earnings/report';
import '../../kocomponents/earnings/filters';
import * as activities from '../index';
import * as report from '../../data/userEarningsReport';
import Activity from '../../components/Activity';
import TimeRangeOption from '../../kocomponents/earnings/filters/TimeRangeOption';
import UserType from '../../enums/UserType';
import { accessControl } from '../../utils/partnerAdminAccessControl';
import ko from 'knockout';
import { show as showError } from '../../modals/error';
import template from './template.html';

const ROUTE_NAME = 'partner-earnings-report';

export default class PartnerEarningsReportActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.accessControl = accessControl;
        this.navBar = Activity.createSectionNavBar(null);
        this.navBar.rightAction(null);
        this.title = 'Earnings Report';

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

        /**
         * Filters applied on the currently displayed data. It's a reference to
         * the incoming filters, BUT only updated once we have ended loading
         * the report data.
         * Purpose: prevent displaying filters that don't match the displayed
         * data.
         * @member {KnockoutObservable<kocomponents/earnings/filters/EarningsFilterValues>}
         */
        this.appliedFilters = ko.observable(null);

        /**
         * Earnings summary returned given query parameters.
         * @member {KnockoutObservable<rest/EarningsReport>}
         */
        this.earningsReport = ko.observable(null);

        // Request filtered data on filters changes
        ko.computed(() => {
            const filters = this.reportFilters();
            // Request filtered data
            report.queryCccStudents(filters)
            .then((data) => {
                // Use server data
                this.earningsReport(data);
                this.appliedFilters(filters);
            })
            .catch((error) => {
                showError({
                    title: 'There was an error loading the report',
                    error
                });
            });
        });
    }
}

activities.register(ROUTE_NAME, PartnerEarningsReportActivity);
