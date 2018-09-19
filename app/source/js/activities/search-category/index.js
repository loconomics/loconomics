/**
 * SearchCategory
 *
 * @module activities/search-category
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import '../../kocomponents/tab-list';
import * as activities from '../index';
import Activity from '../../components/Activity';
import ko from 'knockout';
import search from '../../data/search';
import shell from '../../app.shell';
import template from './template.html';

const ROUTE_NAME = 'search-category';

export default class SearchCategory extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = null;
        this.navBar = Activity.createSectionNavBar(null);
        this.title = ko.pureComputed(() => {
            var result = this.categorySearchResult();
            return result && `${result.categoryName} Professionals`;
        });

        this.__defViewProperties();
        this.__defViewMethods();
    }

    __defViewProperties() {
        this.isLoading = ko.observable(false);
        this.isCategoryLoading = ko.observable(false);
        //create an observable variable to hold the search term
        this.categoryID = ko.observable();
        //create an observable variable to hold the search term
        this.origLat = ko.observable();
        //create an observable variable to hold the search term
        this.origLong = ko.observable();
        //create an observable variable to hold the search term
        this.searchDistance = ko.observable();
        //create an object named ServiceProfessionalSearchResult to hold the search results returned from the API
        this.jobTitleSearchResult = ko.observableArray();
        this.categorySearchResult = ko.observable();
        //create a pure computed ko observable to change the background image when the categoryID changes
        this.categoryBackgroundImage = ko.pureComputed(() => {
            var id = this.categoryID();
            return id ? 'CategoryBackground-' + id : '';
        });
        this.categories = [
            { id: 1, name: 'Home Care' },
            { id: 2, name: 'Self Care' },
            { id: 3, name: 'Child Care' },
            { id: 4, name: 'Senior Care' },
            { id: 5, name: 'Pet Care' },
            { id: 6, name: 'Celebration' },
            { id: 7, name: 'Transport' },
            { id: 8, name: 'Office' }
        ];
        // Computed with side effects to keep active tab in sync with the data and URL
        var observableRoute = shell.getCurrentObservableRoute();
        this.activeTabName = ko.pureComputed({
            read: () => {
                var route = observableRoute();
                // searchCategoryID
                return route && route.segments && route.segments[0];
            },
            write: (tabName) => {
                this.loadCategory(tabName).then(() => {
                    setTimeout(() => {
                        shell.replaceState(null, null, this.getUrlForCategory(tabName));
                    }, 1);
                });
            }
        });
    }

    __defViewMethods() {
        // PRIVATE load functions, that use parameters we will internally ensure are the same values
        // as the observables we have for them
        var loadCategoryData = (categoryID, origLat, origLong, searchDistance) => {
            this.isCategoryLoading(true);
            return search.getCategory(categoryID, origLat, origLong, searchDistance)
            .then((data) => {
                this.categorySearchResult(data);
                this.isCategoryLoading(false);
            })
            .catch(() => {
                this.isCategoryLoading(false);
            });
        };
        var loadData = (categoryID, origLat, origLong, searchDistance) => {
            this.isLoading(true);
            return search.jobTitlesByCategory(categoryID, origLat, origLong, searchDistance)
            .then((list) => {
                this.jobTitleSearchResult(list);
                this.isLoading(false);
            })
            .catch(() => {
                this.isLoading(false);
            });
        };
        // PUBLIC load function; the given parameters are stored in observables and used
        // to perform all data loading tasks.
        // @return Promise
        this.load = (categoryID, origLat, origLong, searchDistance) => {
            // Update observables with given data, so them reflects the same data we are loading
            this.categoryID(categoryID);
            this.origLat(origLat);
            this.origLong(origLong);
            this.searchDistance(searchDistance);
            // Call specific load functions.
            // The returned promise fulfilles when both are completed
            return Promise.all([
                loadCategoryData(categoryID, origLat, origLong, searchDistance),
                loadData(categoryID, origLat, origLong, searchDistance)
            ]);
        };
    }

    getUrlForCategory(catID) {
        const lat = this.origLat();
        const lng = this.origLong();
        const dist = this.searchDistance();
        return `/search-category/${catID}/${lat}/${lng}/${dist}`;
    }

    loadCategory(catID) {
        return this.load(catID, this.origLat(), this.origLong(), this.searchDistance());
    }

    /**
     * Process a parametrized URL like in the template
     * /{categoryID}/{latitude}/{longitude}/{searchDistance}
     * @param {Object} state
     * @param {Object} state.route
     * @param {Array<string>} state.route.segments Positional parameters in the URL:
     * {number} segments[0] categoryID
     * {number} segments[1] latitude
     * {number} segments[2] longitude
     * {number} segments[3] searchDistance
     */
    show(state) {
        super.show(state);

        var params = state.route.segments || [];
        var categoryID = params[0] || '';
        var origLat = params[1] || '';
        var origLong = params[2] || '';
        var searchDistance = params[3] || '';
        this.load(categoryID, origLat, origLong, searchDistance);
    }
}

activities.register(ROUTE_NAME, SearchCategory);
