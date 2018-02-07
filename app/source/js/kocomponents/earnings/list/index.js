/**
 * Diplays a list of a professional's earnings, and, 
 * depending on the mode, allows the ability to select an 
 * earnings entry to be used in other activities.
 *
 * @module kocomponents/earnings/list
 *
 */

import '../../utilities/icon-dec';
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'earnings-list';
const dummyData = {};
dummyData[540] =
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

dummyData[141] =
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
export default class EarningsList extends Komponent {
  
      static get template() { return template; }

     /**
     * @param {object} params
     * @param {KnockoutObservable<integer>} [params.userID]
     * @param {KnockoutObservable<string>} [params.listMode] 
     */
    constructor(params) {
      super();

      /**
       * The userID the earnings list is created for.
       * @member {KnockoutObservable<integer>}
       */
      this.userID = getObservable(params.userID);

        /**
         * Captures from the activity which "mode" the list
         * component is to be used. 
         * link: 
         * select:
         * @member {KnockoutObservable<string>}
         */
        this.listMode = getObservable(params.listMode || 'link');
        
        /**
         * @method selectItem
         */
        this.selectItem = params.selectItem;

        /**
         * Earnings list returned given query parameters.
         * @member {KnockoutObservable<array>}
         */
        this.earningsList = ko.observableArray();

        this.observeChanges(() => {
            const data = dummyData[this.userID()];
            this.earningsList(data);
        });
    }
}

ko.components.register(TAG_NAME, EarningsList);
