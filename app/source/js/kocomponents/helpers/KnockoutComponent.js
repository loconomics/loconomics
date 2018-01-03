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
     * Set-up the members to be used as the component view model, process
     * incoming parameters.
     * @param {Object} params Instance parameters, given through data-params
     * attribute and processed by Knockout
     */
    constructor() {
        /**
         * Holds a list of objects with a 'dispose' method or functions that
         * need to be called when disposing the component, freeing up ressources
         * that don't do it automatically (see `dispose` method).
         * @member {Array<IDisposable>}
         */
        this.disposables = [];
    }

    /**
     * Template and class (view-model) were instantiated, but still not bound
     * together.
     * Knockout attached the component template to the DOM and detached children
     * nodes given in the usage of the component ('templateNodes'), being both
     * available in the object passed in as parameter for advanced manipulation.
     * Be aware that, since binding didn't happened, any component used in the
     * template has not been instantiated still, same as any content generated
     * by binding handlers.
     * This method is useful to filter/adapt/reference that DOM elements and
     * assign them to observables properties so is available for binding.
     * This callback is executed just after the constructor.
     * Should not be used to create new members (keep that at the constructor),
     * but can update them.
     * @param {Knockout.ComponentInfo} componentInfo
     * @see http://knockoutjs.com/documentation/component-registration.html#a-createviewmodel-factory-function
     */
    beforeBinding(componentInfo) {
        if (this.__beforeBinding) {
            throw new Error('Manual attempt to call beforeBinding.');
        }
        else {
            this.__beforeBinding = true;
        }

        // We set the class name directly in the component, if any
        if (this.cssClass) {
            componentInfo.element.classList.add(this.cssClass);
        }

        /**
         * Enable the component specific CSS (if there is someone), injecting
         * the `style` into the page (the element template or the head)
         * @private {HTMLElement}
         */
        this.__styleElement = this.constructor.style && insertCss(this.constructor.style, {
            container: componentInfo.element
        });
        /*
        TEMPORARLY REMOVED SINCE CAUSES CONFLICTS: INSERT-CSS USES A UNIQUE
        STYLE ELEMENT FOR ALL, REMOVING THAT MEANS REMOVING ALL OTHERS
        TODO: Look for/build alternative to insert-css, allowing diposing styles
        without conflicts; one approach could be add it ever to the component
        template but that means that shared styles are duplicated at runtime
        (inserted twice, how much performance problem can be? debugging is a bit
        annoying because of duplicated applied rules, though)
        // If there is a component style, must be removed.
        this.disposables.push(function() {
            if (this.__styleElement) {
                this.__styleElement.parentNode.removeChild(this.__styleElement);
            }
        }.bind(this));
        */
    }

    /**
     * Free ressources that are not automatically managed.
     * Usually needed to remove external events listeners, subscriptions to
     * external observables or computed observables.
     * It's triggered automatically by Knockout when the component instance is
     * not needed anymore and just before remove it from the DOM.
     * @see http://knockoutjs.com/documentation/component-binding.html#component-lifecycle
     *
     * Note:
     * Base implementation let you just register a 'disposable' object or function
     * at previous steps in the livecycle, and they will be disposed already by
     * this method, so should be very rare you need to replace or extend this
     * implementation.
     *
     * @param {(Function|IDisposable)}
     */
    dispose() {
        this.disposables.forEach(function(value) {
            try {
                if (value && value.dispose) {
                    value.dispose();
                }
                else if (typeof(value) === 'function') {
                    value();
                }
                else {
                    throw new Error('Invalid disposable', value);
                }
            }
            catch(ex) {
                console.error('Error at component dispose(), running an individual disposable', ex);
            }
        });
    }

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
     * <knockout-component> template <span>nodes</span> </knockout-co
     * mponent>
     * @returns {KnockoutComponent} An instance of the component class, ready
     * to be bound to the template (Knockout will bind it).
     */
    static from(params, componentInfo) {
        // Create a new instance
        var vm = new this(params);
        // Run the beforeBinding with DOM elements
        vm.beforeBinding(componentInfo);
        return vm;
    }
}

/**
 * Text hook needed to enable the 'afterRender' callback method on components, by
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
            // Reuse default template loader that converts a string into Nodes
            ko.components.defaultLoader.loadTemplate(name, template, (templateNodes) => {
                callback({
                    template: templateNodes,
                    // Get view model constructor (will use explicit or inherit creator
                    // function)
                    createViewModel: componentConfig.from.bind(componentConfig)
                });
            });
        }
        else {
            callback(null);
        }
    }
};
// Adding the loader to the beggining, so takes precedence over standard set-up
ko.components.loaders.unshift(komponentLoader);

/**
 * @typedef {Object} Knockout.ComponentInfo
 * @member {HTMLElement} element is the element the component is being
 * injected into. When beforeBinding is called, the template has
 * already been injected into this element, but isn't yet bound.
 *
 * Recommendation: should be only used when something special must
 * be done with the element that cannot happens using Knockout binding and has
 * advantages over using a custom Knockout binding helper. Too, can be used
 * to query for elements that ever exists in the instance (not affected by
 * bindings that remove childrens, as 'if', 'with', or inside loops) and are
 * needed for special management (a binding helper 'ref' can be used and allows
 * dynamic elements and react on changes).
 *
 * @member {Array<HTMLNode>} templateNodes is an array containing any DOM
 * nodes that have been supplied to the component.
 *
 * Recommendations:
 * Should be filtered at beforeBinding, assigning nodes/elements of allowed,
 * expected children to component properties for usage in the template (for
 * example, to re-inject them -using them as externally given templates,
 * see usage of the 'template' binding with the option 'nodes').
 * Remember that this is not needed
 * if you just want to inject all given children in the template, for that use
 * the special `$componentTemplateNodes` value available at templates
 * ([check out Knockout documentation](knockoutjs.com/documentation/component-custom-elements.html))
 */

/**
 * Interface for objects that includes a disposal task.
 *
 * @interface IDisposable
 */
/**
 * Get the color as an array of red, green, and blue values, represented as
 * decimal numbers between 0 and 1.
 *
 * @function
 * @name IDisposable#dispose
 * Explicitely free ressources, stop tasks, and similar.
 */
