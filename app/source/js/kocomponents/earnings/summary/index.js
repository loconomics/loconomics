/**
 * Example of a basic Knockout Component that uses the helper KnockoutComponent
 * and ES6 class syntax to define it.
 *
 * @module kocomponents/_examples/b-basic-komponent
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
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import template from './template.html';
// FIXME: If the component uses in the template other components, you need
// to import them from here, like
// import '../another/component';

const TAG_NAME = 'earnings-summary';
const dummyData = {};
dummyData[0] =
[
  {
    'total': 23250.00,
    'period': '2017 Year-to-date',
    'jobTitle': 'All job titles',
    'platform': 'all platforms',
    'paidOut': 23000.00,
    'expected': 250.00,
    'averageHourlyRate': 23.83,
    'hoursWorked': 975.50,
    'bookings': 57
  }
];


/**
 * Component
 */
export default class EarningsSummary extends Komponent {

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
         * A job title for the summary query. Defualt value is all job titles.
         * @member {KnockoutObservable<integer>}
         */
        this.jobTitleID = getObservable(params.jobTitleID || -1);

        /**
         * A time range for the summary query. Default value is year-to-date.
         * @member {KnockoutObservable<array>}
         */
        this.timeRange = getObservable(params.timeRange || 'World');

        /**
         * A platformID for the summary query. Defualt value is all platforms.
         * @member {KnockoutObservable<string>}
         */
        this.platformID = getObservable(params.platformID || -1);

        /**
         * Earnings summary returned given query parameters.
         * @member {KnockoutObservable<string>}
         */
        this.earningsSummary = ko.observableArray();

        /**
         * Internal counter for how many times pressed the button
         * @member {KnockoutObservable<number>}
         */
        this.counter = ko.observable(0);
        /**
         * Optional callback for external notifications on clicking 'count'
         */
        this.onCount = params.onCount || undefined;

        // FIXME: A callback is usual to notify some event, but on this case
        // we could allow the 'counter' being provided externally as an
        // observable (like the 'name') and reset the number at constructor.
        this.observeChanges(() => {
            const data = dummyData[0];
            this.earningsSummary(data);
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
ko.components.register(TAG_NAME, EarningsSummary);
