## Database & API changes
We run a SQL Server 2008 R2 database hosted on Microsoft Azure. If you feel you need a copy of the dev database for development on your local machine, please contact @dani0198 or @iagosrl. 

Access is limited to those who can sign a Business Associate Agreement per our HIPAA Policy.

You should keep a copy of the dev database that runs on your local machine. Any changes to the dev database can be requested by placing a .sql file in web/_DBUpdate in your branch and @iagoSRL will review, approve, and upload changes when merging your branch into master.

**Step 1: Is the data you need already in the database?**
- If yes, proceed to Step 2. If not, continue.
- Review database to ensure there aren't duplicates or other ways to get the data you need
- Test fully any changes with latest app code ensuring any changes are accounted for
- Document any changes to the schema (RENAME, ADD/DROP, ALTER, CREATE) with separate .sql files for each table saved in _DBUpdate
  - The naming of ".sql" files is : 'Release-' and release number, dash, a consecutive letter, dash, consecutive number, dash, a short descriptive name of the change. It is **important is to keep the order** in which changes were done. Use letters to group changes that are part of the same consecutive task (like in this case, 1-add new column, 2-insert new data, both with the same letter that is the next one available, e.g. if the latest file is named *Release-7.1 - C-6 drop old invalidatebookingrequest.sql* then your file should be start with "Release-7.1 - D-1".
  - The order is very important to ensure any data changes don't break the *live* database and its data.
  - Avoid renaming or deleting fields without discussing it first with @iagoSRL
  - Be sure to include any table contraints (PK, FK, etc.) in the .sql files
  - If changes affect any *user* tables, it's a very complex process and needs a manually written and well tested SQL script as there can be rare cases that a prior release needs it, mostly when changing how some existing data is stored.
  - Updates to *system* tables: include a _template-INSERT-tableName.sql file in _DBUpdate for any new *system* tables that include content to ensure it gets updated regularly on the live database. Updates to existing *system* tables (contain mostly content), are done automatically using a TestDBSync page.
  - Current *system* tables:
    - accountstatus
    - addresstype
    - alert
    - alerttype
    - backgroundcheck
    - bookingStatus
    - BookingType
    - CalendarAvailabilityType
    - CalendarEventType
    - CalendarRecurrenceFrequencyTypes
    - cancellationpolicy
    - country
    - county
    - ExperienceLevel
    - Gender
    - institution
    - jobTitleLicense
    - language
    - languagelevel
    - licensecertification
    - messagethreadstatus
    - messagetype
    - OwnerStatus
    - positionbackgroundcheck
    - positionpricingtype
    - positionratings
    - positions ---???
    - postalcode
    - PricingGroups
    - pricingtype
    - PricingVariableDefinition
    - ReferralSource
    - serviceattribute ---???
    - serviceattributecategory
    - ServiceAttributeExperienceLevel
    - ServiceAttributeLanguageLevel
    - servicecategory
    - servicecategoryposition
    - servicecategorypositionattribute ---???
    - servicesubcategory
    - stateprovince
    - transporttype
    - verification
    - verificationcategory
    - verificationstatus
    - VOCElement
    - VOCExperienceCategory
    - VOCFlag

**Step 2: Add new data to the REST API**
- Create sample SQL with sample query parameters. 
- Find, copy and rename an example .cs file from web/App_Code/LcRest using the name of the DB table if possible
- Revise code to match the sample SQL. 
- Decide what information shoudl be public or private adhereing to our HIPAA Policy
- Revise any existing functions removing or updating them to match your data.
- Add any new necessary functions (you may find similar examples in other files).
- Determine where it should go in the web/api/v1:
  - /: Information not related to specific users
  - /me: Information about a user requesting information about themselves, mostly private  
  - /user: Information about a user requesting information about another user, mostly public  
- Find, copy and rename an example .cshtml file from the chosen folder.
- Define functions for the API in this file.
- TEST API call (IAGO PLEASE FILL IN INSTRUCTIONS)
- Find, copy and rename an example .js file from app/source/js/models or model.js if there isn't a good example.
- Revise or write code that defines the javascript objects you'll need.
- Determine if you'll need an appmodel file (includes actions for that model). If so: 
  - Find, copy and rename an example .js file from app/source/js/appmodel.
  - Revise or write code that create the actionss you'll need paying special attention to utilities referenced from the /js/utils folder.
  - Add file name to: app/source/js/appmodel/appmodel.js