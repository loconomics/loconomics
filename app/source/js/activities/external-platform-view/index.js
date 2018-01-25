/**
 * Shows the user information about an external platform
 * to help them decide if they'd like to list themselves
 * there.
 * 
 * @module activities/external-platform-view
 *
 */

import '../../kocomponents/external-platform/info';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import template from './template.html';

const ROUTE_NAME = 'external-platform-view';

export default class ExternalPlatformViewActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;

        this.navBar = Activity.createSubsectionNavBar(null);

        // Creates a placeholder for an "out" parameter to be populated by the component.
        this.platformName = ko.observable('');

        // Title uses a pureComputed to ensure the platformName is updated.
        this.title = ko.pureComputed( () =>  this.platformName() + ' information');
        
        // Creates a placeholder for the platform ID to be populated using the show(state) method below.
        this.platformID = ko.observable();
    }

    show(state) {
        super.show(state);
        var params = state.route && state.route.segments;
        // platformID is the first segment in the activity URL 
        this.platformID(params[0] |0);
    }
}

activities.register(ROUTE_NAME, ExternalPlatformViewActivity);
