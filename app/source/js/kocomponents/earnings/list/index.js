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

/**
 * @enum {string} Supported displaying modes
 */
const ListMode = {
    link: 'link',
    select: 'select'
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

        this.observeChanges(() => {
            this.earningsList({});
        });
    }
}

ko.components.register(TAG_NAME, EarningsList);

/**
 * @enum {string} Public enumeration of supported displaying modes
 */
EarningsList.ListMode = ListMode;
