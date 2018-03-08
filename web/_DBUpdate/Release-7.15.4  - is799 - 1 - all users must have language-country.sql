update users 
set PreferredLanguageID = 1, PreferredCountryID = 1
where PreferredLanguageID is null or PreferredCountryID is null
