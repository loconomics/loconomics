/**
 * Base class to help implementing a Knockout Component.
 * It's basically the base ViewModel class attached to a component implementing
 * generic features needed on most cases and enforcing some good practices.
 */
'use strict';

import insertCss from 'insert-css';

export default class KnockoutComponent {
    /**
     * Set-up the view model to be used at the component template using incoming
     * parameters, and perform any extra operation on template and incoming
     * elements.
     * All the parameters are optional and subclasses don't need to support
     * them if they don't use them at all. But to follow a common pattern,
     * is expected they use the same params and same order (can add an additional
     * settings/whatever as last parameter), and pass in `undefined` when
     * calling `super` for any unused one so they keep the default value
     * (they are not allowed to be null).
     * @param {Object} [params={}] Instance parameters, given through data-params
     * attribute.
     * @param {Object} [refs={}] References to template elements (HTMLElements,
     * Array<HTMLElements>).
     * Should be provided internally by the creator of the component, as a named
     * set of special elements. Should be only used when something special must
     * be done with the element that cannot happens using Knockout binding and has
     * advantages over using a custom Knockout binding helper. A typical
     * element provided is `refs.root`, the component instance element.
     * @param {Object} [children={}] References to incoming children elements
     * (HTMLElements, Array<HTMLElements>).
     * Should be filtered internally by the creator of the component, provided as
     * a named set of allowed children. Should be used to restrict which elements
     * can be provided, do anything special with them and inject them in the
     * template at specific placeholders; remember that this is not needed
     * if you just want to inject all given children in the template, use
     * the special `$componentTemplateNodes` value available at templates
     * ([check out Knockout documentation](knockoutjs.com/documentation/component-custom-elements.html))
     */
    constructor(params = {}, refs = {}, children = {}) {
        /**
         * Store the parameters unprocessed
         * @member {Object}
         */
        this.rawParams = params;
        /**
         * Holds references to template elements
         * @member {Object}
         */
        this.refs = refs;
        /**
         * Holds references to incoming children elements
         * @member {Object}
         */
        this.children = children;

        // Run init async
        setTimeout(() => this.init(), 1);
    }

    /**
     * Perform initialization tasks after the constructor.
     * Use constructor to create properties, and init to run tasks.
     * Should not be used to create members except for internal properties.
     * It's triggered internally after constructor with minimum delay (async),
     * allowing subclasses to replace some base properties before use them
     * at some tasks.
     * Do not call directly, can be extended.
     */
    init() {
        if (this.__initialized) {
            throw new Error('Component was already initialized.');
        }
        else {
            this.__initialized = true;
        }
        /**
         * Enable the component specific CSS (if there is someone), injecting
         * the `style` into the page (the element template or the head)
         * @private {HTMLElement}
         */
        this.__styleElement = this.constructor.style && insertCss(this.constructor.style, {
            // Insert at the end of the element root, if not defined will
            // fallback to `html>head` element
            container: this.refs.root
        });
    }

    /**
     * Free ressources that are not automatically managed.
     * Usually needed to remove external events listeners, subscriptions to
     * external observables or computed observables.
     * It's triggered automatically by Knockout after the component was
     * removed, so expect `refs` to not be valid anymore.
     *//* TEMPORARLY REMOVED SINCE CAUSES CONFLICTS: INSERT-CSS USES A UNIQUE
     STYLE ELEMENT FOR ALL, REMOVING THAT MEANS REMOVING ALL OTHERS
     TODO: Look for/build alternative to insert-css, allowing diposing styles
     without conflicts; one approach could be add it ever to the component
     template but that means that shared styles are duplicated at runtime
     (inserted twice, how much performance problem can be? debugging is a bit
     annoying because of duplicated applied rules, though)
    dispose() {
        // If there is a component style, must be removed.
        // Need manual removal only if was attached to body (there was not
        // a reference to the element --in that case, the whole element
        // was already removed at this point)
        if (this.__styleElement && !this.refs.root) {
            this.__styleElement.parentNode.removeChild(this.__styleElement);
        }
    }*/
}
