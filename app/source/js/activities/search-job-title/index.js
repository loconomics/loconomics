/**
 * SearchJobTitle
 *
 * @module activities/search-job-title
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import '../../kocomponents/lead-generation/newsletter';
import '../../kocomponents/lead-generation/refer';
import * as activities from '../index';
import Activity from '../../components/Activity';
import ServiceProfessionalSearchResult from '../../models/ServiceProfessionalSearchResult';
import ko from 'knockout';
import search from '../../data/search';
import template from './template.html';
import { data as user } from '../../data/userProfile';

const ROUTE_NAME = 'search-job-title';

export default class SearchJobTitle extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = null;
        this.navBar = Activity.createSubsectionNavBar('Back');
        this.title = ko.pureComputed(() => {
            var result = this.jobTitleSearchResult();
            return result && result.pluralName;
        });

        this.__defViewProperties();
        this.__defViewMethods();
    }

    __defViewProperties() {
        this.isAnonymous = user.isAnonymous;
        this.isLoading = ko.observable(false);
        this.isJobTitleLoading = ko.observable(false);
        //create an observable variable to hold the search term
        this.jobTitleID = ko.observable();
        //create an observable variable to hold the search term
        this.origLat = ko.observable();
        //create an observable variable to hold the search term
        this.origLong = ko.observable();
        //create an observable variable to hold the search term
        this.searchDistance = ko.observable();
        //create an object named ServiceProfessionalSearchResult to hold the search results returned from the API
        this.serviceProfessionalSearchResult = ko.observableArray();
        this.jobTitleSearchResult = ko.observable();
        this.searchFailureMessage = ko.pureComputed(() => {
            const result = this.jobTitleSearchResult();
            if (result) {
                const name = ko.unwrap(result.pluralName);
                return `We don't yet have ${name} in your area. Help us grow by introducing us to professionals or signing up for our newsletter.`;
            }
            else {
                return undefined;
            }
        });
    }

    __defViewMethods() {
        this.loadJobTitleData = (jobTitleID, origLat, origLong, searchDistance) => {
            this.isJobTitleLoading(true);
            return search.getJobTitle(jobTitleID, origLat, origLong, searchDistance)
            .then((data) => {
                this.jobTitleSearchResult(data);
                this.isJobTitleLoading(false);
            })
            .catch(() => {
                this.isJobTitleLoading(false);
            });
        };
        this.loadData = (jobTitleID, origLat, origLong, searchDistance) => {
            this.isLoading(true);
            return search.serviceProfessionalsByJobTitle(jobTitleID, origLat, origLong, searchDistance)
            .then((list) => {
                //since service professional result has objects with objects (star ratings, verifications),
                // we need to create a more complex model using list.map to convert every record
                var listAsModel = list.map((item) => new ServiceProfessionalSearchResult(item));
                this.serviceProfessionalSearchResult(listAsModel);
                this.isLoading(false);
            })
            .catch(() => this.isLoading(false));
        };
    }

    /**
     * Process a parametrized URL like in the template
     * /{jobTitleID}/{latitude}/{longitude}/{searchDistance}
     * @param {Object} state
     * @param {Object} state.route
     * @param {Array<string>} state.route.segments Parameters in the URL:
     * {number} segments[0] jobTitleID
     * {number} segments[1] latitude
     * {number} segments[2] longitude
     * {number} segments[3] searchDistance
     */
    show(state) {
        super.show(state);

        var params = state.route.segments || [];
        var jobTitleID = params[0] || '';
        var origLat = params[1] || '';
        var origLong = params[2] || '';
        var searchDistance = params[3] || '';
        this.loadJobTitleData(jobTitleID, origLat, origLong, searchDistance);
        this.loadData(jobTitleID, origLat, origLong, searchDistance);
    }
}

activities.register(ROUTE_NAME, SearchJobTitle);
