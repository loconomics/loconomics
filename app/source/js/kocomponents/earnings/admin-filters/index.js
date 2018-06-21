/**
 * Form with available filter options for earnings for partner admin.
 *
 * @module kocomponents/earnings/admin-filters
 */

import '../time-range-filter';
import Komponent from '../../helpers/KnockoutComponent';
import { amICollegeAdmin } from '../../../utils/partnerAdminAccessControl';
import fieldsOfStudy from '../../../data/embedded/fieldsOfStudy';
import institutions from '../../../data/embedded/cccColleges';
import jobTitles from '../../../data/embedded/jobTitlesAutocomplete';
import ko from 'knockout';
import { allRegisteredPlatforms as platforms } from '../../../data/platforms';
import { show as showError } from '../../../modals/error';
import template from './template.html';

const TAG_NAME = 'earnings-admin-filters';

/**
 * Describes values for a set of selected filters.
 * Properties described as 'filtering value' are the actual values that must be
 * used for filtering, the rest are just information for the UI.
 * @typedef {Object} EarningsAdminFilterValues
 * @property {Date} fromDate Filtering value for inclusive initial date
 * @property {Date} toDate Filtering value for inclusive final date
 * @property {number} jobTitleID Filtering value for job title
 * @property {number} platformID Fitlering value for external listing/platform
 * @property {TimeRangeOption} timeRangeOption Option used to fill
 * the fromDate and toDate properties, provided only to allow customization of
 * the display for the time range but must not be used as the actual value to
 * filter by.
 * @property {string} jobTitleText Display value, name matching the jobTitleID
 * @property {string} platformText Display value, name or title matching the
 * userExternalListingID
 */

/**
 * Component
 */
export default class EarningsAdminFilter extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {Function} params.onSelect Callback executed when the user
     * changes the selected values for the filters, It includes as parameter
     * a EarningsAdminFilterValues object.
     * @param {TimeRangeOption} params.defaultTimeRangeOption
     */
    constructor(params) {
        super();

        // Required Callback for external notifications on changing filters
        if (typeof(params.onSelect) !== 'function') {
            throw new Error('earnings-admin-filters: onSelect param is required');
        }

        /**
         * Predefined Time Range option selected
         * @member {TimeRangeOption}
         */
        this.defaultTimeRangeOption = ko.unwrap(params.defaultTimeRangeOption);

        /**
         * @member {KnockoutObservable<./user-filters/TimeRange>}
         */
        this.timeRangeSelected = ko.observable({
            from: null,
            to: null,
            option: null
        });

        /**
         * Job title object selected.
         * @member {KnockoutObservable<rest/UserJobTitle>}
         */
        this.jobTitle = ko.observable();

        /**
         * Holds the list of job titles available to allow filter by job title.
         * @member {KnockoutObservable<Array<JobTitleAutocomplete>>}
         */
        this.jobTitles = ko.observableArray(jobTitles);

        /**
         * Platform object selected.
         * @member {KnockoutObservable<rest/Platform>}
         */
        this.platform = ko.observable();

        /**
         * Holds the list of external platforms to allow filter by
         * a platform.
         * @member {KnockoutObservableArray<rest/Platform>}
         */
        this.platforms = ko.observableArray([]);

        /**
         * Institution selected
         * @member {KnockoutObservable<rest/Institution>}
         */
        this.institution = ko.observable();

        /**
         * @member {KnockoutObservable<Array<rest/Institution>>}
         */
        this.institutions = ko.observableArray(institutions);

        /**
         * Field Of Study (TOP Code) selected
         * @member {KnockoutObservable<rest/FieldOfStudy>}
         */
        this.fieldOfStudy = ko.observable();

        /**
         * @member {KnockoutObservable<Array<rest/FieldOfStudy>>}
         */
        this.fieldsOfStudy = ko.observableArray(fieldsOfStudy);

        /**
         * @member {KnockoutComputed<boolean>}
         */
        this.amICollegeAdmin = amICollegeAdmin;

        /**
         * Gets object with filter values for institution, or empty if doesn't
         * apply for current user.
         * @returns {Object}
         */
        const getInstitutionFilter = () => {
            const hasInstitutionFilter = !this.amICollegeAdmin();
            if (hasInstitutionFilter) {
                const institution = this.institution();
                return {
                    institutionID: institution && institution.institutionID,
                    institutionText: institution && institution.name || 'All colleges'
                };
            }
            else {
                return {};
            }
        };

        /**
         * Gets object iwth filter values for field of study
         * @returns {Object}
         */
        const getFieldOfStudyFilter = () => {
            const f = this.fieldOfStudy();
            return {
                fieldOfStudyID: f && f.fieldOfStudyID,
                fieldOfStudyText: f && f.name || 'All TOP Codes'
            };
        };

        /**
         * Automatically trigger onSelect on options changes
         */
        ko.computed(() => {
            const range = this.timeRangeSelected();
            const jobTitle = this.jobTitle();
            const platform = this.platform();
            const inst = getInstitutionFilter();
            const f = getFieldOfStudyFilter();

            params.onSelect(Object.assign({
                fromDate: range.from,
                toDate: range.to,
                timeRangeOption: range.option,
                jobTitleID: jobTitle && jobTitle.jobTitleID,
                platformID: platform && platform.platformID,
                jobTitleText: jobTitle && jobTitle.singularName,
                platformText: platform && platform.name || 'All platforms'
            }, inst, f));
        })
        // Prevent that several, automated/related changes, trigger too much notifications.
        .extend({ rateLimit: { timeout: 100, method: 'notifyWhenChangesStop' } });

        this.__connectData();
    }

    /**
     * Define members, prepare subscriptions to work with the code
     * and start any initial request for data
     * @private
     */
    __connectData() {
        // Load platforms
        this.subscribeTo(platforms.onData, this.platforms);

        // Notify data load errors
        this.subscribeTo(platforms.onDataError, (err) => {
            showError({
                title: 'There was an error loading platforms availables',
                error: err
            });
        });
    }
}

ko.components.register(TAG_NAME, EarningsAdminFilter);
