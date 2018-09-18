# devops folder

## Proposal
To contain scripts and tools aimed to help with the repository management and releasing process.

## Organization
Every file must go under a sub-directory, and that directory should have a "README.md" file or it's name to be self-explanatory.

## About ./azure-deploy.cmd
It contains the script using tools npm, KuduSync, yarn, and settings from the environment variables defined at hosting for the
App Engine instance and variables made available by the Azure deploy system.

This process is working at the Azure hosting, almost for dev and live (production) slots, connected with the branches of the
same name at GitHub.

In order to get executed automatically when a push is detected by Azure, a file named `.deployment` must exist
at the repository root folder (that's why is placed out of this folder). Additionally, the Azure runner that executes the
command defined in that file, does not allow relative paths, so a file named `deploy.cmd` exists at the root, which solely
proposal is to call to this file. Initially that contained all the script, but in order to organize it properly this was
moved to this folder and that one line file was found as required after several trials (maybe that gets fixed in the future
at the Azure Kudu system).

The process is self documented, but in short:
- It prepares variables, folders, check tools versions and installs KuduSync
- It installs Yarn only if not exists already (prevent some conflicts when trying to reinstall/update)
- If package.json changes detected, it builds Webapp (install dependencies and execute a Yarn script; an environment variable
    allows to disable or enable without changes detection)
- KuduSync copies back-end changes (content of /web) to the public directory (some file exclusions defined)
- MSBuild compiles back-end (displaying warnings and errors if any)
