# App Quick Start Guide

## Download or clone the master branch of the Loconomics Github repository
- [Download](https://github.com/loconomics/loconomics/archive/master.zip)
- Cloning link: https://github.com/loconomics/loconomics.git
- [Help with cloning](https://help.github.com/articles/cloning-a-repository/)

## Install Node.js

You'll need to [download Node.js v4.6.0](https://nodejs.org/en/download/) or newer (macOS, Windows, Linux) and install on your local machine.
*Note: if a problem is detected when using a newer version of Node, please post errors in [a new issue](https://github.com/joshdanielson/Loconomics/issues/new), we want to support newest versions.*

## Install Grunt globally (from the command line)
```
npm install -g grunt-cli
```
Note: Linux and Mac may require root/elevated rights in order to install globally, try:
```
sudo npm install -g grunt-cli
```
## Install modules (from the command line in the /app folder of the project directory)
```
npm install
```
It will install all the modules listed on the package.json file, needed to build the app source code.

## Build the app source code

Ensure you're in the project's /app folder and run:
```
grunt build
```
It will recreate the content of the /build folder.

After do that you may want to [build the native apps using Phonegap](Deploying the App.md) or debug the app.

## Debug the app on localhost

**Ensure you're in the project's /app folder **

There are two options for this, with the second one preferred:

#### First option:
Allows you to test the webapp in the browser, a lightweight built-in http server is being used (connect), to start it, run next command and keep the task alive.
```
grunt connect:atbuild
```

#### Second option (preferred):
```
grunt atwork
```
This will:
- run the connect server at http://localhost:8811/ (same as `grunt connect:atbuild`)
- run the watch task that will listen for changes on source files to automatically rebuild the needed files (specific builds are performed, like build-js, build-css, depending on the modified files; when they finish, the browser can be refreshed to try latest changes).
  **Important:** the 'watch' task is unable to detect new created files of some types, requiring us to manually restart the 'atwork' task to let detect further changes. Any help fixing this is welcome, at [#1123](https://github.com/joshdanielson/Loconomics/issues/1123).
- by modifying the package.json file, e.g. to update the version number, the watch task will run the grunt build task, rebuilding everything.
- when the build ends, a notification is sent to the system. [More info on this](https://github.com/dylang/grunt-notify)

## Open the app

Open your browser (Chrome preferred) and open:
```
http://localhost:8811/appDebug.html
```
If you see a directory, select appDebug.html to open the app.

The **appDebug.html** available at localhost:8811 contains non-minimized and source mapped files, better for debugging. It's the preferred one for development, while we have an app.html that contains minimized files without source maps that is what we use in production, just in case there are doubts about minimizing options that could break something (not normally) we have this to test and verify.
*Note:* All JS, CSS and HTML is being bundled on single files right now, with the project getting bigger it starts to be a huge load for browsers and debuggers, we have in mind the need to split project files and load them on demand (good for debugging and for webapp load times).

## Point your local storage to a database

The App/Webapp needs to know where is the REST Service to access data.
At start-up, the app looks for a `siteUrl` key at localStorage; if nothing, looks for a `data-site-url` attribute at the html
element; if nothing, uses the document base URL (the domain from where the document is being served).

### To set up a different REST Service URL:
Open the Web console with the page opened (can be the local development server created by 'grunt atwork', or our Webapp dev.loconomics.com) and replace the `local siteUrl`:

#### For our dev database (ignore security warnings):
```
localStorage.siteUrl = 'http://dev.loconomics.com';
```
#### For your local database:
```
localStorage.siteUrl = 'http://localhost/loconomics';
```
#### To restore it and have the App/Webapp use the default URL:
```
delete localStorage.siteUrl;
```

## API Access & Testing
Create a user account on http://dev.loconomics.com and request access from [@iagosrl](mailto:iago@loconomics.com) or [@joshdanielson](mailto:joshua.danielson@loconomics.com)
http://dev.loconomics.com/tests/testrest
