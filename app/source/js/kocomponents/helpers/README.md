# Knockout Components Helpers
This folder contains helpers modules, like base classes, useful for implementation
of components using Knockout.

Other folders inside the /kocomponents represent packages of components, being
this folder an exception to that rule.

The scope of this helpers modules is all packages, any component. Other helper
modules used only by components in a package must be placed in a `helpers`
subfolder of that package (can be moved here if other packages want to use it,
promoting reutilization but keeping scope specific before that).
