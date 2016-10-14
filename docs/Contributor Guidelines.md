# Contributor Guidelines

## Communications
We prefer to keep all communications in each related Github issue and converse with each other using our @username so that conversations are well documented and stay within the project even if it requires a new issue for it. 

## CSS Naming Conventions

We use Bootstrap as CSS framework and it has it's own naming rules, for anything related to Boostrap (like adding changes, modifiers on top of Bootstrap classes) or files under /utils folder, we follow the simple Boostrap naming.

But for *components* styles, the classes at /components folder that start with uppercase letter, we use [SUIT naming convention](https://github.com/suitcss/suit/blob/master/doc/naming-conventions.md)

**Disclaimer**: this rules were not strictly followed in the past or there is code created before we set this rules, then current source code needs some clean-up/refator. New code must follow the rules.

## Changes to the database

Any proposed changes to the database should be made by placing a .sql file in the web/_DBUpdate folder of your branch with the file named with these three attributes:
- issue123 (the branch name) +
- A1 (order of the changes made to the database. Start a new letter if unrelated.) +
- short title (something describing the changes)

### Example
```
issue1076 - A1 - new customertransactiontype table.sql
```

## Use of Github

We use Github to track all development issues, marketing tasks, project management, product roadmaps, and a repository for for other related project information.

### Bugs
Before reporting a bug:
* Please have a look in [Known Bugs](https://github.com/dani0198/Loconomics/milestone/74) and the current release folder to see if the bug has already been reported. If so please add any extra, clarifying information you can to the existing issue. 

The first thing we do with a bug report is confirm we can reproduce the bug. Please try to give us enough information so that we can produce the buggy experience ourselves:

Try to include:
* What steps you took just before the bug.
* What you were expecting to happen when the bug happened.
* What actually happened - the buggy behaviour itself.
* What web browser you were using.
* Screen shots.
* UserIDs, BookingIDs, JobTitleIDs involved.
* The /activityName from the URL.

[File a new Github issue](https://github.com/dani0198/Loconomics/issues/new) with two labels:
#### Severity Level Label
![bug](https://cloud.githubusercontent.com/assets/1202838/19402991/2f2ddefe-9219-11e6-86ac-5a05a520e5e0.png)

##### Definitions:
- Bug: S1 (The issue is blocking an impending release.)
- Bug: S2 (The issue causes data loss, crashes or hangs salt processes, makes the system unresponsive, etc.)
- Bug: S3 (The issue reports incorrect functionality, bad functionality, a confusing user experience, etc.)
- Bug: S4 (The issue reports cosmetic items, formatting, spelling, colors, etc.)

#### Feature Area Label
![feature](https://cloud.githubusercontent.com/assets/1202838/19402990/2f27ec6a-9219-11e6-9a1e-2bb962c00c6a.png)

#### Milestone
Place into [Known Bugs](https://github.com/dani0198/Loconomics/milestone/74)

### Filing development issues
[File a new Github issue](https://github.com/dani0198/Loconomics/issues/new) with four labels:

#### Priority Level Label
![p labels](https://cloud.githubusercontent.com/assets/1202838/19402985/2f10bc02-9219-11e6-8b7b-e09ffd633c0a.png)
##### Definitions:
- P1 (The issue will be seen by all users.)
- P2 (The issue will be seen by most users.)
- P3 (The issue will be seen by about half of users.)
- P4 (The issue will not be seen by most users. Usually the issue is a very specific use case or corner case.)

#### Category Label
![category](https://cloud.githubusercontent.com/assets/1202838/19403470/70112afe-921c-11e6-8c01-1c2019871c48.png)

#### Feature Label (matching the area of the app)
![feature](https://cloud.githubusercontent.com/assets/1202838/19402990/2f27ec6a-9219-11e6-9a1e-2bb962c00c6a.png)

#### Readiness Label
![r labels](https://cloud.githubusercontent.com/assets/1202838/19402983/2ee1929c-9219-11e6-8860-cba1e935c955.png)

#### Milestone
@dani0198 will place into Product Roadmap. R1 issues will be place into Releases based on developer feedback.

### Filing marketing issues
[File a new Github issue](https://github.com/dani0198/Loconomics/issues/new) with two labels:

#### Category Label
![marketing label](https://cloud.githubusercontent.com/assets/1202838/19402986/2f12a206-9219-11e6-91ed-e3bba17a1e59.png)

#### Marketing Label
![marketing](https://cloud.githubusercontent.com/assets/1202838/19402984/2f0919fc-9219-11e6-959d-c800044cec3e.png)

#### Milestone
@dani0198 will place into Marketing Roadmap and issues will be place into Releases based on Staff discussion.

### Filing Information 
We store information related to the project but not development or marketing issues as issues in an [Information Repository](https://github.com/dani0198/Loconomics/milestone/34) for future reference.
[File a new Github issue](https://github.com/dani0198/Loconomics/issues/new) with two labels:

#### Category Label
![ir label](https://cloud.githubusercontent.com/assets/1202838/19402987/2f136e34-9219-11e6-8bc6-7aa786799856.png)

#### Information Repository Label
![information](https://cloud.githubusercontent.com/assets/1202838/19402988/2f14ec46-9219-11e6-811a-0434cbc146f0.png)

#### Milestone
Place into the [Information Repository](https://github.com/dani0198/Loconomics/milestone/34) 


