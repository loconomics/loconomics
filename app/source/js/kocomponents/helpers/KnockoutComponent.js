/**
 * Base class to help implementing a Knockout Component.
 * The class instance becomes the ViewModel attached to a component, and the
 * class includes static (shared and read-only) information about the
 * component, as the template.
 * This class implements some generic features needed on most cases,
 * enforces some good practices and sets a common lifecycle for components.
 *
 * ## Component lifecycle
 * This class both simplifies and organizes implementation of components,
 * being the most usual to just implement the constructor.
 * There are some common steps that require/may need to be implemented usually,
 * defined as 'simplified lifecycle' and others to understand the internals
 * and more advanced replacable parts described at 'advanced lifecycle'.
 * Both lists show up in strict order of execution, check the own
 * methods/elements documentation for details.
 *
 * ### Simplifed lifecycle
 * - `constructor`: defining the instance view-model
 * - `beforeBinding`: template instantiated but not yet bound
 * - `afterRender`: all processed, ready for the user
 * - `dispose`: clean-up before removal
 *
 * ### Advanced lifecycle
 * To be able to understand all the implementation or perform some advanced,
 * yet rare, sub-classes set-ups, it's important to know
 * the [Knockout components lifecycle](http://knockoutjs.com/documentation/component-binding.html#component-lifecycle)
 * and how [component loaders works](http://knockoutjs.com/documentation/component-loaders.html),
 * for which this class offers implementation details and customization.
 * This class should work for all cases while offering clear replaceable methods
 * to hook at the internals of the life of the component, but if something too
 * different is needed may be far easier to use Knockout components API directly
 * rather than this class and reuse some utilities.
 *
 * Process:
 * - A component is defined and registed with `ko.components.register(..)` passing
 * in a tag name and the component class.
 * - Knockout detects a component using this base class and runs its specific loader
 * - KnockoutComponent loader offers the template from the `static get template()`.
 * Must be implemented by derived classes.
 * - KnockoutComponent loader offers the `static from(params, componentInfo)`
 * method as the creator of the view-model (AKA: { createViewModel: ..from }).
 * Most cases, if not all, will never need to replace this. The standard `from`
 * is responsible to execute internally the next two steps.
 * - The component class is instantiated (constructor executed); that instance
 * works as the view-model.
 * - beforeBinding is triggered, providing componentInfo data.
 * - afterRender is triggered.
 * - dispose is triggered, the element is being removed completely after this.
 */
'use strict';

import insertCss from 'insert-css';
import ko from 'knockout';

export default class KnockoutComponent {
    /**
     * Must be implemented by derived classes
     * @member {string}
     */
    static get template() { throw new Error('No component template defined'); }

    /**
     * CSS text defining the style created for the component
     * @member {string}
     */
    static get style() { return undefined; }

    /**
     * CSS class name defined at `style` that will be added to the component
     * instance.
     * @member {string}
     */
    static get cssClass() { return undefined; }

    /**
     * Set-up the members to be used as the component view model, process
     * incoming parameters and set-up tasks based on data changes.
     *
     * - Members: observable properties, computed members. Functions needed to
     * trigger actions from binding can be defined here as arrow functions
     * or as class methods (in this last case, be aware of edge cases that can
     * change the `this` context).
     *
     * - Parameters: external data and observables, used to set initial values
     * for the observable properties, used directly as properties in order
     * to keep bi-directional communication of data changes (parent<->child,
     * view<->component), or to provide callbacks to notice events or results.
     *
     * - Tasks: side effect computeds (functions running whether an observable(s)
     * changes --use `observeChanges`), request or listen to external
     * data/services. When having large/lots of tasks, define and call a `tasks`
     * method for them or even individual task specific ones, to keep functions
     * small in statements and complexity.
     *
     * @param {Object} params Instance parameters, given through the params
     * attribute and processed by Knockout
     */
    constructor() {
        /**
         * Holds a list of objects with a 'dispose' method or functions that
         * need to be called when disposing the component, freeing up ressources
         * that don't do it automatically (see `dispose` method).
         * @member {Array<(Function,IDisposable)>}
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
         * the `style` into the page (at the element template instance)
         * @private {HTMLElement}
         */
        this.__styleElement = this.constructor.style && insertCss(this.constructor.style, {
            container: componentInfo.element
        });
        // TODO: Insert in a global space with detection of duplications, since
        // now insert-css does an append-only and the styleElement created at
        // global place is shared for all (cannot be removed).
        // If there is a component style, must be removed.
        if (this.__styleElement) {
            this.disposables.push(() => {
                this.__styleElement.parentNode.removeChild(this.__styleElement);
            });
        }
    }

    /**
     * All binding was set-up, triggered initial values,
     * all DOM is ready including sub-components. It enables post-processing
     * when custom binding handlers are not enough or just is simpler this way
     */
    afterRender() {
        /* eslint class-methods-use-this:off */
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
     * It creates a Knockout Computed with the given function that will be
     * automatically disposed at the end of life of the component.
     * The context of the function will be the component instance.
     * @param {function} task Function that will read some observables and perform
     * a task with their values, repeating at every data change
     * @returns {KnockoutComputed} The computed generated, that can be extended
     * as usual.
     */
    observeChanges(task) {
        var computed = ko.computed(task, this);
        this.disposables.push(computed);
        return computed;
    }

    /**
     * It subscribes to the given object and automatically disposes the
     * subscription at the end of life of the component.
     * @param {ISubscribable} subscribable An object implementing the `subscribe`
     * method, that lets to subscribe to notifications received in the callback
     * and lets `dispose` that subscription to prevent memory leaks.
     * Common used objects here are SingleEvents and Knockout Observables (as alternative to
     * observeChanges when just one observable is watched and don't want a first
     * time execution of the callback when connecting).
     * @param {function} callback Function executed every time the subscribable
     * notifies including data in the parameters.
     * @returns {IDisposable} Returns back the subscription that allows disposal.
     * Remember that manual disposal is not needed, except disposal before
     * the end of life of the component is wanted.
     */
    subscribeTo(subscribable, callback) {
        if (!subscribable || typeof(subscribable.subscribe) !== 'function') {
            throw new Error('Given object is not subscribable', subscribable);
        }
        var disposable = subscribable.subscribe(callback);
        if (!disposable || typeof(disposable.dispose) !== 'function') {
            throw new Error('Given subscribable does not allows disposal', subscribable, disposable);
        }
        this.disposables.push(disposable);
        return disposable;
    }

    /**
     * Creates an instance from the input parameters and DOM references of
     * the instantiated template and given children nodes.
     * It implements the execution of some common lifecycle steps.
     *
     * NOTE: In Knockout internals, this is used as the `createViewModel`
     * function given at component registration, so any subclass customizing
     * this MUST keep the same interface
     * @see knockoutjs.com/documentation/component-registration.html#a-createviewmodel-factory-function
     *
     * @param {Object} params is an object whose key/value pairs are the parameters
     * passed from the component binding or custom element ('data-params="_is_this_"')
     * @param {Knockout.ComponentInfo} componentInfo Access to DOM elements instantiated from
     * the component template or nodes provided
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
 * They are the children given to the instance of the component, like:
 * <knockout-component> template <span>nodes</span> </knockout-co
 * mponent>
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
