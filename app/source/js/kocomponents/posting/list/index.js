/**
 * Diplays a list of GIG postings
 *
 * @module kocomponents/posting/list
 *
 */
import '../../utilities/icon-dec';
import { getStatusNameFor, getReactionTypeNameFor } from '../../../models/UserPosting';
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import moment from 'moment';
import { list as postingsList } from '../../../data/userPostings';
import { show as showError } from '../../../modals/error';
import template from './template.html';

const TAG_NAME = 'posting-list';

/**
 * Component
 */
export default class PostingList extends Komponent {

    static get template() { return template; }

     /**
     * @param {object} params
     * @param {function<rest/UserPosting,void>} [params.onSelect] Callback to trigger when an item
     * is selected, with the item data object as unique parameter.
     * @param {KnockoutObservableArray<rest/UserPosting>} [params.data] Optionally,
     * the data can come from outside; on that case will be used and the internal
     * lookup of user created postings discarded.
     */
    constructor(params) {
        super();

        /**
         * Custom callback when an item is selected, with the item as parameter
         * @method
         */
        this.onSelect = params.onSelect;

        /**
         * List of user postings.
         * @member {KnockoutObservableArray<rest/UserPosting>}
         */
        this.data = getObservable(params.data || []);

        if (!params.data) {
            // Use earnings data when available
            this.subscribeTo(postingsList.onData, this.data);
            this.subscribeTo(postingsList.onDataError, (error) => {
                showError({
                    title: 'There was an error loading postings',
                    error
                });
            });
        }

        /**
         * Text to display on the first line
         * @param {rest/UserPosting} item
         * @returns {string}
         */
        this.firstLine = (item) => {
            const status = getStatusNameFor(item.statusID).toLowerCase();
            if (item.reactionTypeID) {
                const reaction = getReactionTypeNameFor(item.reactionTypeID).toLowerCase();
                return `${item.title} (${reaction}, ${status})`;
            }
            else {
                return `${item.title} (${status})`;
            }
        };

        /**
         * Text to display on the second line
         * @param {rest/UserPosting} item
         * @returns {string}
         */
        this.secondLine = (item) => {
            const date = moment(item.createdDate).format('LLL');
            return `Posted on '${item.solutionName}', ${date}`;
        };
    }
}

ko.components.register(TAG_NAME, PostingList);

