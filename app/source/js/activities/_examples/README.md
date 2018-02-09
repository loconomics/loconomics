# Activities Examples
Each contained folder is an example of an activity that can be inspected to look
for help about how to create activities and used them as a base template that can
be copied+renamed to implement a new one.

*Note:* let's name this 'examples' rather than 'templates' to do not confuse
with the html templates used by the activities.

## Learning
If is your first time here, please read carefull this README and take a look
to the examples following the alphabetic order of their names; you will see
that an initial letter is being used to sort them, starting from the most simple
and adding details based on concepts learnt in previous examples.

## Naming
Each new activity has its own folder, the name of the folder must match the
name of the activity and the route (the initial URL path), using hyphens and
lowercase. Be aware that in the JavaScript, the class name follows PascalCase,
but should be still the same name just converted to that convention, plus
the text 'Activity' as suffix.

When copying an example to create a new activity, remember set the name
properly in the folder and in the code replace every occurrence of
texts 'ExampleActivity' or 'example-activity' with your activity name
matching the casing.

### WIP
We are migrating old activities to this new organization (folders rather than
single files), naming (camelCase used to name there before), and coding style
(ES6 class syntax, simplified logic removing the additional internal ViewModel
class, using components to implement features and the activity to compose
the UI layout and initialize main component) so other activities are not good
example for the rules described here.

After migrate all activities to folders, the only file directly under the
activities folder should be 'index.js', that is not an activity but the
utility used to keep an index or registry of loaded activitiess. Other utilities
shared between activities and used only by activities should exist under
the activities/helpers/ folder (that is not an activity, too).

## Inline notes
The examples has some notes like 'FIXME:' that need to be read carefully and
removed. Please, follow the instructions on each of them, specially 'FIXME:',
the ones that say 'REMOVEME:' are just highlighted notes that should be removed.
