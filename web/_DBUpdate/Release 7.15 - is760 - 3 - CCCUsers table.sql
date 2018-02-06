/* Create CCCUser table to store information about CCC Users. UserType will default to 'Student'. */
CREATE TABLE dbo.CCCUsers
(UserID int,
InstitutionID int,
FieldOfStudyID int,
PlanExpirationDate datetime,
UserType varchar(25),
PRIMARY KEY (UserID),
FOREIGN KEY (UserID) REFERENCES Users(UserID),
FOREIGN KEY (InstitutionID) REFERENCES institution(InstitutionID),
FOREIGN KEY (FieldOfStudyID) REFERENCES FieldOfStudy(FieldOfStudyID)
)
