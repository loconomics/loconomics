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
         * A job title for the summary query. Defualt value is 
         * null for all job titles.
         * @member {KnockoutObservable<integer>}
         */
        this.jobTitleID = getObservable(params.jobTitleID || null);

        /**
         * A start date for the summary query. Default value is 
         * January 1st of the current year.
         * @member {KnockoutObservable<array>}
         */
        this.timeRange = getObservable(params.timeRange || {'2/1/2018':'2/2/2018'});

        /**
         * A start date for the summary query. Default value is 
         * January 1st of the current year.
         * @member {KnockoutObservable<string>}
         */
        this.startDate = getObservable(params.startDate || '1/1/2018');

        /**
         * An end date for the summary query. Default value is 
         * today.
         * @member {KnockoutObservable<string>}
         */
        this.endDate = getObservable(params.endDate || '2/2/2018');

        /**
         * A platformID for the summary query. Defualt value is 
         * null for all platforms.
         * @member {KnockoutObservable<integer>}
         */
        this.platformID = getObservable(params.platformID || null);

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
