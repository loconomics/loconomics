CREATE TABLE userlicenseverificationCOPY (
	userLicenseVerificationID int identity (1,1) NOT NULL,
	ProviderUserID int NOT NULL,
	PositionID int NOT NULL,
	LicenseCertificationID int NOT NULL,
    VerificationStatusID int NOT NULL,
	LicenseCertificationURL varchar(2073),
	LastName varchar(100) NOT NULL,
	FirstName varchar(100) NOT NULL,
	MiddleInitial varchar(1),
	SecondLastName varchar(100),
	BusinessName varchar(200),
	LicenseCertificationNumber varchar(100),
	City varchar(100) NOT NULL,
	CountyID int NOT NULL,
	StateProvinceID int NOT NULL,
	CountryID int NOT NULL,
	CreatedDate datetime NOT NULL,
	ModifiedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	LicenseStatus varchar(50),
	ExpirationDate datetime,
	IssueDate datetime,
	Actions varchar(200),
	Comments varchar(500),
	VerifiedBy varchar(25),
	LastVerifiedDate datetime,
	SubmittedBy varchar(25),
	SubmittedImageLocalURL varchar(255),
	PRIMARY KEY (userLicenseVerificationID)
);

ALTER TABLE userlicenseverificationCOPY
	ADD FOREIGN KEY (LicenseCertificationID) 
	REFERENCES licensecertification (LicenseCertificationID);

ALTER TABLE userlicenseverificationCOPY
	ADD FOREIGN KEY (ProviderUserID) 
	REFERENCES users (UserID);
	
ALTER TABLE userlicenseverification 
	ADD SubmittedBy varchar(25),
	ADD submittedImageLocalURL varchar(255);

SET IDENTITY_INSERT userlicenseverificationCOPY ON;
INSERT INTO userlicenseverificationCOPY 
(userLicenseVerificationID,
	ProviderUserID,
	PositionID,
	LicenseCertificationID,
	LicenseCertificationURL,
	LastName,
	FirstName,
	MiddleInitial,
	SecondLastName,
	BusinessName,
	LicenseCertificationNumber,
	City,
	CountyID,
	StateProvinceID,
	CountryID,
	CreatedDate,
	ModifiedDate,
	ModifiedBy,
	VerificationStatusID,
	LicenseStatus,
	ExpirationDate,
	IssueDate,
	Actions,
	Comments,
	VerifiedBy,
	LastVerifiedDate,
	SubmittedBy,
	SubmittedImageLocalURL)
	SELECT 
	userLicenseVerificationID,
	ProviderUserID,
	PositionID,
	LicenseCertificationID,
	LicenseCertificationURL,
	LastName,
	FirstName,
	MiddleInitial,
	SecondLastName,
	BusinessName,
	LicenseCertificationNumber,
	City,
	CountyID,
	StateProvinceID,
	CountryID,
	CreatedDate,
	ModifiedDate,
	ModifiedBy,
	VerificationStatusID,
	LicenseStatus,
	ExpirationDate,
	IssueDate,
	Actions,
	Comments,
	VerifiedBy,
	LastVerifiedDate,
	SubmittedBy,
	SubmittedImageLocalURL	
	FROM userlicenseverification;
SET IDENTITY_INSERT userlicenseverificationCOPY OFF;

DROP TABLE userlicenseverification

exec sp_rename @objname = 'userlicenseverificationCOPY', @newname = 'userlicenseverification'

ALTER TABLE userlicenseverification DROP CONSTRAINT PK__userlice__106310261AE9D794;

ALTER TABLE 
userlicenseverification 
DROP COLUMN 
City,
CountyID,
StateProvinceID,
CountryID,
ModifiedDate,
ModifiedBy,
LicenseStatus,
Actions;


ALTER TABLE UserLicenseCertifications ADD PRIMARY KEY (userLicenseCertificationID)

ALTER TABLE 
    licensecertification 
ADD LanguageID int DEFAULT 1 NOT NULL;

ALTER TABLE 
    licensecertification 
DROP CONSTRAINT PK__licensec__CE7A16FC19FFD4FC;


ALTER TABLE jobTitleLicense DROP CONSTRAINT PK__position__C72C1489178D7CA5;

ALTER TABLE jobTitleLicense ADD MunicipalityID int DEFAULT 0 NOT NULL;
ALTER TABLE jobTitleLicense ADD CountyID int DEFAULT 0 NOT NULL;
	
ALTER TABLE jobTitleLicense ADD PRIMARY KEY (PositionID, LicenseCertificationID, StateProvinceID, CountryID, MunicipalityID, CountyID);

exec sp_rename @objname = 'userlicenseverification', @newname = 'UserLicenseCertifications';

 exec sp_rename @objname = 'UserLicenseCertifications.userLicenseVerificationID', @newname = 'userLicenseCertificationID', @objtype = 'COLUMN'

ALTER TABLE county DROP CONSTRAINT PK__county__9122A97109FE775D;

ALTER TABLE county ADD PRIMARY KEY (CountyID, StateProvinceID);

