/**
 * Used to capture a summary of earnings for a given 
 * set of parameters.
 *
 * @module kocomponents/earnings/history
 *
 */
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'earnings-history';
const dummyData = {};
dummyData[0] =
[
  {
    'total': 23250.00,
    'period': '2017 Year-to-date',
    'jobTitle': 'All job titles',
    'platform': 'all platforms',
    'paidOut': 23000.00,
    'expected': 250.00,
    'averageHourlyRate': 23.83,
    'hoursWorked': 975.50,
    'bookings': 57
  }
];


/**
 * Component
 */
export default class EarningsHistory extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {(string|KnockoutObservable<string>)} [params.name=World] A name for the greating.
     * @param {function<number,void>} [params.onCount] Callback executed each time the 'count'
     * button is executed with the current counter.
     */
    constructor(params) {
        super();

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
         * @member {KnockoutObservable<array>}
         */
        this.earningsHistory = ko.observableArray();

        this.observeChanges(() => {
            const data = dummyData[0];
            this.earningsSummary(data);
        });
    }
}

ko.components.register(TAG_NAME, EarningsHistory);
