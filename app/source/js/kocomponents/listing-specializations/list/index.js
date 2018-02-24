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
import moment from 'moment';
import numeral from 'numeral';
import template from './template.html';
import { list as userEarningsList } from '../../../data/userEarnings';

const TAG_NAME = 'earnings-list';

/**
 * @enum {string} Supported displaying modes
 */
const ListMode = {
    display: 'display',
    select: 'select',
    suggestion: 'suggestion'
};

/**
 * Component
 */
export default class EarningsList extends Komponent {

    static get template() { return template; }

     /**
     * @param {object} params
     * @param {KnockoutObservable<string>} [params.listMode]
     * @param {function} [params.selectItem] Callback to trigger when using
     * `ListMode.select` and an item is clicked. As parameter will get a reference
     * to the item object.
     */
    constructor(params) {
        super();

        /**
         * Captures from the activity which "mode" the list
         * component is to be used.
         * link:
         * select:
         * @member {KnockoutObservable<string>}
         */
        this.listMode = getObservable(params.listMode || ListMode.link);

        /**
         * @method selectItem
         */
        this.selectItem = params.selectItem;

        /**
         * Earnings list returned given query parameters.
         * @member {KnockoutObservable<array>}
         */
        this.earningsList = ko.observableArray();

        // Use earnings data when available
        this.subscribeTo(userEarningsList.onData, this.earningsList);

        /**
         * Creats link to an expanded view of the item
         * @param {Object} item An earnings entry plain object
         * @returns {string}
         */
        this.linkToItemView = (item) => `/earnings-view/${item.earningsEntryID}?mustReturn=earnings-history&returnText=Earnings History`;

        /**
         * Text to display about an earning on the first line
         * @param {Object} item An earnings entry plain object
         * @returns {string}
         */
        this.firstLine = (item) => {
            const amount = numeral(item.amount).format('$0,0.00');
            const date = moment(item.paidDate).format('LLL');
            return `${amount} on ${date}`;
        };

        /**
         * Text to display about an earning on the second line
         * @param {Object} item An earnings entry plain object
         * @returns {string}
         */
        this.secondLine = (item) => {
            const hours = numeral(item.durationMinutes / 60).format('0.00');
            return `${hours} hours of ${item.jobTitleName} services on ${item.listingTitle}`;
        };
    }
}

ko.components.register(TAG_NAME, EarningsList);

/**
 * @enum {string} Public enumeration of supported displaying modes
 */
EarningsList.ListMode = ListMode;
