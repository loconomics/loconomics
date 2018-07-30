/**
 * Home activity (aka Marketplace Search plus Loconomics introduction)
 *
 * @module activities/home
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import '../../kocomponents/location-autocomplete';
import '../../kocomponents/lead-generation/newsletter';
import '../../kocomponents/lead-generation/refer';
import '../../kocomponents/nav/website-footer';
import * as activities from '../index';
import $ from 'jquery';
//import { ActionForValue } from '../kocomponents/home/search-box';
import { ActionForValue } from '../../kocomponents/job-title-autocomplete';
import Activity from '../../components/Activity';
import MarketplaceSearch from '../../viewmodels/MarketplaceSearch';
import shell from '../../app.shell';
import snapPoints from '../../utils/snapPoints';
import template from './template.html';
import { data as user } from '../../data/userProfile';

const ROUTE_NAME = 'home';

export default class HomeActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = null;
        this.navBar = Activity.createSectionNavBar(null);
        this.navBar.additionalNavClasses('AppNav--home');
        this.title = 'Find and schedule local services.';

        this.nav = this.app.navBarBinding;
        // We need a reference to later calculate snap-point based on Nav height
        this.$header = $('.AppNav');


        // TODO: Refactor all next lines from original ViewModel class

        this.isAnonymous = user.isAnonymous;
        // Inherits/mixim
        MarketplaceSearch.call(this);

        this.getJobTitleUrl = function(id) {
            return '/searchJobTitle/' + id + '/' + this.lat() + '/' + this.lng() + '/' + this.searchDistance();
        }.bind(this);
        this.getSearchCategoryUrl = function(categoryID) {
            return '/searchCategory/' + categoryID + '/' + this.lat() + '/' + this.lng() + '/' + this.searchDistance();
        }.bind(this);

        this.onSelect = function(textValue, data) {
            if (!data) return;
            if (data.jobTitleID) {
                shell.go(this.getJobTitleUrl(data.jobTitleID()));
            }
            else if (data.categoryID) {
                shell.go(this.getSearchCategoryUrl(data.categoryID()));
            }
            return {
                value: ActionForValue.clear
            };
        }.bind(this);

        this.onPlaceSelect = function(place) {
            // Save to viewmodel
            this.lat(place.geometry.location.lat());
            this.lng(place.geometry.location.lng());
            this.city(place.formatted_address);
        }.bind(this);

        this.registerHandler({
            target: this.$activity,
            event: 'scroll-fixed-header',
            handler: (e, what) => {
                var cs = this.navBar.additionalNavClasses();
                if (what === 'after') {
                    this.navBar.additionalNavClasses(cs + ' is-fixed');
                    //$header.addClass('is-fixed');
                }
                else {
                    this.navBar.additionalNavClasses(cs.replace('is-fixed', ''));
                    //$header.removeClass('is-fixed');
                }
            }
        });

        this.registerHandler({
            target: this.$activity,
            event: 'scroll-search',
            handler: (e, what) => {
                var cs = this.navBar.additionalNavClasses();
                if (what === 'after') {
                    this.navBar.additionalNavClasses(cs + ' is-search');
                    //$header.addClass('is-search');
                }
                else {
                    this.navBar.additionalNavClasses(cs.replace('is-search', ''));
                    //$header.removeClass('is-search');
                }
            }
        });
    }

    show(state) {
        super.show(state);

        if (!this._notFirstShow) {
            this._registerSnapPoints();
            this._notFirstShow = true;
        }
        this.viewModel.searchTerm('');
    }

    _registerSnapPoints() {

        var $searchBox = this.$activity.find('#home-jobTitleAutocomplete'); //homeSearch');
        // Calculate the position where search box is completely hidden, and get 1 on the worse case -- bad value coerced to 0,
        // negative result because some lack of data (content hidden)
        var searchPoint = Math.max(1, (
            // Top offset with the scrolling area plus current scrollTop to know the actual position inside the positioning context
            // (is an issue if the section is showed with scroll applied on the activity)
            $searchBox.offset().top + this.$activity.scrollTop() +
            // Add the box height but sustract the header height because that is fixed and overlaps
            $searchBox.outerHeight() - this.$header.outerHeight()
        ) |0);
        var pointsEvents = {
            // Just after start scrolling
            0: 'scroll-fixed-header'
        };
        pointsEvents[searchPoint] = 'scroll-search';

        snapPoints(this.$activity, pointsEvents);
    }
}

activities.register(ROUTE_NAME, HomeActivity);
