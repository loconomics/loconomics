/**
 * Displays badges users have earned. Loconomics badges are currently issued through badgr.io
 * How it works:
 * The 'src' parameter is a URL that includes user-specific information
 * about a user's single badge including:
 * - 'image' of the badge
 * - 'evidence' (optional)
 * - 'narrative' 
 * - the 'badge' URL pointing to the general info about the badge
 * The 'badge' contains the following information:
 * - 'name' of the badge
 * - 'narrative' of the badge which is a description
 *
 * You can also pass this information directly into the 'assertion' parameter if you already have it locally.
 * 
 * To populate this information and display in the component:
 * - we fetch the 'assertion' json object 
 * - we amend the 'badge' url to point it to the json url
 * - we fetch the amended 'badge' json object
 * - we populate the properties
 * @module kocomponents/badge-viewer
 */

import '../../utilities/icon-dec.js';
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import style from './style.styl';
import template from './template.html';

const TAG_NAME = 'badge-viewer';

/**
 * Component
 */
export default class BadgeViewer extends Komponent {

    static get style() { return style; }
    
    static get BadgeViewer() { return BadgeViewer; }

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {(string|KnockoutObservable<string>)} [params.src]
     */
    constructor(params) {
        super();

        /**
         * The Badgr URL for the badge or collection.
         * @member {KnockoutObservable<string>}
         */
        this.badgrURL = getObservable(params.badgrURL);
        const src = this.badgrURL();

        /**
         * The type of URL – either 'badge' or 'collection'.
         * @member {KnockoutObservable<string>}
         */
        this.type = getObservable(params.type || 'badge');
        const srcType = this.type();
 
         /**
         * Holds the id of the badge assertion.
         * @member {KnockoutObservable<integer>}
         */
        this.id = ko.observable();

        /**
         * Holds the image of the badge assertion.
         * @member {KnockoutObservable<string>}
         */
        this.image = ko.observable();

        /**
         * Holds the image of the badge assertion.
         * @member {KnockoutObservable<string>}
         */
        this.narrative = ko.observable();

        /**
         * Holds the image of the badge assertion.
         * @member {KnockoutObservable<string>}
         */
        this.evidence = ko.observable();

        /**
         * Holds the image of the badge assertion.
         * @member {KnockoutObservable<string>}
         */
        this.badgeName = ko.observable();

        /**
         * Holds the image of the badge assertion.
         * @member {KnockoutObservable<string>}
         */
        this.badgeDescription = ko.observable();

        /**
         * Holds the image of the badge assertion.
         * @member {KnockoutObservable<object>}
         */
        this.assertion = ko.observable();

        const headers = new Headers({
            'Accept': 'application/json'
          });
          
         /**
         * When the src changes, the information is
         * updated for the specific badge.
         */
        const populateObservables = (payload) => {
            this.id(payload.id);
            this.image(payload.image);
            this.narrative(payload.narrative);
            if (payload.evidence && payload.evidence.length > 0) {
                this.evidence(payload.evidence[0].id);
            }
            fetch(payload.badge, {headers})
            .then((r) => {
                if(r.ok)
                return r.json();
            }).then((json) => {
                this.badgeName(json.name);
                this.badgeDescription(json.description);
            });
        };
    
        if(src && srcType == 'badge') {
            fetch(src, {headers})
            .then((r) => {
                if(r.ok)
                return r.json();
            }).then((json) => populateObservables(json));
            } else {
            populateObservables(this.assertion());
        }     
    }
}

ko.components.register(TAG_NAME, BadgeViewer);