INSERT INTO county (CountyID, CountyName, FIPSCode, StateProvinceID, CreatedDate, UpdatedDate, ModifiedBy, Active) VALUES (-1, 'All US counties', null, -1, '2016-04-20 00:00:00.0', '2016-04-20 00:00:00.0', 'jd', 1);
INSERT INTO county (CountyID, CountyName, FIPSCode, StateProvinceID, CreatedDate, UpdatedDate, ModifiedBy, Active) VALUES (-1, 'All California counties', null, 1, '2016-04-20 00:00:00.0', '2016-04-20 00:00:00.0', 'jd', 1);

INSERT INTO stateprovince (StateProvinceID, StateProvinceName, StateProvinceCode, CountryID, RegionCode, PostalCodePrefix) VALUES (0, 'Unassigned', '', 1, '', '');

INSERT INTO county (CountyID, CountyName, FIPSCode, StateProvinceID, CreatedDate, UpdatedDate, ModifiedBy, Active) VALUES (0, 'Unassigned', null, 0, '4/21/2016', '4/21/2016', 'jd', 1);

CREATE TABLE municipality
(MunicipalityID int NOT NULL,
CountyID int NOT NULL,
MunicipalityName varchar(100) NOT NULL,
CreatedDate datetime NOT NULL,
UpdatedDate datetime NOT NULL,
ModifiedBy varchar(25) NOT NULL,
PRIMARY KEY (MunicipalityID));

INSERT INTO municipality (MunicipalityID, CountyID, MunicipalityName, CreatedDate, UpdatedDate, ModifiedBy) VALUES (0, 0, 'Unassigned', '4/21/2016', '4/21/2016', 'jd');

ALTER TABLE municipality
ADD FOREIGN KEY (CountyID) 
REFERENCES county(CountyID);

ALTER TABLE postalcode ADD MunicipalityID int DEFAULT 0 NOT NULL;
ALTER TABLE postalcode ADD CountyID int DEFAULT 0 NOT NULL;

ALTER TABLE UserLicenseCertifications DROP CONSTRAINT FK__userlicen__Licen__1DC6443F;

ALTER TABLE licensecertification DROP CONSTRAINT PK__licensec__CE7A16FC19FFD4FC;

ALTER TABLE licensecertification ADD PRIMARY KEY (LicenseCertificationID, LanguageID);

ALTER TABLE jobTitleLicense DROP CONSTRAINT PK__jobTitle__5E077F7A396E5EB4

ALTER TABLE jobTitleLicense ALTER COLUMN LicenseCertificationID int NOT NULL

ALTER TABLE jobTitleLicense ALTER COLUMN CountryID int NOT NULL;

ALTER TABLE jobTitleLicense ALTER COLUMN StateProvinceID int NOT NULL;

ALTER TABLE jobTitleLicense ADD PRIMARY KEY (PositionID, LicenseCertificationID, StateProvinceID, CountryID, MunicipalityID, CountyID)
                
UPDATE jobTitleLicense SET StateProvinceID = 0 WHERE StateProvinceID = -1;

INSERT INTO jobTitleLicense (PositionID, LicenseCertificationID, StateProvinceID, CountryID, Required, CreatedDate, UpdatedDate, ModifiedBy, Active, MunicipalityID, CountyID) VALUES (-1, 0, 0, 1, 0, '2015-11-08 00:00:00.0', '2015-11-08 00:00:00.0', 'jd', 1, 0, 0);

UPDATE licensecertification SET LicenseCertificationType = 'Legally required license/certification', LicenseCertificationTypeDescription = 'Our records indicate that state or federal law requires you to have a license for this profession.' WHERE LicenseCertificationID = -1 AND LanguageID = 1;
UPDATE licensecertification SET LicenseCertificationType = 'Supplemental professional certification', LicenseCertificationTypeDescription = 'Do you have a certification you''d like clients to know about? Upload a photo of it, and we''ll do our best to verify it, although we can''t guarantee it.' WHERE LicenseCertificationID = 0 AND LanguageID = 1;

ALTER TABLE licensecertification DROP CONSTRAINT FK__licensece__State__1BE81D6E;             
ALTER TABLE licensecertification DROP COLUMN StateProvinceID;
ALTER TABLE licensecertification DROP COLUMN CountryID;
ALTER TABLE licensecertification DROP COLUMN OptionGroup;  

ALTER TABLE jobTitleLicense ADD OptionGroup varchar(100);    

UPDATE verificationstatus SET VerificationStatusName = 'Contact us', VerificationStatusDisplayDescription = 'We need more infomation to verify. Please contact us.', UpdatedDate = '4/23/2016' WHERE VerificationStatusID = 3 AND LanguageID = 1 AND CountryID = 1;
INSERT INTO verificationstatus (VerificationStatusID, LanguageID, CountryID, VerificationStatusName, VerificationStatusDisplayDescription, CreatedDate, UpdatedDate, ModifiedBy, Active) VALUES (5, 1, 1, 'We do not verify', 'We do not verify this information.', '4/23/2016', '4/23/2016', 'jd', 1);
INSERT INTO verificationstatus (VerificationStatusID, LanguageID, CountryID, VerificationStatusName, VerificationStatusDisplayDescription, CreatedDate, UpdatedDate, ModifiedBy, Active) VALUES (6, 1, 1, 'Expires soon', 'This verification expires soon.', '4/23/2016', '4/23/2016', 'jd', 1);







