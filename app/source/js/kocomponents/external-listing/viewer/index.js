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
    'PlatformID': 2,
    'PlatformName': 'Upwork',
    'SignInURL': 'https://99designs.com/designers',
    'JobTitles': ["Graphic Designer", "Graphic Artist", "Front-end Developer"],
    'URL': 'https://99designs.com/designers',
    'Notes': '-$0 sign-up fee↵-20% commission if design chosen',
    'CreatedDate': '1/10/2018',
    'ModifiedDate': '1/10/2018',
    'Active': 1
};
dummyData[215] ={
    'ExternalListingID': 215,
    'PlatformID': 3,
    'PlatformName': '99designs',
    'SignInURL': 'https://99designs.com/designers',
    'JobTitles': ["Graphic Designer", "Graphic Artist", "Front-end Developer"],
    'URL': 'https://99designs.com/designers',
    'Notes': '-$0 sign-up fee↵-20% commission if design chosen',
    'CreatedDate': '1/10/2018',
    'ModifiedDate': '1/10/2018',
    'Active': 1
};
dummyData[217] ={
    'ExternalListingID': 214,
    'PlatformID': 4,
    'PlatformName': 'TaskRabbit',
    'SignInURL': 'https://99designs.com/designers',
    'JobTitles': ["Handyman"],
    'URL': 'https://99designs.com/designers',
    'Notes': '-$0 sign-up fee↵-20% commission if design chosen',
    'CreatedDate': '1/10/2018',
    'ModifiedDate': '1/10/2018',
    'Active': 1
};
dummyData[218] ={
    'ExternalListingID': 218,
    'PlatformID': 5,
    'PlatformName': 'Wag',
    'SignInURL': 'https://99designs.com/designers',
    'JobTitles': ["Dog Walker"],
    'URL': 'https://99designs.com/designers',
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
     * @param {(string|KnockoutObservable<string>)} [params.name=World] A name for the greating.
     * @param {function<number,void>} [params.onCount] Callback executed each time the 'count'
     * button is executed with the current counter.
     */
    constructor(params) {
        super();

        /**
         * A name for the greating.
         * @member {KnockoutObservable<string>}
         */
        this.externalListingID = getObservable(params.externalListingID || -1);
        /**
         * Internal counter for how many times pressed the button
         * @member {KnockoutObservable<number>}
         */
        this.externalListing = ko.observable();
        /**
         * Optional callback for external notifications on clicking 'count'
         */
        this.onCount = params.onCount || undefined;

        // FIXME: A callback is usual to notify some event, but on this case
        // we could allow the 'counter' being provided externally as an
        // observable (like the 'name') and reset the number at constructor.
        this.observeChanges(() => {
            const data = dummyData[this.externalListingID()];
            this.externalListing(data);
        });
    }

    /**
     * Increases the counter and notify through callback
     */
    count() {
        this.counter(this.counter() + 1);
        if (this.onCount) {
            this.onCount(this.counter());
        }
    }
}

// FIXME: Just reminder that EVER should register the component with this line
// at the end, but don't need a comment (remove me!)
ko.components.register(TAG_NAME, ExternalListingViewer);
