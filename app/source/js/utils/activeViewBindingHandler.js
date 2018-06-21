/**
    A pair of binding handlers to manage which element in a set (the 'view') is rendered
    depending on the value for the active view (defined by the parent).

    Can be understood as a specialized switch-case (there is a third party binding
    for that, actually; this is simpler in combinations/possibilities but perform
    extra behaviors as defined below).

    EXPERIMENTAL. ONLY ONE ALLOWED PER BINDINGS CONTEXT.

    How to use:
    - Specify the 'activeView' binding in an element, assigning an observable that
      holds a string with the unique view to be displayed each time.
    - Specify the 'view' binding on each immediate child element, can be a static
      value or an observable (though, usually a static value make the code clearer).

    Behaviors:
    - The bindings 'if', 'visible' and 'autofocus' are applied automatically on
      each view element
    - Is incompatible to specify any of that in combination with the 'view'
      binding
    - When a view is not active, it's content is not rendered (cause of 'if') and
      its element doesn't display (cause of 'visible' --that prevents margins, paddings
      on empty content and other unwanted behavior).
    - When a view switch to be the active one, if receives focus automatically
      to make the change between views accessible (cause of 'autofocus').
**/
import './autofocusBindingHandler';
import ko from 'knockout';

ko.bindingHandlers.activeView = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        bindingContext.$activeViewAccesor = valueAccessor;
    }
};
const makeValueAccesor = (bindingContext, valueAccessor) => () => ko.pureComputed(() => {
    const activeView = ko.unwrap(bindingContext.$activeViewAccesor());
    return activeView === ko.unwrap(valueAccessor());
});
ko.bindingHandlers.view = {
    flags: ko.bindingHandlers['if'].flags,
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        if (!('$activeViewAccesor' in bindingContext)) {
            throw new Error('The activeView binding must be assigned in a container --and only once');
        }
        const applyBHandler = function(binding) {
            if (ko.bindingHandlers[binding].init) {
                return ko.bindingHandlers[binding].init(
                    element,
                    makeValueAccesor(bindingContext, valueAccessor),
                    allBindings,
                    viewModel,
                    bindingContext
                );
            }
        };
        const options = applyBHandler('if');
        applyBHandler('visible');
        if (ko.bindingHandlers.autofocus) {
            applyBHandler('autofocus');
        }
        return options; //{ controlsDescendantBindings: true };
    },
    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        const applyBHandler = function(binding) {
            if (ko.bindingHandlers[binding].update) {
                return ko.bindingHandlers[binding].update(
                    element,
                    makeValueAccesor(bindingContext, valueAccessor),
                    allBindings,
                    viewModel,
                    bindingContext
                );
            }
        };
        applyBHandler('if');
        applyBHandler('visible');
        if (ko.bindingHandlers.autofocus) {
            applyBHandler('autofocus');
        }
    }
};
