Single page application with entry point app.js 
Shell js/utils/shell:
Class that manages the URL content and the DOM element that is shown/hidden along with styles.
/history
catch the link and apply load logic to URL
triggers events
Does the shell handle routes (mapping between URL and code path)
Implicit routing for the first segment (page name) to the activity with the same name, e.g. /help/ 
How to display help/section/id:
We do it inside the /help js code. Recieves some parameters (URL, segments, queries).

app.js:
init the shell
put some event handlers to listen for link changes 
so activities are outside the shell
listen for events, like url changes, and route to a defined activity class

activity class:
base class for basic activity setup
show/hide method can be replaced for specific activities
common things:
going to page B from page A, it's still listening unless you disconnect/unsubscribe
displayed to anonymous users but if access is needed, e.g. client/service professional
Update nav bar:
- mobile: global piece of html (gets a bit complicated as it updates it globally...bad design in hindsight)
Initialize the app model

When you go from one activity to another, it maintains the original instance
Single instance for each activity
Need to study performance and memory usage


Models/AppModels:
Disconnected from routing
-a way to declare classes we use for different structures of data 
-created in a special way 
Most specific is dev properties code
-need to create a knockout observable for each property
problem: when you get data from the api. if you want to create/update an instance of a view model, you need to update line-by-line. 
Tried to simplify with knockout. 
Automatically create a plan JSON object to put in the API
model.updateWith 
we're not trying to clone every property we have, just the registered properties (only the data model we're using).
They don't need to map to a table or rest API but usually do.
We can add computable knockout observables or other powerful knockout features

Additional features inside dev properties:
-can be an array: we can say the value is another model and creates an instance of that inside the array?

if we need, we can create captured data in memory/local storage (outside of activities) so we can put additional features in the activity without having to put
the code in the activity but still use it. This keeps the activity focused on the nuances of that activity.

Uses appModel.REST.object

we're using local forage library

Loads all models for the appModels
-at some point will need to split the bundle as we're currently loading all at once

Utils:
data models
-group
-

Want to read a plain object or an instance of a model (Unclear what is best)

Doesn't make sense to have the local storage if it's not needed/used

## 
activities
viewmodels
app.activities.js
utils
app-components.js
app-navbar.js
appmodel
app.modals.js
models
modals
app.js
app.shell.js
components
app-shell-history.js
custom-modernizr.js
locales
cordova-config.js.xml

