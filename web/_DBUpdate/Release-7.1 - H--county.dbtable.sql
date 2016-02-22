
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM county 
INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('1'
           ,'Alameda'
           ,'1'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('2'
           ,'Alpine'
           ,'3'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('3'
           ,'Amador'
           ,'5'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('4'
           ,'Butte'
           ,'7'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('5'
           ,'Calaveras'
           ,'9'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('6'
           ,'Colusa'
           ,'11'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('7'
           ,'Contra Costa'
           ,'13'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('8'
           ,'Del Norte'
           ,'15'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('9'
           ,'El Dorado'
           ,'17'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('10'
           ,'Fresno'
           ,'19'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('11'
           ,'Glenn'
           ,'21'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('12'
           ,'Humboldt'
           ,'23'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('13'
           ,'Imperial'
           ,'25'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('14'
           ,'Inyo'
           ,'27'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('15'
           ,'Kern'
           ,'29'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('16'
           ,'Kings'
           ,'31'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('17'
           ,'Lake'
           ,'33'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('18'
           ,'Lassen'
           ,'35'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('19'
           ,'Los Angeles'
           ,'37'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('20'
           ,'Madera'
           ,'39'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('21'
           ,'Marin'
           ,'41'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('22'
           ,'Mariposa'
           ,'43'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('23'
           ,'Mendocino'
           ,'45'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('24'
           ,'Merced'
           ,'47'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('25'
           ,'Modoc'
           ,'49'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('26'
           ,'Mono'
           ,'51'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('27'
           ,'Monterey'
           ,'53'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('28'
           ,'Napa'
           ,'55'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('29'
           ,'Nevada'
           ,'57'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('30'
           ,'Orange'
           ,'59'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('31'
           ,'Placer'
           ,'61'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('32'
           ,'Plumas'
           ,'63'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('33'
           ,'Riverside'
           ,'65'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('34'
           ,'Sacramento'
           ,'67'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('35'
           ,'San Benito'
           ,'69'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('36'
           ,'San Bernardino'
           ,'71'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('37'
           ,'San Diego'
           ,'73'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('38'
           ,'San Francisco'
           ,'75'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('39'
           ,'San Joaquin'
           ,'77'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('40'
           ,'San Luis Obispo'
           ,'79'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('41'
           ,'San Mateo'
           ,'81'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('42'
           ,'Santa Barbara'
           ,'83'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('43'
           ,'Santa Clara'
           ,'85'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('44'
           ,'Santa Cruz'
           ,'87'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('45'
           ,'Shasta'
           ,'89'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('46'
           ,'Sierra'
           ,'91'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('47'
           ,'Siskiyou'
           ,'93'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('48'
           ,'Solano'
           ,'95'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('49'
           ,'Sonoma'
           ,'97'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('50'
           ,'Stanislaus'
           ,'99'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('51'
           ,'Sutter'
           ,'101'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('52'
           ,'Tehama'
           ,'103'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('53'
           ,'Trinity'
           ,'105'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('54'
           ,'Tulare'
           ,'107'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('55'
           ,'Tuolumne'
           ,'109'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('56'
           ,'Ventura'
           ,'111'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('57'
           ,'Yolo'
           ,'113'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')

INSERT INTO [county]
           ([CountyID]
           ,[CountyName]
           ,[FIPSCode]
           ,[StateProvinceID]
           ,[CreatedDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active])
     VALUES
           ('58'
           ,'Yuba'
           ,'115'
           ,'1'
           ,'4/27/2012 12:00:00 AM'
           ,'4/27/2012 12:00:00 AM'
           ,'jd'
           ,'True')


/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
