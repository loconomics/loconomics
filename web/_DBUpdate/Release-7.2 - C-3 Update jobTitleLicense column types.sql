insert statement for new postal codes, new countries?






ALTER TABLE jobTitleLicense DROP CONSTRAINT PK__jobTitle__5E077F7A2B203F5D


ALTER TABLE jobTitleLicense ALTER COLUMN LicenseCertificationID int
ALTER TABLE jobTitleLicense ALTER COLUMN StateProvinceID int
ALTER TABLE jobTitleLicense ALTER COLUMN CountryID int

ALTER TABLE jobTitleLicense ALTER COLUMN LicenseCertificationID int NOT NULL
ALTER TABLE jobTitleLicense ALTER COLUMN StateProvinceID int NOT NULL
ALTER TABLE jobTitleLicense ALTER COLUMN CountryID int NOT NULL

ALTER TABLE jobTitleLicense ADD PRIMARY KEY (PositionID, LicenseCertificationID, StateProvinceID, CountryID, MunicipalityID, CountyID)







