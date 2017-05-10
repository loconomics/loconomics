-- all attributes for current lang-country are optional now (this makes alertID:8 implicitely optional too, even if marked as required) per #392
UPDATE serviceattributecategory
SET RequiredInput = 0
WHERE LanguageID = 1 AND CountryID = 1
