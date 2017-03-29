BEGIN TRANSACTION

ALTER TABLE jobTitleLicense DROP CONSTRAINT PK__position__C72C1489178D7CA5

ALTER TABLE jobTitleLicense ADD MunicipalityID int DEFAULT 0 NOT NULL

ALTER TABLE jobTitleLicense ADD CountyID int DEFAULT 0 NOT NULL
	
ALTER TABLE jobTitleLicense ADD CONSTRAINT PK__jobTitle__5E077F7A5FC911C6 PRIMARY KEY (PositionID, LicenseCertificationID, StateProvinceID, CountryID, MunicipalityID, CountyID)

COMMIT TRANSACTION