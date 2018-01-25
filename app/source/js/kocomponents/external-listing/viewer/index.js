/**
 * Example of a basic KnockoutComponent with styles, based on basicKomponent.
 *
 * @module kocomponents/_examples/c-styled-component
 *
 * FIXME: Update this component description
 * FIXME: Document parameters allowed using jsdoc syntax in the constructor,
 * or if there is no one, at this initial commit
 * FIXME: Keep code, members, methods documented, using jsdoc and inline comments
 * so code keeps clear; but code that just overwrite an inherit member (like
 * template) does not need a comment except some additional thing should be
 * noted; same if some comment looks repeatitive or not helpfull (like the
 * register line).
 */
import '../../utilities/icon-dec.js';
import '../../external-platform/info';
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';

import template from './template.html';
// FIXME: If the component uses in the template other components, you need
// to import them from here, like
// import '../another/component';

const TAG_NAME = 'external-listing-viewer';
const dummyData = {};
dummyData[214] ={
    'ExternalListingID': 214,
    'PlatformID': 1,
    'PlatformName': 'Upwork',
    'SignInURL': 'https://99designs.com/designers',
    'JobTitles': ["Graphic Designer", "Graphic Artist", "Front-end Developer"],
    'Notes': '-$0 sign-up fee↵-20% commission if design chosen',
    'CreatedDate': '1/10/2018',
    'ModifiedDate': '1/10/2018',
    'Active': 1
};
dummyData[215] ={
    'ExternalListingID': 215,
    'PlatformID': 2,
    'PlatformName': '99designs',
    'SignInURL': 'https://99designs.com/designers',
    'JobTitles': ["Graphic Designer", "Graphic Artist", "Front-end Developer"],
    'Notes': '-$0 sign-up fee↵-20% commission if design chosen',
    'CreatedDate': '1/10/2018',
    'ModifiedDate': '1/10/2018',
    'Active': 1
};

/**
 * Component
 */
export default class ExternalListingViewer extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {(number|KnockoutObservable<number>)} 
     * [params.externalListingID]
     */
    constructor(params) {
        super();

        /**
         * The ID of the external listing the professional
         * is viewing.
         * @member {KnockoutObservable<number>}
         */
        this.externalListingID = getObservable(params.externalListingID);

        /**
         * An "out" parameter that fills the platform name 
         * for use in the title of the activity.
         * @member {KnockoutObservable<string>}
         */
        this.platformName = params.platformName;

        /**
         * An "out" parameter that fills the platformID 
         * to enable information about the platform to
         * be displayed.
         * @member {KnockoutObservable<number>}
         */        
        this.platformID = ko.observable(null);

        /**
         * An object containing all the information about 
         * the professionals external listing.
         * @member {KnockoutObservable<object>}
         */   
        this.externalListing = ko.observable();

        this.observeChanges(() => {
            const id = this.externalListingID();
            if (id) {
                const data = dummyData[id];
                this.externalListing(data);
                this.platformName(data.PlatformName);
                this.platformID(data.PlatformID);
            }
        });
    }
}

ko.components.register(TAG_NAME, ExternalListingViewer);
