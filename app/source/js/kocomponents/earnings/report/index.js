/**
 * Used to capture a summary of earnings for a given
 * set of parameters.
 *
 * @module kocomponents/earnings/report
 */
import '../../utilities/icon-dec';
import * as report from '../../../data/userEarningsReport';
import Komponent from '../../helpers/KnockoutComponent';
import TimeRangeOption from '../filters/TimeRangeOption';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import moment from 'moment';
import { show as showError } from '../../../modals/error';
import template from './template.html';

const TAG_NAME = 'earnings-report';

/**
 * Component
 */
export default class EarningsReport extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {KnockoutObservable<kocomponents/earnings/filters/EarningsFilterValues>} [params.filters]
     * Optional observable to dynamic filters to apply to report data
     */
    constructor(params) {
        super();

        /**
         * Incoming data filters, as a dynamic change that can change externally
         * forcing us to update the report data.
         * @member {KnockoutObservable<kocomponents/earnings/filters/EarningsFilterValues>}
         */
        this.filters = getObservable(params.filters || null);

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

        /**
         * Header describing the time range the data displayed belongs to
         * @member {KnockoutComputed<string>}
         */
        this.timeRangeHeader = ko.pureComputed(() => {
            const filters = this.appliedFilters();
            const timeOption = filters && filters.timeRangeOption;
            if (timeOption) {
                const fromDate = filters && filters.fromDate;
                const toDate = filters && filters.toDate;
                switch (timeOption) {
                    case TimeRangeOption.thisYear: {
                        const year = fromDate.getFullYear();
                        return `${year} Year-to-date Summary`;
                    }
                    case TimeRangeOption.thisMonth: {
                        const month = moment(fromDate).format('MMMM');
                        return `${month} Month-to-date Summary`;
                    }
                    case TimeRangeOption.thisQuarter: {
                        const quarter = moment(fromDate).format('Qo');
                        return `${quarter} Quarter-to-date Summary`;
                    }
                    case TimeRangeOption.lastMonth: {
                        const month = moment(fromDate).format('MMMM');
                        return `Last ${month} Summary`;
                    }
                    default: {
                        // no time option, not recognized, custom option
                        const from = moment(fromDate).format('ll');
                        const to = moment(toDate).format('ll');
                        return `${from} to ${to}`;
                    }
                }
            }
            else {
                // No filtering, all displayed
                return 'Global Summary';
            }
        });

        /**
         * Text describing the filtered job title, or fallback for all
         * @member {KnockoutComputed<string>}
         */
        this.selectedJobTitleText = ko.pureComputed(() => {
            const filters = this.appliedFilters();
            const hasSelected = filters && filters.jobTitleID > 0;
            return hasSelected ? filters.jobTitleText : 'All job titles';
        });

        /**
         * Text describing the filtered platform, or fallback for all
         * @member {KnockoutComputed<string>}
         */
        this.selectedPlatformText = ko.pureComputed(() => {
            const filters = this.appliedFilters();
            const hasSelected = filters && filters.platformID > 0;
            return hasSelected ? filters.platformText : 'All listings/platforms';
        });

        this.__setupDataOperations();
    }

    /**
     * Define members, prepare subscriptions to work with the code
     * and start any initial request for data
     * @private
     */
    __setupDataOperations() {
        // Notify errors when loading global report data
        this.subscribeTo(report.globalReport.onDataError, (error) => {
            showError({
                title: 'There was an error loading the report',
                error
            });
        });

        /**
         * Keep the last subscription to fetch the global report.
         * @private {Subscription}
         */
        let globalReportSubscription = null;

        // Request filtered data on filters changes
        ko.computed(() => {
            const filters = this.filters();
            if (filters) {
                // Prevent all-data to be loaded
                if (globalReportSubscription) globalReportSubscription.dispose();
                // Request filtered data
                report.query(filters)
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
            }
            else {
                globalReportSubscription = this.subscribeTo(report.globalReport.onData, this.earningsReport);
            }
        });
    }
}

ko.components.register(TAG_NAME, EarningsReport);
