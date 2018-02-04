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
import { item as platformsItem } from '../../../data/platforms';
import { show as showError } from '../../../modals/error';
import template from './template.html';
import { item as userExternalListingItem } from '../../../data/userExternalListings';

const TAG_NAME = 'external-listing-editor';

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
     * [params.externalListingID]
     */

    constructor(params) {
        super();
        /// Form data
        /**
         * Holds the ID for the external listing being
         * edited.
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
         * Holds the ID for the platform of the external
         * listing being created.
         * @member {KnockoutObservable<number>}
         */
        this.platformName = getObservable(params.platformName);

        /**
         * Holds the data of the external listing.
         * @member {KnockoutObservable<object>}
         */
        this.externalListing = ko.observable(null);

        /**
         * Holds the basic information about the external
         * platform of the listing being added.
         * @member {KnockoutObservable<object>}
         */
        this.externalPlatformInfo = ko.observable();

        /**
         * Loads the information about the platform, returning and placing it
         * at the member externalPlatformInfo and updating member platformName.
         * @param {number} id
         * @private
         */
        const loadPlatformInfo = (id) => {
            let promise;
            if (id) {
                promise = platformsItem(id).onceLoaded();
            }
            else {
                promise = Promise.resolve({});
            }
            return promise.then((data) => {
                this.externalPlatformInfo(data);
                this.platformName(data.name);
                return data;
            });
        };

        /**
         * Displays the error returned while loading the data
         * @param {Error} err
         */
        const loadingError = function(error) {
            showError({
                title: 'There was an error loading the listing',
                error
            });
        };

        /**
         * When the given listing ID changes, load the data or set-up a new
         * entry for a platformID specified.
         */
        this.observeChanges(() => {
            const id = this.externalListingID();
            if (id) {
                userExternalListingItem(id)
                .onceLoaded()
                .then((data) => {
                    this.externalListing(data);
                    loadPlatformInfo(data.platformID);
                })
                .catch(loadingError);
            }
            else {
                loadPlatformInfo(this.externalPlatformID())
                .then(() => {
                    this.externalListing({
                        externalListingID: 0,
                        platformID: this.externalPlatformID(),
                        title: 'My ' + this.platformName() + ' listing',
                        jobTitles: '',
                        notes: '',
                        modifiedDate: false
                    });
                })
                .catch(loadingError);
            }
        });
    }
}

ko.components.register(TAG_NAME, ExternalListingEditor);
