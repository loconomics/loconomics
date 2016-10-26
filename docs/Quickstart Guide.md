# Quick Start Guide

## Download or clone the master branch of the Loconomics Github repository
- [Download](https://github.com/dani0198/Loconomics/archive/master.zip)
- Cloning link: https://github.com/dani0198/Loconomics.git
- [Help with cloning](https://help.github.com/articles/cloning-a-repository/)

## Install Node.js

You'll need to [download Node.js v4.6.0](https://nodejs.org/en/download/) (macOS, Windows, Linux) and install on your local machine.

## Install Grunt globally (from the command line)
```
npm install -g grunt-cli
```
Note: Linux and Mac may require root/elevated rights in order to install globally.

## Install modules (from the command line in the project directory)
```
npm install
```
It will install all the modules listed on the package.json file, needed to build the app source code.

## Build the app source code

Ensure you're in the project's /app folder and run:
```
grunt build
```
It will recreate the content of the /build and /phonegap folders.

## Start your local host

**Ensure you're in the project's /app folder **

There are two options for this, with the second one preferred:

First option:
```
grunt connect:atbuild
```
Allows you to test the webapp in the browser, a lightweight built-in http server is being used (connect), to start it, run next command and keep the task alive.

Second option (preferred):
```
grunt atwork
```
This will:
- run the connect server at http://localhost:8811/
- run the watch task that will listen for changes on source files to automatically rebuild the needed files (specific builds are performed, like build-js, build-css, depending on the modified files; when they finish, the browser can be refreshed to try latest changes).
- by modifying the package.json file, e.g. to update the version number, the watch task will run the grunt build task, rebuilding everything; when it finishs, the /build/latest.zip file is ready to be sent to PhoneGap Build, and the phonegap folder is ready to perform local PhoneGap builds.
- when the build ends, a notification is sent to the system. [More info on this](https://github.com/dylang/grunt-notify)

## Open the app

Open your browser (Chrome preferred) and open:
```
http://localhost:8811/appDebug.html
```
If you see a directory, select appDebug.html to open the app.

The appDebug.html available at localhost:8811 contains non-minimized and source mapped files, better for debugging. I use this all the time when developing, the other just to test something in case there are doubts that some minimizing option could break something (not normally). But with the project getting bigger, it starts to be a huge load for browsers and debuggers, I have in mind the need to split project files loaded on demand (good for debugging and for webapp load times).


## Point your local storage to a database

At start-up, the app looks for a siteUrl in the config key at localStorage. Since there isn't one set for your localhost, it needs to be set using the html attribute data-site-url. To setup a different REST Service URL:

### Step 1: Open the Web console with the page opened (can be the local development server created by 'grunt atwork', or our Webapp dev.loconomics.com)

### Step 2: Replace the data-site-url:

For our dev database (ignore security warnings):
```
localStorage["LoconomicsApp/config"] = '{"siteUrl":"http://dev.loconomics.com"}';
```
For your local database:

```
localStorage["LoconomicsApp/config"] = '{"siteUrl":"http://localhost/loconomics"}';
```
To restore it and have the App/Webapp use the default URL:
```
delete localStorage["LoconomicsApp/config"]
```

