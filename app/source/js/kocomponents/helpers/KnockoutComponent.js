/**
 * Base class to help implementing a Knockout Component.
 * It's basically the base ViewModel class attached to a component implementing
 * generic features needed on most cases and enforcing some good practices.
 */
'use strict';

import insertCss from 'insert-css';
import ko from 'knockout';

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
     * @param {Object} [elements={}] Set of references to elements, clasified
     * @param {Object} [elements.refs={}] References to component instance elements
     * (HTMLElements, Array<HTMLElements>); they were created from the component
     * html template.
     * Should be provided internally by the creator of the component, as a named
     * set of special elements. Should be only used when something special must
     * be done with the element that cannot happens using Knockout binding and has
     * advantages over using a custom Knockout binding helper. A typical
     * element provided is `refs.root`, the component instance element.
     * @param {Object} [elements.children={}] References to incoming children elements
     * (HTMLElements, Array<HTMLElements>).
     * Should be filtered internally by the creator of the component, provided as
     * a named set of allowed children. Should be used to restrict which elements
     * can be provided, do anything special with them and inject them in the
     * template at specific placeholders; remember that this is not needed
     * if you just want to inject all given children in the template, use
     * the special `$componentTemplateNodes` value available at templates
     * ([check out Knockout documentation](knockoutjs.com/documentation/component-custom-elements.html))
     */
    constructor(params = {}, elements = {}) {
        const { refs = {}, children = {} } = elements;
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

    /**
     * Creates an instance from the input parameters and DOM references of
     * the instantiated template and given children nodes.
     * It helps provide a common interface to the components constructor (that
     * behaves as view-model, in Knockout naming).
     * It too works as a base for more advanced implementations for the
     * creator of viewmodel, like analyzing DOM nodes to give them to the
     * constructor filtered/adapted with meaningful names as part of refs and
     * children objects.
     * It too assign the CSS class to the instantiated element.
     *
     * NOTE: In Knockout internals, this is used as the `createViewModel`
     * function given at component registration, so any subclass customizing
     * this MUST keep the same interface
     * @see knockoutjs.com/documentation/component-registration.html#a-createviewmodel-factory-function
     *
     * @param {Object} params is an object whose key/value pairs are the parameters
     * passed from the component binding or custom element ('data-params="_is_this_"')
     * @param {Object} componentInfo Access to DOM elements instantiated from
     * the component template or nodes provided
     * @param {HTMLElement} componentInfo.element is the element the component
     * is being injected into. When this method is called, the template has
     * already been injected into this element, but isn't yet bound.
     * @param {Array<HTMLNodes>} componentInfo.templateNodes is an array
     * containing any DOM nodes that have been supplied to the component; they
     * are the children given to the instance of the component, like:
     * <knockout-component> template <span>nodes</span> </knockout-component>
     * @returns {KnockoutComponent} An instance of the component class, ready
     * to be bound to the template (Knockout will bind it).
     */
    static from(params, componentInfo) {
        // We set the class name directly in the component, if any
        if (this.cssClass) {
            componentInfo.element.classList.add(this.cssClass);
        }
        return new this(params, {
            refs: {
                root: componentInfo.element
            },
            children: {
                all: componentInfo.templateNodes
            }
        });
    }
}

/**
 * Text hook needed to enable the 'afterRender' method on components, by
 * injecting it into the end of the template (it's a trick)
 * @const {string}
 */
const afterRenderTemplateHook = '<!-- ko template: { afterRender: afterRender } --><!-- /ko -->';

/**
 * Gets the template defined for the class, extended if needed to support
 * the class features.
 * @param {KnockoutComponent} KomponentClass
 */
function getTemplateFrom(KomponentClass) {
    // The template comes from a static 'template:string' property
    let template = KomponentClass.template;
    // that is extended to support features implemented by the class, like..
    // - if the class implements 'afterRender' method (not inhered from base
    //   class, whose implementation is empty as a placeholder)
    if (KomponentClass.prototype.afterRender !== KnockoutComponent.prototype.afterRender) {
        // need to add a 'hook' into the template that will call that method
        // (Knockout lacks support for this in the component view models without
        // this workaround)
        template += afterRenderTemplateHook;
    }
    // It's ready!
    return template;
}

/**
 * Implementation of a custom Knockout Component Loader, that accepts a class
 * based on KnockoutComponent as the config
 * @const {KnockoutComponentLoader}
 */
var komponentLoader = {
    /**
     * Knockout will call this function to obtain a configuration object for
     * each component being instantiated.
     * @param {string} name Component tag name
     * @param {(KnockoutComponent|Object)} componentConfig Configuration provided
     * when the component was registered
     * @param {Function} callback Callback to execute when ready providing the
     * set-up, or null to fallback to the default loader (for non KnockoutComponent
     * config)
     */
    loadComponent(name, componentConfig, callback) {
        // Given a class that inherits from KnockoutComponent
        if (componentConfig.prototype instanceof KnockoutComponent) {
            // Get template from the class
            const template = getTemplateFrom(componentConfig);
            // Get view model constructor (will use explicit or inherit creator
            // function)
            const viewModel = {
                createViewModel: componentConfig.from
            };
            callback({ viewModel, template });
        }
        else {
            callback(null);
        }
    }
};
// Adding the loader to the beggining, so it reuses the default loader
ko.components.loaders.unshift(komponentLoader);
