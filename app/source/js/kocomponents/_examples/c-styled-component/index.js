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
import getObservable from '../utils/getObservable';
import ko from 'knockout';
// REMOVEME: Import the style (should include the extension)
import style from './style.styl';
import template from './template.html';
// FIXME: If the component uses in the template other components, you need
// to import them from here, like
// import '../another/component';

const cssClass = 'ComponentExample';
const TAG_NAME = 'component-example';

/**
 * Component
 */
export default class ComponentExample extends Komponent {

    // REMOVEME: assign style in the static property, and see className..
    static get style() { return style; }

    // REMOVEME: assign the CSS class name that is defined in the '.styl' file
    // using our naming convention for CSS, just in case that class needs to
    // be attached to the element tag, not just to the content; you
    // can set a class name directly on the template, but that applies only to
    // content, not to the element like
    // <component-example><p class="CssClass"></p></component-example>
    // while you may need it in the element, like
    // <component-example class="CssClass"><p></p></component-example>
    // This is what this property does.
    // Sometimes is not needed, though, depends on how is styled but remember
    // that custom-elements without explicit styles behave by default
    // as 'display:inline' because of browsers engines defaults.
    static get cssClass() { return cssClass; }

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
        this.name = getObservable(params.name || 'World');
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
ko.components.register(TAG_NAME, ComponentExample);
