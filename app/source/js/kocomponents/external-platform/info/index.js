/**
 * Shows the information about the external platform to the 
 * professional to help them decide if they should list 
 * themselves.
 *
 * @module kocomponents/external-platform/info
 *
 */

import '../../utilities/icon-dec.js';
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';

import template from './template.html';

const TAG_NAME = 'external-platform-info';
const dummyData = {};
dummyData[1] ={
    'PlatformID': 1,
    'PlatformName': '99designs',
    'ShortDescription': 'Marketplace for freelance designers.',
    'LongDescription': 'Hi there. We’re 99designs, the world’s largest online graphic design marketplace. We connect more than one million talented freelance designers with creative people, genius entrepreneurs, savvy businesses… anyone who needs great work.',
    'FeesDescription': '-$0 sign-up fee↵-20% commission if design chosen',
    'PositiveAspects': '-Global demand',
    'NegativeAspects': '-Zero pay if design not chosen↵-High commissions if chosen',
    'Advice': '-Enter many contests to build a reputation↵-Repurpose designs to multiple clients if they fit the criteria',
    'SignUpURL': 'https://99designs.com/designers'
};
dummyData[2] ={
      'PlatformID': 2,
      'PlatformName': 'TaskRabbit',
      'ShortDescription': 'Marketplace for tasks.',
      'LongDescription': 'TaskRabbit connects you with gigs that focus mainly around laborious chores',
      'FeesDescription': '-$0 sign-up fee↵-20% commission if design chosen',
      'PositiveAspects': '-Global demand',
      'NegativeAspects': '-Zero pay if design not chosen↵-High commissions if chosen',
      'Advice': '-Enter many contests to build a reputation↵-Repurpose designs to multiple clients if they fit the criteria',
      'SignUpURL': 'https://www.taskrabbit.com/become-a-tasker'
};

/**
 * Component
 */
export default class ExternalPlatformInfo extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {(string|KnockoutObservable<string>)} 
     * [params.platformName]
     * @param {(number|KnockoutObservable<number>)} 
     * [params.platformID]
     * @param {(boolean|KnockoutObservable<boolean>)} 
     * [params.showAddListing]
     **/
    constructor(params) {
        super();

        /**
         * The ID of the external platform we're displaying
         * information for.
         * @member {KnockoutObservable<number>}
         */
        this.platformID = getObservable(params.platformID);

        /** ASKIAGO why this isn't working.
         * Determines whether or not to display the add link.
         * @member {KnockoutObservable<boolean>}
         */
        this.showAddListing = ko.observable(getObservable(params.showAddListing || true));

        /**
         * An object containging information about the external 
         * platform.
         * @member {KnockoutObservable<object>}
         */
        this.externalPlatform = ko.observable();
        
        /**
         * An "out" parameter that fills the platform name 
         * for use in the title of the activity.
         * @member {KnockoutObservable<string>}
         */
        this.platformName = params.platformName;

        /**
         * When the platformID changes, the information is 
         * updated for the specific platform.
         */
        // ASKIAGO this piece is throwing a console error and not returning data in the external-listing-view activity (but does in external-platform-view)
        // index.js:98 Uncaught TypeError: Cannot read property 'PlatformName' of undefined
        // at ExternalPlatformInfo.<anonymous> (index.js:98)
        // at Function.evaluateImmediate_CallReadThenEndDependencyDetection (knockout-latest.debug.js:2183)
        // at Function.evaluateImmediate_CallReadWithDependencyDetection (knockout-latest.debug.js:2150)
        // at Function.evaluateImmediate (knockout-latest.debug.js:2111)
        // at Object.ko.computed.ko.dependentObservable (knockout-latest.debug.js:1964)
        // at ExternalPlatformInfo.observeChanges (KnockoutComponent.js:210)
        // at new ExternalPlatformInfo (index.js:93)
        // at Function.from (KnockoutComponent.js:234)
        // at createViewModel (knockout-latest.debug.js:4035)
        // at ko.subscription.callback (knockout-latest.debug.js:4006)
        this.observeChanges(() => {
            const id = this.platformID();
            if (id) {
                const data = dummyData[id];
                this.externalPlatform(data);
                this.platformName(data.PlatformName);
            }
        });
    }
}

ko.components.register(TAG_NAME, ExternalPlatformInfo);
