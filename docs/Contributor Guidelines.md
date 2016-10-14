# Contributor Guidelines

## Use of Github

We use Github to track all development issues, marketing tasks, project management, product roadmaps, and a repository for for other related project information.

### Bugs
The first thing we do with a bug report is confirm we can reproduce the bug. Please try to give us enough information so that we can produce the buggy experience ourselves:

Try to include:
* What steps you took just before the bug.
* What you were expecting to happen when the bug happened.
* What actually happened - the buggy behaviour itself.
* What web browser you were using.
* Screen shots.
* UserIDs, BookingIDs, JobTitleIDs involved.
* The /activityName from the URL.

Before reporting an issue:
* Please have a brief look to see if the issue is already listed. If so please add any extra, clarifying information you can to the existing issue.

[File a new Github issue](https://github.com/dani0198/Loconomics/issues/new) with two labels:
Severity Level Label
- Bug: S1 (The issue is blocking an impending release.)
- Bug: S2 (The issue causes data loss, crashes or hangs salt processes, makes the system unresponsive, etc.)
- Bug: S3 (The issue reports incorrect functionality, bad functionality, a confusing user experience, etc.)
- Bug: S4 (The issue reports cosmetic items, formatting, spelling, colors, etc.)
Feature Area Label
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


### Filing issues
- Select which milestone to attach it to:
  - **Information Repository** Meeting Notes, People to connect with, Journalists to contact, Knowledge Base, etc.
  - **Sandbox** All development issues not yet included in an upcoming release. Follow format outlined in milestone.
  - **Marketing** All outstanding marketing items not yet included in specific marketing milestones.
  - **Release X.XX** Issues to be completed and closed for a specific app release. Only @dani0198 or @iagosrl should add or remove issues from these.
- Label appropriately the issue:
  - **Sandbox** 
    - Include: 
    - **Gray label** (Category): 
      - Bug 
      - Content
      - C: New Feature 
      - Enhancement (to an existing feature)
      - Usability (front end changes to make feature more usable)
      - Optimization (of an existing feature)
    - **Blue label** (feature area)
    - **P label** (priority:
      - P1 (The issue will be seen by all users.)
      - P2 (The issue will be seen by most users.)
      - P3 (The issue will be seen by about half of users.)
      - P4 (The issue will not be seen by most users. Usually the issue is a very specific use case or corner case.)
    - **R label** (readiness):
      - R1 (The issue is ready to be put into a release with all supporting documentation completed. 
        - **NEW ISSUE CREATED WITH CLEAN FORMAT & OLD ISSUE CLOSED & REFERENCED**)
      - R2 (The issue has been deemed necessary by users and business team. Supporting documentation is being completed.)
      - R3 (The issue is a well formed idea able to be articulated to users. Should be shared so that they may vote on it.)
      - R4 (The issue is just an idea with no or little supporting documentation.)
    - **S label** (severity-ONLY FOR BUGS):
      - S1 (The issue is blocking an impending release.)
      - S2 (The issue causes data loss, crashes or hangs salt processes, makes the system unresponsive, etc.)
      - S3 (The issue reports incorrect functionality, bad functionality, a confusing user experience, etc.)
      - S4 (The issue reports cosmetic items, formatting, spelling, colors, etc.)

 Bug: S1
 Edit  Delete 5 open issues Bug: S2
 Edit  Delete 2 open issues Bug: S3
 Edit  Delete 1 open issue Bug: S4
 Edit  Delete 3 open issues C: Content
 Edit  Delete 1 open issue C: Documentation
 Edit  Delete 52 open issues C: Enhancement
 Edit  Delete 1 open issue C: HIPAA
 Edit  Delete 16 open issues C: Marketing
 Edit  Delete 4 open issues C: New Benefit
 Edit  Delete 45 open issues C: New Feature
 Edit  Delete 21 open issues C: Optimization
 Edit  Delete 10 open issues C: Payment Processing
 Edit  Delete 24 open issues C: Usability
 Edit  Delete 1 open issue C: User Story
 Edit  Delete 3 open issues Database Changes
 Edit  Delete 0 open issues Discarded
 Edit  Delete 0 open issues Duplicate
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


## CSS Naming Conventions

We use Bootstrap as CSS framework and it has it's own naming rules, for anything related to Boostrap (like adding changes, modifiers on top of Bootstrap classes) or files under /utils folder, we follow the simple Boostrap naming.

But for *components* styles, the classes at /components folder that start with uppercase letter, we use [SUIT naming convention](https://github.com/suitcss/suit/blob/master/doc/naming-conventions.md)

**Disclaimer**: this rules were not strictly followed in the past or there is code created before we set this rules, then current source code needs some clean-up/refator. New code must follow the rules.
