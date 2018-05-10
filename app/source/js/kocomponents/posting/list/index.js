/**
 * Diplays a list of GIG postings
 *
 * @module kocomponents/posting/list
 *
 */
import '../../utilities/icon-dec';
import Komponent from '../../helpers/KnockoutComponent';
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
        this.data = ko.observableArray();

        // Use earnings data when available
        this.subscribeTo(postingsList.onData, this.data);
        this.subscribeTo(postingsList.onDataError, (error) => {
            showError({
                title: 'There was an error loading postings',
                error
            });
        });

        /**
         * Text to display on the first line
         * @param {rest/UserPosting} item
         * @returns {string}
         */
        this.firstLine = (item) => `${item.title} (${getStatusTextFor(item.statusID)})`;

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

/**
 * Gives the display name for the given user posting status ID.
 * @param {number} postingStatusID
 * @returns {string}
 */
function getStatusTextFor(postingStatusID) {
    switch (postingStatusID) {
        case 0: return 'incomplete';
        case 1: return 'active';
        case 2: return 'expired';
        case 3: return 'closed';
    }
}
