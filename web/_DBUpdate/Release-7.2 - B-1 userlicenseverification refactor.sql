BEGIN TRANSACTION

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
)


ALTER TABLE userlicenseverificationCOPY
	ADD FOREIGN KEY (ProviderUserID) 
	REFERENCES users (UserID)


	
ALTER TABLE userlicenseverification 
	ADD SubmittedBy varchar(25)
	

ALTER TABLE userlicenseverification 
	ADD submittedImageLocalURL varchar(255)
	


INSERT INTO userlicenseverificationCOPY 
(
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
	LastVerifiedDate)
	SELECT
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
	LastVerifiedDate
	FROM userlicenseverification
	
DROP TABLE userlicenseverification

exec sp_rename @objname = 'userlicenseverificationCOPY', @newname = 'userlicenseverification'


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
Actions


ALTER TABLE 
    licensecertification 
ADD LanguageID int DEFAULT 1 NOT NULL


COMMIT TRANSACTION