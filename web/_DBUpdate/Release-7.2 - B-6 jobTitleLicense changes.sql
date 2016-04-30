ALTER TABLE jobTitleLicense DROP CONSTRAINT PK__jobTitle__5E077F7A5FC911C6

ALTER TABLE jobTitleLicense ALTER COLUMN LicenseCertificationID int NOT NULL

ALTER TABLE jobTitleLicense ALTER COLUMN CountryID int NOT NULL

ALTER TABLE jobTitleLicense ALTER COLUMN StateProvinceID int NOT NULL

ALTER TABLE jobTitleLicense ADD PRIMARY KEY (PositionID, LicenseCertificationID, StateProvinceID, CountryID, MunicipalityID, CountyID)
                
UPDATE jobTitleLicense SET StateProvinceID = 0 WHERE StateProvinceID = -1

INSERT INTO jobTitleLicense (PositionID, LicenseCertificationID, StateProvinceID, CountryID, Required, CreatedDate, UpdatedDate, ModifiedBy, Active, MunicipalityID, CountyID) VALUES (-1, 0, 0, 1, 0, '2015-11-08 00:00:00.0', '2015-11-08 00:00:00.0', 'jd', 1, 0, 0)

ALTER TABLE jobTitleLicense ADD OptionGroup varchar(100)