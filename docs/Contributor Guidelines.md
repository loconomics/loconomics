# Contributor Guidelines

## Communications
We prefer to keep all communications in each related Github issue and converse with each other using our @username so that conversations are well documented and stay within the project even if it requires a new issue for it. 

## CSS Naming Conventions

We use Bootstrap as CSS framework and it has it's own naming rules, for anything related to Boostrap (like adding changes, modifiers on top of Bootstrap classes) or files under /utils folder, we follow the simple Boostrap naming.

But for *components* styles, the classes at /components folder that start with uppercase letter, we use [SUIT naming convention](https://github.com/suitcss/suit/blob/master/doc/naming-conventions.md)

**Disclaimer**: this rules were not strictly followed in the past or there is code created before we set this rules, then current source code needs some clean-up/refator. New code must follow the rules.

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
- Bug: S1 (The issue is blocking an impending release.)
- Bug: S2 (The issue causes data loss, crashes or hangs salt processes, makes the system unresponsive, etc.)
- Bug: S3 (The issue reports incorrect functionality, bad functionality, a confusing user experience, etc.)
- Bug: S4 (The issue reports cosmetic items, formatting, spelling, colors, etc.)

#### Feature Area Label
- F: Account
- F: Admin Tools
- F: Calendar
- F: Client manager
- F: Cooperative
- F: General Site
- F: Marketplace Profile
- F: Marketplace
- F: Messenger
- F: Onboarding
- F: Performance
- F: Reviews
- F: Scheduler
- F: Voice of Customer Program

#### Milestone
Place into [Known Bugs](https://github.com/dani0198/Loconomics/milestone/74)

### Filing development issues
[File a new Github issue](https://github.com/dani0198/Loconomics/issues/new) with four labels:

#### Priority Level Label
- P1 (The issue will be seen by all users.)
- P2 (The issue will be seen by most users.)
- P3 (The issue will be seen by about half of users.)
- P4 (The issue will not be seen by most users. Usually the issue is a very specific use case or corner case.)

#### Category Label
- C: Content
- C: Enhancement (to an existing feature)
- C: HIPAA
- C: New Benefit (Feature Label is Cooperative)
- C: New Feature (no Feature Label in this case)
- C: Optimization (of an existing feature)
- C: Payment Processing
- C: Usability (front end changes to make feature more usable, includes design)

#### Feature Label
Matches the area of the app
- F: Account
- F: Admin Tools
- F: Calendar
- F: Client manager
- F: Cooperative
- F: General Site
- F: Marketplace Profile
- F: Marketplace
- F: Messenger
- F: Onboarding
- F: Performance
- F: Reviews
- F: Scheduler
- F: Voice of Customer Program

#### Readiness Label
- R1 (The issue is ready to be put into a release with all supporting documentation completed. 
- R2 (Awaiting Architecture Sprint)
- R3 (Awaiting Design Sprint)
- R4 (User Story)

#### Milestone
@dani0198 will place into Product Roadmap. R1 issues will be place into Releases based on developer feedback.

### Filing marketing issues
[File a new Github issue](https://github.com/dani0198/Loconomics/issues/new) with two labels:

#### Category Label
- C: Marketing

#### Marketing Label
- M: Insights - Analytics
- M: Reach - Collateral
- M: Reach - Events
- M: Reach - Lead Generation
- M: Reach - Mktg Communications
- M: Reach - Outreach
- M: Reach - Partner
- M: Reach - PR
- M: Reach - SEO
- M: Relationship - Content
- M: Relationship - Engagement
- M: Relationship - Social Media

#### Milestone
@dani0198 will place into Marketing Roadmap and issues will be place into Releases based on Staff discussion.

### Filing Information 
We store information related to the project but not development or marketing issues as issues in an [Information Repository](https://github.com/dani0198/Loconomics/milestone/34) for future reference.
[File a new Github issue](https://github.com/dani0198/Loconomics/issues/new) with two labels:

#### Category Label
- C: Information Repository

#### Information Repository Label
- I: Journalist
- I: Knowledge Base
- I: Meeting Notes
- I: Partnership Opportunity
- I: Person to Connect With
- I: Person We've Met
- I: Potential Tools
- I: Programmer

#### Milestone
Place into the [Information Repository](https://github.com/dani0198/Loconomics/milestone/34) 


