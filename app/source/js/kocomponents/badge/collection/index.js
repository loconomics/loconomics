/**
 * Displays collections of badges users have earned. Loconomics badges are currently issued through badgr.io
 * How it works:
 * The 'src' parameter is a URL that includes user-specific information
 * about a user's collection of badges.
 * @module kocomponents/badge-collection
 */
import '../view';
import '../../utilities/icon-dec.js';
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import style from './style.styl';
import template from './template.html';

const TAG_NAME = 'badge-collection';

/**
 * Component
 */
export default class BadgeCollection extends Komponent {

    static get style() { return style; }
    
    static get BadgeCollection() { return BadgeCollection; }

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {(string|KnockoutObservable<string>)} [params.src]
     */
    constructor(params) {
        super();

        /**
         * The src URL for the badge collection.
         * @member {KnockoutObservable<string>}
         */
        this.src = getObservable(params.src);
        
        const src = this.src();


         /**
         * Holds the id of the badge assertion.
         * @member {KnockoutObservable<object>}
         */
        this.badges = getObservable([]);

        const headers = new Headers({
            'Accept': 'application/json'
          });

         /**
         * When the src changes, the information is
         * updated for the specific badge.
         */
        fetch(src, {headers})
        .then((r) => {
          if(r.ok) {
            return r.json();
          }
        }).then((json) => {
          const badges = json.badges.map((b) => `${b.id}?v=2_0`);
          this.badges(badges);
        });
    }
}

ko.components.register(TAG_NAME, BadgeCollection);
