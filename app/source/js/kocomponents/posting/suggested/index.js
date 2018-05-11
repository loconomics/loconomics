/**
 * Used to view the details of a suggested posting (to professionals).
 *
 * @module kocomponents/posting/suggested
 *
 */
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'posting-suggested';

/**
 * Component
 */
export default class PostingSuggested extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {(models/UserPosting|KnockoutObservable<models/UserPosting>)} params.data
     */
    constructor(params) {
        super();

        /**
         * Holds the ID for the earnings entry being viewed.
         * @member {KnockoutObservable<models/UserPosting>}
         */
        this.data = getObservable(params.data);
    }
}

ko.components.register(TAG_NAME, PostingSuggested);
