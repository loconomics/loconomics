Database logic around the table UserProfilePositions and the StatusID field:
----------------------------------------------------------------------------

##Key Points:

- Status manages public, private and internal visibility of the user-position relationship.

- StatusID <= 0 means internal visibility only, no user can see that record (is Not showed in the provider dashboard)

- StatusID = 1 means public visibility, every one can see that in the site (provider at dashboard and any user at search page or public profile).

- StatusID > 1 means private visibility, only the owner user (the provider in the UserID field) can see that (is displayed at the provider dashboard, but Not in their public profile).


##Possible values of StatusID** (currently being used):

- 0: deleted by the user. If the user try to add again the position to its profile, the existing record will change its StatusID from 0 to 2, and maybe updated automatically to 1 if it pass all the required alerts.

- 1: public profile, activated by the system automatically from 2 when passed all required alerts or by a user request from 3 if it pass all required alerts.

- 2: private profile, automatic activation. Default value when a position is created. Its showed in provider dashboard as 'Off' and gets activated automatically ('On', StatusID:1) when user passes all required alerts.

- 3: private profile, manual activation. Profile was activated some time ago and user decided to manually 'Off' the position. Its showed in provider dashboard as 'Off' and user can request set it as 'On' (StatusID:1), but only if THE system allow it checking that all required alerts are passed.


## The [Active] field

Since we have StatusID, What does Active field on this table?
Its left only to match the common design through database, and give us the special utility to disable 'at all' a provider position if we consider that must be done (maybe because user did something out of the rules?). There is no way for the provider to set the field to 'true' (really value: 1), if position is deleted and then re-added, because the record was not really removed else changed StatusID to 0, system knows it has Active:0 and doesn't allow enable/add the position to the profile.

## Related SQL code:

- InsertUserProfilePositions [stored procedure]
- TestProfileActivation [stored procedure]
- LcData.UserInfo.GetUserPos(..) [C# static method]
- /en-US/$Dashboard/$ReactivatePosition.cshtml [C# Razor page]
- /en-US/$Dashboard/$DeactivatePosition.cshtml [C# Razor page]
- /en-US/$Dashboard/$DeletePosition.cshtml [C# Razor page]
