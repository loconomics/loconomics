BEGIN TRANSACTION

ALTER TABLE county DROP CONSTRAINT PK__county__9122A97109FE775D
ALTER TABLE county ADD PRIMARY KEY (CountyID)

CREATE TABLE municipality
(MunicipalityID int NOT NULL,
CountyID int NOT NULL,
MunicipalityName varchar(100) NOT NULL,
CreatedDate datetime NOT NULL,
UpdatedDate datetime NOT NULL,
ModifiedBy varchar(25) NOT NULL,
PRIMARY KEY (MunicipalityID))

INSERT INTO municipality (MunicipalityID, CountyID, MunicipalityName, CreatedDate, UpdatedDate, ModifiedBy) VALUES (0, 0, 'Unassigned', '4/21/2016', '4/21/2016', 'jd')

ALTER TABLE municipality
ADD FOREIGN KEY (CountyID) 
REFERENCES county(CountyID)

ALTER TABLE postalcode ADD MunicipalityID int DEFAULT 0 NOT NULL

ALTER TABLE postalcode ADD CountyID int DEFAULT 0 NOT NULL

COMMIT TRANSACTION