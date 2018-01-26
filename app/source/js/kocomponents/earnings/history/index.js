/**
 * Used to capture a summary of earnings for a given 
 * set of parameters.
 *
 * @module kocomponents/earnings/history
 *
 */

import '../../utilities/icon-dec';
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'earnings-history';
const dummyData = {};
dummyData[0] =
[
  {
    'EarningsEntryID': 1,
    'Total': 320.00,
    'PaidDate': '1/15/2018', 
    'Duration': 180,
    'PlatformName': 'TaskRabbit',
    'JobTitleName': 'Handyman'
  },
  {
    'EarningsEntryID': 2,
    'Total': 50.00,
    'PaidDate': '1/14/2018', 
    'Duration': 30,
    'PlatformName': 'Thumbtack',
    'JobTitleName': 'Painter'
  },
  {
    'EarningsEntryID': 3,
    'Total': 100.00,
    'PaidDate': '1/07/2018', 
    'Duration': 100,
    'PlatformName': 'NextDoor',
    'JobTitleName': 'Handyman'
  },
  {
    'EarningsEntryID': 4,
    'Total': 90.00,
    'PaidDate': '12/15/2017', 
    'Duration': 180,
    'PlatformName': 'Handy',
    'JobTitleName': 'Cleaning Professional'
  },
  {
    'EarningsEntryID': 5,
    'Total': 500.00,
    'PaidDate': '12/01/2017', 
    'Duration': 300,
    'PlatformName': 'TaskRabbit',
    'JobTitleName': 'Handyman'
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
            this.earningsHistory(data);
        });
    }
}

ko.components.register(TAG_NAME, EarningsHistory);
