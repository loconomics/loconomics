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

## Install Phonegap globally (from the command line)
```
npm install -g phonegap
```

## Install modules (from the command line in the project directory)
```
npm install
```
It will install all the modules listed on the package.json file, needed to build the app source code.

## Build the app

Ensure you're in the project's /app folder and run:
```
grunt build
```

## Start your local host

Ensure you're in the project's /app folder and run:
```
grunt atwork
```

## Open the app

Open your browser (Chrome preferred) and open:
```
http://localhost:8811/appDebug.html
```

## Point your local storage to a database

At the Web console with the page opened (can be the local development server created by 'grunt atwork', or a website Webapp like dev.loconomics.com), use next to setup a different REST Service URL.

For our live database:
```
localStorage["LoconomicsApp/config"] = '{"siteUrl":"https://loconomics.com"}';
```
To restore it and have the App/Webapp use the default URL:
```
delete localStorage["LoconomicsApp/config"]
```
