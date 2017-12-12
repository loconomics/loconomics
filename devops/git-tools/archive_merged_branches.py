"""
Archive branches that are merged into master (or another branch specified as
parameter -single value-).
This is done by tagging them as archive/<branchname> and removing them both locally and
remotely. Before each operation, the user is asked for confirmation.

Author: http://ctenbrinke.net/author/chiel/
Source: http://ctenbrinke.net/2016/06/07/archiving-branches-with-git/

@iagosrl 2017-08-01 Added command line parameter to specify the branch of
reference (master by default)

NOTE: It asks for confirmation of every found branch.

Set-up this at git to be used as 'git archive-branches' by adding it to the '.gitconfig' file under alias section like:
[alias]
    archive-branches = !python ~/loconomics/devops/git-tools/archive_merged_branches.py

Usage
# archive branches merged into master
> git archive-branches
# archive branches merged into epic-branch
> git archive-branches epic-branch

"""
# This dependency can be found on github: https://github.com/Chiel92/python-shellout
import sys
from pyshellout import get, out, confirm

MASTER = 'master'
ARGS_COUNT = len(sys.argv)
REFERENCE_BRANCH = MASTER if ARGS_COUNT <= 1 else sys.argv[1]

# Tag merged branches
merged_branches = [line.strip() for line in
                   get(r'git branch --merged ' + REFERENCE_BRANCH).n]
merged_branches = [branch for branch in merged_branches
                   if branch != '' and not '*' in branch and not branch == MASTER and not branch == REFERENCE_BRANCH]
archived_branches = []
archived_branches_all = []
for branch in merged_branches:
    if confirm('Archive branch {}?', branch):
        out('git tag archive/{} {}', branch, branch)
        archived_branches.append(branch)

if not archived_branches:
    exit('No branches archived. Bye.')

print('Next tasks are: push tags to remote, delete remote and local branches')
do_not_ask = not confirm('Request confirmation for every step?')

# Push archive tags to remote
print()
print('Created archive tags:')
for branch in archived_branches:
    print('    ' + branch)
if do_not_ask or confirm('Push archive tags to remote?'):
    for branch in archived_branches:
        out('git push origin archive/{}', branch)


# Delete remote branches
print()
print('Corresponding remote branches:')
for branch in archived_branches:
    print('    origin/' + branch)
if do_not_ask or confirm('Delete remote branches?'):
    for branch in archived_branches:
        out('git push origin :{}', branch)


# Delete local branches
print()
print('Corresponding local branches:')
for branch in archived_branches:
    print('    ' + branch)
if do_not_ask or confirm('Delete local branches?'):
    for branch in archived_branches:
        out('git branch -d {}', branch)
