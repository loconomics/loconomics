ALTER TABLE postalcode
ADD FOREIGN KEY (MunicipalityID) 
REFERENCES municipality(MunicipalityID)

ALTER TABLE postalcode
ADD FOREIGN KEY (CountyID) 
REFERENCES county(CountyID)