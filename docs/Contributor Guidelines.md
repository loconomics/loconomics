# Contributor Guidelines

## Communications
We prefer to keep all communications in each related Github issue and converse with each other using our @username so that conversations are well documented and stay within the project even if it requires a new issue for it.

## General coding style
All source files use 4 spaces indentation, UTF8 file enconding.

## CSS Naming Conventions

We use Bootstrap as CSS framework and it has its own naming rules, for anything related to Boostrap (like adding changes, modifiers on top of Bootstrap classes) or files under /utils folder, we follow the simple Boostrap naming.

But for *components* styles, the classes at /components folder that start with uppercase letter, we use [SUIT naming convention](https://github.com/suitcss/suit/blob/master/doc/naming-conventions.md)

**Disclaimer**: this rules were not strictly followed in the past or there is code created before we set this rules, then current source code needs some clean-up/refator. New code must follow the rules.

We use a preprocessor, [Stylus](http://stylus-lang.com/); it's similar so SASS. We prefer the syntax more similar to CSS (use of semi-colons, brackets, etc.) while taking advantage of the features it provides (mixims, nesting, etc.).

## JS

We use ES6-ES2017 (Ecmascript 2017 edition) syntax in strict mode, using [Babel](https://babeljs.io/) to transpile it as ES5 depending on supported engines (using the `env` preset and `babel-polyfill`). **WIP** Previously we were restricted to use ES5, we are switching incrementally to updated syntax where helps to make more clear and robust code. Help wanted to modernize codebase this way [#744](https://github.com/loconomics/loconomics/issues/744).

We use [eslint](https://eslint.org/) to validate and enforce some good practices, helping reduce the number of bugs. Every commit must pass the eslint rules. *Note:* There is a command to help fix some problems automatically, run `npm run lint`.

We split source files in modules, we followed the [CommonJS](http://wiki.commonjs.org/wiki/Modules/1.1) syntax but we prefer ES6 syntax now.
We use a preprocessor, [Browserify](http://browserify.org/), to bundle the modules in a few files.

**Hint**: the *[debugger;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/debugger)* javascript statement can be used for easier debugging, but remember to remove it before commiting your changes.

## HTML

We use HTML5.

Since we use the [KnockoutJS](http://knockoutjs.com/) library, there are a lot of 'data-bind' attributes, with javascript syntax in the value; this is used to connect elements with data generated from javascript files, while the javascript inside the 'data-bind' attribute must be kept at minimum as needed (avoid large or complex expressions, it's better if it can be just a variable assignement).
We use 'custom-elements' syntax sometimes in the HTML, for components created with KnockoutJS.

We use a preprocessor, [Bliss](https://github.com/cstivers78/bliss) at the minimum; it uses Asp.net Razor-like syntax, adapted for javascript. Generally, we use it only at the files wrapping all the html (examples: app.js.html, web.js.html).

### Ordering HTML attributes

To keep consistency in our code, make it easier for debugging, and to adhere to our [Accessbility Policy](https://github.com/loconomics/loconomics/blob/master/docs/App%20Accessibility%20Policy.md) the following ordering should be followed:
```
id="", data-bind="", role="", title="", rel="", src="", alt="", href="", target="", class=""
```

## Changes to the database

Any proposed changes to the database should be made by placing a .sql file in the web/_DBUpdate folder of your branch with the file named with these three attributes:
- issue123 (the branch name) +
- A1 (order of the changes made to the database. Start a new letter if unrelated.) +
- short title (something describing the changes)

### Example
```
issue1076 - A1 - new customertransactiontype table.sql
```

Changes to stored procedures or user defined functions should be reflected in the file corresponding to the object under ``/database/``. The update script should be added to the ``_DBUpdate`` folder just like any other database change. If the object already exists in the database, the update script should use the ``ALTER`` statement.

## Use of Github

We use Github to track all development issues, project management, product roadmaps, and documentation. An [internal repository](https://github.com/joshdanielson/loconomics-internal) includes tasks related to the internal operations of Loconomics and is limited to Loconomics Staff.

### Branch use and pull requests
Please review [Understanding the Github Flow](https://guides.github.com/introduction/flow/) as we follow its process.

#### Master, testing, staging, live
Only [@iagosrl](mailto:iagosrl@gmail.com) has permissions to commit to the master branch.

#### New branches
If you are working on a specific Github issue, please create a new branch named is123-short-descriptor if one doesn't already exist and merge master into it periodically. When you're finished, create a pull request for that branch and ask [@iagosrl](mailto:iagosrl@gmail.com) to review.

#### Pull requests
We prefer you to create a Github issue for a specific task to tackle with it's own branch (see above). However, direct pull requests are fine if you want to make general updates or suggest a change.

### Bugs
Before reporting a bug:
* Please have a look at issues tagged as bugs ([Bug S1](https://github.com/loconomics/loconomics/labels/Bug%3A%20S1), [Bug S2](https://github.com/loconomics/loconomics/labels/Bug%3A%20S2), [Bug S3](https://github.com/loconomics/loconomics/labels/Bug%3A%20S3), [Bug S4](https://github.com/loconomics/loconomics/labels/Bug%3A%20S4)) to see if the bug has already been reported. If so please add any extra, clarifying information you can to the existing issue.

The first thing we do with a bug report is to confirm that we can reproduce the bug. Please try to give us enough information so that we can produce the buggy experience ourselves:

Try to include:
* What steps you took just before the bug.
* What you were expecting to happen when the bug happened.
* What actually happened - the buggy behaviour itself.
* What web browser you were using.
* Screen shots.
* BookingIDs, JobTitleIDs involved.
* The /activityName from the URL.
* **DO NOT INCLUDE** any personally identifiable information (no UserIDs, Names, Addresses, etc.)

[File a new Github issue](https://github.com/loconomics/loconomics/issues/new) with two labels and include the severity in the title, e.g. Bug S1: Short description of bug:
#### Bug Severity Level Label
![bug](https://cloud.githubusercontent.com/assets/1202838/20122990/bed40e00-a5d0-11e6-9a41-ac583f8e7883.png)

##### Definitions:
- Bug: S1 (The issue is blocking an impending release.)
- Bug: S2 (The issue causes data loss, crashes or hangs salt processes, makes the system unresponsive, etc.)
- Bug: S3 (The issue reports incorrect functionality, bad functionality, a confusing user experience, etc.)
- Bug: S4 (The issue reports cosmetic items, formatting, spelling, colors, etc.)

#### Feature Set Label
![feature set](https://cloud.githubusercontent.com/assets/1202838/20122985/beb9b0be-a5d0-11e6-92d1-200614a3a74e.png)

#### Pipeline/Milestone/Estimate/Epic
Leave the pipeline default of "New Issues" and do not attach a milestone, estimate, or epic to the issue. This will be done by @joshdanielson and later reviewed by the Dev team.

### Filing development issues
[File a new Github issue](https://github.com/loconomics/loconomics/issues/new) with four labels if possible (if not sure, leave blank):

#### Priority Level Label
![priority](https://cloud.githubusercontent.com/assets/1202838/20122988/bebb0522-a5d0-11e6-94b9-73c2dce28fe1.png)

##### Definitions:
- P1 (The issue will be seen by all users.)
- P2 (The issue will be seen by most users.)
- P3 (The issue will be seen by about half of the users.)
- P4 (The issue will not be seen by most users. Usually the issue is a very specific use case or corner case.)

#### Category Label
![category](https://cloud.githubusercontent.com/assets/1202838/20122991/bed5f51c-a5d0-11e6-8017-bc1f59502671.png)

#### Feature Set Label
![feature set](https://cloud.githubusercontent.com/assets/1202838/20122985/beb9b0be-a5d0-11e6-92d1-200614a3a74e.png)

#### Readiness Label
![readiness](https://cloud.githubusercontent.com/assets/1202838/20122984/beb95484-a5d0-11e6-940b-42633ff5648b.png)

#### Milestone
@joshdanielson will place into Product Roadmap and In Design Process. R1 issues will be place into Releases based on developer feedback.

### Issue Progression
As issues progress, some labels will change and others added.

#### Readiness
![readiness](https://cloud.githubusercontent.com/assets/1202838/20122984/beb95484-a5d0-11e6-940b-42633ff5648b.png)

#### Testing
![testing](https://cloud.githubusercontent.com/assets/1202838/20123132/d40e3574-a5d1-11e6-9d1c-40627a6d52b9.png)


