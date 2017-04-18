# App Overview
Loconomics is a hybrid application built with HTML, CSS and JavaScript with a single codebase. It uses [Phonegap](http://phonegap.com/) to export the app to iOS and Android.

## Preprocessors
### CSS 
[Stylus](http://stylus-lang.com)

### JS 
[Browserify](http://browserify.org/)

### HTML 
[Bliss](html)

## Preferred Dev Tools
### Text Editor
[Brackets](http://brackets.io/)

### Browser
[Chrome](https://www.google.com/chrome/browser/desktop/index.html)

[Chrome Developer Tools](https://developer.chrome.com/devtools)

![browserstack1](https://cloud.githubusercontent.com/assets/1202838/23223934/575af6d0-f8e1-11e6-9082-63464329f70e.png)
[Click here to download](https://www.browserstack.com/)

### Database Query & Administration
[Razor SQL](https://razorsql.com/) is an SQL query tool, database browser, SQL editor, and database administration tool for Windows, Mac OS X, macOS, Linux, and Solaris

## Main libraries
[jQuery-2](https://jquery.com)

[Bootstrap-3](http://getbootstrap.com)

[Knockoutjs-3.3](http://knockoutjs.com): JavaScript implementation of the Model-View-ViewModel pattern with templates

[Polyfills](https://www.npmjs.com/package/js-polyfills) for ES5 and ES6-Promise

[Momentjs](http://momentjs.com/)

[Nodejs](https://nodejs.org/en/) to assist in front-end development

[Grunt](http://gruntjs.com/) as a task runner

## Testing

Our [Mocha](http://mochajs.org/) tests are in ``app/source/test/``.

### Build and Run Unit Tests

```bash
grunt test
```

After the tests have been built, you can also run (and debug) them in the browser using the test harness file: ``app/source/test/test.html``

### Frameworks

- [Mocha](http://mochajs.org/) for unit tests
- [Expect API](http://chaijs.com/api/bdd/) from [Chai](http://chaijs.com/) for assertions
- [Sinon](http://sinonjs.org/) for mocks and stubs

### Conventions

1. Tests in ``source/test`` correspond to modules under ``source/js``.
2. Use the same file name as the module you are testing, but change the suffix to ``.spec.js``.

## Database  
We run a SQL Server 2008 R2 database hosted on Microsoft Azure. Request access from [@iagosrl](mailto:iagosrl@gmail.com) or [@joshdanielson](mailto:joshua.danielson@loconomics.com).

# Supported Browsers and Platforms
| Browser | Supported Version |
| --- | --- |
| IE | 11
| Edge | Current, Current - 1
| Firefox | Current, Current - 1
| Chrome | Current, Current -1
| Safari | Current, Current - 1
| Opera | Current
| iOS Safari | Current, Current - 1, Current - 2
| Opera Mini | None
| Android | 4.4+
| Chrome for Android | Current
