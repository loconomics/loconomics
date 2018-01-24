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
     * [params.platformName] The name of the platform whose 
     * information is being displayed.
     * @param {(number|KnockoutObservable<number>)} 
     * [params.platformID] The ID of the platform whose 
     * information is being displayed.
     **/
    constructor(params) {
        super();

        /**
         * The given platformID from the params.
         * @member {KnockoutObservable<number>}
         */
        this.platformID = getObservable(params.platformID || -1);

        /**
         * Information about the external platform.
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
        this.observeChanges(() => {
            const data = dummyData[this.platformID()];
            this.externalPlatform(data);
            this.platformName(data.PlatformName);
        });
    }
}

ko.components.register(TAG_NAME, ExternalPlatformInfo);
