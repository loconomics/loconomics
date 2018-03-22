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
import * as badges from '../../../data/badges';
import Komponent from '../../helpers/KnockoutComponent';
import UserType from '../../../enums/UserType';
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

    static get cssClass() { return 'BadgeViewer'; }

    /**
     * @param {object} params
     * @param {(string|KnockoutObservable<string>)} [params.src]
     */
    constructor(params) {
        super();

        /**
         * Holds the ID for the badge being
         * edited.
         * @member {KnockoutObservable<number>}
         */
        this.userBadgeID = getObservable(params.userBadgeID);

        /**
         * Holds the ID for the badge being
         * edited.
         * @member {KnockoutObservable<number>}
         */
        this.jobTitleID = getObservable(params.jobTitleID);

        /**
         * Holds the ID for the badge being
         * edited.
         * @member {KnockoutObservable<number>}
         */
        this.solutionID = getObservable(params.solutionID);

        /**
         * Holds the ID for the badge being
         * edited.
         * @member {KnockoutObservable<number>}
         */
        this.createdBy = getObservable(params.createdBy);

        /**
         * The Badgr URL for the badge or collection.
         * @member {KnockoutObservable<string>}
         */
        this.badgeURL = getObservable(params.badgeURL);

        /**
         * The type of URL – either 'badge' or 'collection'.
         * @member {KnockoutObservable<string>}
         */
        this.type = getObservable(params.type || 'badge');

        /**
         * The mode the viewer is to be shown.
         * 'card':
         * 'fullDetails':
         * @member {KnockoutObservable<string>}
         */
        this.viewMode = getObservable(params.viewMode || 'card');
        this.isServiceProfessional = UserType.serviceProfessional;

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

        this.__setupDataOperations();
    }

    /**
     * Make requests for data
     * @private
     */
    __setupDataOperations() {
        const src = this.badgeURL();
        const srcType = this.type();

        /**
         * Populate assertion information plus general badge information
         * for the requested assertion URL.
         */
        const populateObservables = (payload) => {
            this.id(payload.id);
            this.image(payload.image);
            this.narrative(payload.narrative);
            this.evidence(payload.evidence);

            badges.fetchFrom(payload.badge)
            .then((json) => {
                this.badgeName(json.name);
                this.badgeDescription(json.description);
            });
        };

        if(src && srcType == 'badge') {
            badges.fetchFrom(src)
            .then((json) => populateObservables(json));
        } else {
            populateObservables(this.badgeURL());
        }
    }
}

ko.components.register(TAG_NAME, BadgeViewer);
