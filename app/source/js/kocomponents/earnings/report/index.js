/**
 * Used to capture a summary of earnings for a given
 * set of parameters.
 *
 * @module kocomponents/earnings/report
 */
import '../../utilities/icon-dec';
import * as report from '../../../data/userEarningsReport';
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
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
         * Earnings summary returned given query parameters.
         * @member {KnockoutObservable<rest/EarningsReport>}
         */
        this.earningsReport = ko.observable(null);

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
