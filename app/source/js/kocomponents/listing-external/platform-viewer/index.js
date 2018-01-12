/**
 * Example of a basic KnockoutComponent with styles, based on basicKomponent.
 *
 * @module kocomponents/_examples/c-styled-component
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
// REMOVEME: Import the style (should include the extension)
import style from './style.styl';
import template from './template.html';
// FIXME: If the component uses in the template other components, you need
// to import them from here, like
// import '../another/component';

const className = 'PlatformViewer';
const TAG_NAME = 'listing-external-platform-viewer';
const dummyData = {};
dummyData[1] =
[
    {
      'SuggestedPlatformID': '1',
      'PlatformName': '99designs',
      'ShortDescription': 'Marketplace for freelance designers.',
      'LongDescription': 'Hi there. We’re 99designs, the world’s largest online graphic design marketplace. We connect more than one million talented freelance designers with creative people, genius entrepreneurs, savvy businesses… anyone who needs great work.',
      'FeesDescription': '-$0 sign-up fee↵-20% commission if design chosen',
      'PositiveAspects': '-Global demand',
      'NegativeAspects': '-Zero pay if design not chosen↵-High commissions if chosen',
      'Advice': '-Enter many contests to build a reputation↵-Repurpose designs to multiple clients if they fit the criteria',
      'UserHasListing': '0'
    }
  ];
dummyData[2] =
[
    {
      'SuggestedPlatformID': '2',
      'PlatformName': 'TaskRabbit',
      'ShortDescription': 'Marketplace for freelance designers.',
      'LongDescription': 'Hi there. We’re 99designs, the world’s largest online graphic design marketplace. We connect more than one million talented freelance designers with creative people, genius entrepreneurs, savvy businesses… anyone who needs great work.',
      'FeesDescription': '-$0 sign-up fee↵-20% commission if design chosen',
      'PositiveAspects': '-Global demand',
      'NegativeAspects': '-Zero pay if design not chosen↵-High commissions if chosen',
      'Advice': '-Enter many contests to build a reputation↵-Repurpose designs to multiple clients if they fit the criteria',
      'UserHasListing': '0'
    }
  ];

/**
 * Component
 */
export default class PlatformViewer extends Komponent {

    // REMOVEME: assign style in the static property, and see className..
    static get style() { return style; }

    // REMOVEME: assign the CSS class name that is defined in the '.styl' file
    // using our naming convention for CSS, just in case that class needs to
    // be attached to the element tag, not just to the content; you
    // can set a class name directly on the template, but that applies only to
    // content, not to the element like
    // <component-example><p class="ClassName"></p></component-example>
    // while you may need it in the element, like
    // <component-example class="ClassName"><p></p></component-example>
    // This is what this property does.
    // Sometimes is not needed, though, depends on how is styled but remember
    // that custom-elements without explicit styles behave by default
    // as 'display:inline' because of browsers engines defaults.
    static get className() { return className; }

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
         * A name for the greating.
         * @member {KnockoutObservable<string>}
         */
        this.platformID = getObservable(params.platformID || -1);
        /**
         * Internal counter for how many times pressed the button
         * @member {KnockoutObservable<number>}
         */
        this.suggestedPlatform = ko.observableArray();
        /**
         * Optional callback for external notifications on clicking 'count'
         */
        this.onCount = params.onCount || undefined;

        // FIXME: A callback is usual to notify some event, but on this case
        // we could allow the 'counter' being provided externally as an
        // observable (like the 'name') and reset the number at constructor.
        this.observeChanges(() => {
            const data = dummyData[this.platformID()];
            this.suggestedPlatform(data);
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
ko.components.register(TAG_NAME, PlatformViewer);
