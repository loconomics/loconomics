/**
 * Used to capture a summary of earnings for a given 
 * set of parameters.
 * 
 * @module kocomponents/earnings/report
 *
 */

import '../../utilities/icon-dec';
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'earnings-report';
const dummyData = {};
dummyData[540] =
{
    'Total': 23250.00,
    'Period': '2017 Year-to-date',
    'JobTitle': 'All job titles',
    'Platform': 'all platforms',
    'PaidOut': 23000.00,
    'Expected': 250.00,
    'AverageHourlyRate': 23.83,
    'HoursWorked': 975.50,
    'Bookings': 57
};


/**
 * Component
 */
export default class EarningsReport extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {KnockoutObservable<integer>} [params.userID] 
     */
    constructor(params) {
        super();

        /**
         * A job title for the summary query. Defualt value is all job titles.
         * @member {KnockoutObservable<integer>}
         */
        this.userID = getObservable(params.userID);

        /**
         * A job title for the summary query. Defualt value is all job titles.
         * @member {KnockoutObservable<integer>}
         */
        this.jobTitleID = getObservable(params.jobTitleID || -1);

        /**
         * A time range for the summary query. Default value is year-to-date.
         * @member {KnockoutObservable<array>}
         */
        this.timeRange = getObservable(params.timeRange || 'World');

        /**
         * A platformID for the summary query. Defualt value is all platforms.
         * @member {KnockoutObservable<string>}
         */
        this.platformID = getObservable(params.platformID || -1);

        /**
         * Earnings summary returned given query parameters.
         * @member {KnockoutObservable<object>}
         */
        this.earningsReport = ko.observable();

        this.observeChanges(() => {
            const data = dummyData[this.userID()];
            this.earningsReport(data);
        });
    }
}

ko.components.register(TAG_NAME, EarningsReport);
