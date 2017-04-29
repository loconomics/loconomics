# Issue Lifecycle

Action | Corresponding Board
--- | ---
Issue created by anyone | New Issue
Josh prioritizes based on business goals | Phase {X}
Josh/developers refine stories/epics, developers assign story points 
Josh/Matt/Iago agree on top priorities; must be completable and estimated | Top Priorities
(Optional design work, when finished unassign from designer and return to Top Priorities) | Top Priorities
Developer starts work | In Progress 
Developer finishes work, requests review/testing and assigns issue to those who need to test it, applies _Ready for Testing_ label | Review/QA
Issue tested and merged into master branch, closed | Release Milestone {X}

## Story Points

Story points are assigned simultaneously by developers. Developers must agree on estimate for each issue. They do not correspond to hours, rather, complexity.

- *1*: copy fix, typo
- *2*: simple task, but includes logic or testing
- *3*: substantial task; probably 1 day, maybe 2
- *5*: complex tasks, ~3-5 days

## Rules of Thumb for Epics and Stories

We should be able to complete _epics_ in 1-2 weeks.

Related epics can be grouped and sequenced to complete a larger feature set (phases/themes/clusters).
