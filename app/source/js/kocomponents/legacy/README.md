# Legacy Knockout Components
This folder contains components in a intermediate state of refactoring, coming
from being Global Components to become explicit dependencies here.

## Global Components
They were before prefixed with `app-` and defined globally at `app-components.js`
(and therefore, loaded all the time bloating execution and common bundle),
with assets separated at file type folders, html templates loaded in the html
bundle file (and referenced by ID attribute), and ViewModel implemented inline
or at a shared folder with no proper documentation of parameters, usage and
goal.

## Refactor needs
As goal for the 'decoupling components' issue (#849), we need to rething
which of that original Global Components are still needed, organize them
at proper 'package', refactor parameters and implementation following latest
conventions.

## Intermediate refactor step
But for a quick transition from global to explicit dependencies, stop sharing
the ViewModel, put assets together and initial documentation, we have this
folder replacing the `app-` prefix with `legacy-`, and updating every place
they were used for the new name and require them explicitly. That way some
main goals of #849 are met and is easier to reason about the components for
further refactoring.
