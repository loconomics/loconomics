/**
 * Allows a professional to add or edit information about a 
 * listing on an external platform. 
 * 
 * @module kocomponents/external-listing/editor
 */

// import '../../job-title-autocomplete.js'; ASKIAGO how to add multiple job titles-may need new component as current job-title-autocomplete only allows one job title to be added.
// import '../../../../html/kocomponents/job-title-autocomplete.html';
import '../../utilities/icon-dec.js';
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'external-listing-editor';
const dummyData = {};
const dummyPlatformData = {};
dummyPlatformData[2] =
[
    {
        'PlatformID': 2,
        'PlatformName': '99designs',
        'ListingURLPrefix': 'https://99designs.com/designers/',
        'SignInURL': '99designs'
    }
];
dummyData[214] =
[
    {
      'externalListingID': 214,
      'PlatformID': 2,
      'PlatformName': '99designs',
      'ListingTitle': '',
      'JobTitles': 'Graphic Designer, Graphic Artist, Front-end Developer',
      'ListingURL': 'https://99designs.com/designers',
      'Notes': '-$0 sign-up fee↵-20% commission if design chosen',
      'CreatedDate': '-Global demand',
      'ModifiedDate': '-Zero pay if design not chosen↵-High commissions if chosen',
      'Active': 1
    }
];

/**
 * Component
 */
export default class ExternalListingEditor extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {(number|KnockoutObservable<number>)} 
     * [params.platformID]
     * @param {(number|KnockoutObservable<number>)} 
     * [params.externalListingID].
     */

    constructor(params) {
        super(); 
        /// Form data
        /**
         * Holds the ID for the external listing being edited.
         * @member {KnockoutObservable<number>}
         */
        this.externalListingID = getObservable(params.externalListingID);

        /**
         * Holds the ID for the platform of the external 
         * listing being created.
         * @member {KnockoutObservable<number>}
         */
        this.externalPlatformID = getObservable(params.platformID);

        /**
         * The title for the external listing (required). A 
         * default title value will be given that the user can 
         * edit.
         * @member {KnockoutObservable<string>} 
         * ASKIAGO how to replace 'TaskRabbit' with a variable.
         */                 
        // this.listingTitle = ko.pureComputed('My ' + 'TaskRabbit' + ' listing');
        
        /**
         * Holds the job title or titles a user is promoting on 
         * the listing.
         * ASKIAGO Includes both names and IDs?
         * @member {KnockoutObservable<array>}
         */
        this.jobTitles = ko.observableArray([]);

        /**
         * --Optional--Holds the URL for the user's listing 
         * (optional). The placeholder or help block should 
         * include the 'ListingURLPrefix' to aid the user.
         * @member {KnockoutObservable<string>}
         */                 
        this.listingURL = ko.observable('');

        /**
         * --Optional--Holds notes the user can enter about 
         * the listing.
         * @member {KnockoutObservable<string>}
         */
        this.notes = ko.observable('');

        /**
         * Holds the data of the external listing.
         * @member {KnockoutObservable<array>}
         */
        this.externalListing = ko.observableArray();

        /**
         * Holds the basic information about the external platform
         * of the listing being added.
         * @member {KnockoutObservable<array>}
         */
        this.externalPlatformBasicInfo = ko.observableArray();

        this.observeChanges(() => {
            const id = this.externalListingID();
            if (id) {
                const data = dummyData[id];
                this.externalListing(data);
                this.externalPlatformID(data.PlatformID);
            }
        });

        this.observeChanges(() => {
            const id = this.externalPlatformID();
            if (id) {
                const data = dummyPlatformData[id];
                this.externalPlatformBasicInfo(data);
                this.externalListing().PlatformID = id;
            }
        });
    }
}

ko.components.register(TAG_NAME, ExternalListingEditor);
