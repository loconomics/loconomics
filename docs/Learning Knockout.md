# Learning Knockout
Before learning Knockout, review our [App Framework](https://github.com/loconomics/loconomics/blob/master/docs/App%20Framework.md) 
that outlines the shell, Activities, data, Model class, modals, etc. We use Knockout observables, but we do NOT use the Knockout
API so it's important to keep that clear while learning Knockout to avoid confusion.

## Getting started
- Visit the [Knockout website](https://knockoutjs.com) and first review some [live examples](http://knockoutjs.com/examples/).
- Play around with their [tutorials](http://learn.knockoutjs.com/) while reviewing the [documentation](http://knockoutjs.com/documentation/introduction.html)  

## Recommended documentation chapters
### Getting started  
- [How KO works and what benefits it brings](http://knockoutjs.com/documentation/introduction.html)  
### Observables
- [Creating view models with observables](http://knockoutjs.com/documentation/observables.html) 
- [Working with observable arrays](http://knockoutjs.com/documentation/observableArrays.html) 
#### Computed observables
- [Using computed observables](http://knockoutjs.com/documentation/computedObservables.html) 
- [Writable computed observables](http://knockoutjs.com/documentation/computed-writable.html) 
- [How dependency tracking works](http://knockoutjs.com/documentation/computed-dependency-tracking.html) 
- [Pure computed observables](Pure computed observables) 
- [Reference](http://knockoutjs.com/documentation/computed-reference.html) 
### Bindings
#### Controlling text and appearance
- [The visible binding](http://knockoutjs.com/documentation/visible-binding.html) 
- [The text binding](http://knockoutjs.com/documentation/text-binding.html) 
- [The html binding](The html binding) 
- [The css binding](http://knockoutjs.com/documentation/css-binding.html) 
- [The style binding](http://knockoutjs.com/documentation/style-binding.html) 
- [The attr binding](http://knockoutjs.com/documentation/attr-binding.html) 
#### Control flow 
- [The foreach binding]() 
- [The if binding]() 
- [The ifnot binding]() 
- [The with binding]() 
- [The component binding]() 
#### Working with form fields
- [The click binding]() 
- [The event binding]() 
- [The submit binding]() 
- [The enable binding]() 
- [The disable binding]() 
- [The value binding]() 
- [The textInput binding]() 
- [The hasFocus binding]() 
- [The checked binding]() 
- [The options binding]() 
- [The selectedOptions binding]() 
- [The uniqueName binding]() 
#### Rendering templates
- [The template binding]() 
#### Binding syntax
- [The data-bind syntax]() 
- [The binding context]() 
### Components
- [Overview: What components and custom elements offer]() 
- [Defining and registering components]() 
- [The component binding]() 
- [Using custom elements]() 
### Further techniques
- [Rate-limiting observables]() 



## Advanced documentation
### Creating custom bindings
- [Controlling descendant bindings]() 
- [Supporting virtual elements]() 
- [Custom disposal logic]() 
- [Preprocessing: Extending the binding syntax]() 
### Further techniques
- [Loading and saving JSON data]() 
- [Extending observables]() 
- [Deferred updates]() 
- [Unobtrusive event handling]() 
- [Using fn to add custom functions]() 
- [Microtasks]() 
- [Asynchronous error handling]() 




















My experience with learning Knockout, as an experienced JavaScript programmer, was to check their (interactive) tutorial and then check documentation. That worked for me, but some course may be better (without taking them is difficult to know how goo are).

From documentation, I think not all needs reading from the beginning, most important is:
- 'Observables' chapters, in detail
- 'Bindings' chapters: important to know what is available; if there is not too much time, some too detailed paragraphs and advanced topis inside each can be discarded and just checked later as a reference
- 'Components' chapters. Discard the last one 'advanced: custom loaders', we don't use and don't expect use it.
- 'Rate-limiting observables' chapter under 'Further techniques' is a bit advanced but used frequently

- That's all to start with. More advanced topics to check later, after some experience using Knockout, are 'custom bindings', 'further techniques'

Knockout links to some external tutorials, the name John Papa appears there mentioning a PluralSight course but link is broken. Maybe founding that could be great, I found this from John Papa but seems to cover more than just Knockout (maybe interesting, since ours is an SPA, maybe distracting or longer than needed); others that 'seems' good at quick shot are Knockout Fundamentals (shorter) and Building HTML5 and JavaScript Apps with MVVM and Knockout (larger, full of demos).

