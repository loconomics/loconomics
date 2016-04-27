ALTER TABLE municipality
ADD FOREIGN KEY (CountyID) 
REFERENCES county(CountyID)