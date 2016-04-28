BEGIN TRANSACTION

INSERT INTO stateprovince (StateProvinceID, StateProvinceName, StateProvinceCode, CountryID, RegionCode, PostalCodePrefix) VALUES (0, 'Unassigned', '', 1, '', '')
INSERT INTO stateprovince (StateProvinceID, StateProvinceName, StateProvinceCode, CountryID, RegionCode, PostalCodePrefix) VALUES (-1, 'All US States', '', 1, '', '')

INSERT INTO county (CountyID, CountyName, FIPSCode, StateProvinceID, CreatedDate, UpdatedDate, ModifiedBy, Active) VALUES (-1, 'All US counties', null, -1, '2016-04-20 00:00:00.0', '2016-04-20 00:00:00.0', 'jd', 1)

INSERT INTO county (CountyID, CountyName, FIPSCode, StateProvinceID, CreatedDate, UpdatedDate, ModifiedBy, Active) VALUES (0, 'Unassigned', null, 0, '4/21/2016', '4/21/2016', 'jd', 1)

COMMIT TRANSACTION