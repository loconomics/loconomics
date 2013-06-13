
EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'DELETE FROM licensecertification 
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[OptionGroup]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('1'
   ,'1'
   ,'1'
   ,'Certified Public Accountant with Attest Experience'
   ,'This licensee completed the experience required to perform the full range of accounting services, including signing attest reports on attest engagements.'
   ,'Department of Consumer Affairs California Board of Accountancy'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=PA&p_qte_pgm_code=0300'
   ,'http://www.dca.ca.gov/cba/licensees.shtml#individuals'
   ,'Certified Public Accountant'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[OptionGroup]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('2'
   ,'1'
   ,'1'
   ,'Certified Public Accountant without Attest Experience'
   ,'This licensee completed the experience required, except attest experience, and therefore is not authorized to sign reports on attest engagements. This licensee can perform all other accounting services and may also participate in attest engagements.'
   ,'Department of Consumer Affairs California Board of Accountancy'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=PA&p_qte_pgm_code=0300'
   ,'http://www.dca.ca.gov/cba/licensees.shtml#individuals'
   ,'Certified Public Accountant'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[OptionGroup]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('3'
   ,'1'
   ,'1'
   ,'Acupuncturist'
   ,''
   ,'Department of Consumer Affairs Acupuncture Board'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=AC&p_qte_pgm_code=6500'
   ,'http://www.acupuncture.ca.gov/licensees/index.shtml'
   ,NULL
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[OptionGroup]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('4'
   ,'1'
   ,'1'
   ,'Architect'
   ,''
   ,'Department of Consumer Affairs California Architects Board'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=GEN&p_qte_pgm_code=0600'
   ,'http://www.cab.ca.gov/candidates/license_requirements.shtml'
   ,NULL
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[OptionGroup]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('5'
   ,'1'
   ,'1'
   ,'Mechanics-Brake Adjuster'
   ,''
   ,'Department of Consumer Affairs Bureau of Automotive Repair'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=MEC&p_qte_pgm_code=1310'
   ,'http://www.bar.ca.gov/02_IndustryActivities/01_GettingLicensed/index.html'
   ,NULL
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[OptionGroup]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('6'
   ,'1'
   ,'1'
   ,'Mechanics-Lamp Adjuster'
   ,''
   ,'Department of Consumer Affairs Bureau of Automotive Repair'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=MEC&p_qte_pgm_code=1310'
   ,'http://www.bar.ca.gov/02_IndustryActivities/01_GettingLicensed/index.html'
   ,NULL
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[OptionGroup]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('7'
   ,'1'
   ,'1'
   ,'Smog Technician - Advanced Emission Specialist'
   ,''
   ,'Department of Consumer Affairs Bureau of Automotive Repair'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=SMC&p_qte_pgm_code=1310'
   ,'http://www.bar.ca.gov/02_IndustryActivities/01_GettingLicensed/index.html'
   ,NULL
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[OptionGroup]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('8'
   ,'1'
   ,'1'
   ,'Smog Check Technician - Basic Area Technician'
   ,''
   ,'Department of Consumer Affairs Bureau of Automotive Repair'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=SMC&p_qte_pgm_code=1310'
   ,'http://www.bar.ca.gov/02_IndustryActivities/01_GettingLicensed/index.html'
   ,NULL
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[OptionGroup]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('9'
   ,'1'
   ,'1'
   ,'Smog Check Technican - Intern Technician'
   ,''
   ,'Department of Consumer Affairs Bureau of Automotive Repair'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=SMC&p_qte_pgm_code=1310'
   ,'http://www.bar.ca.gov/02_IndustryActivities/01_GettingLicensed/index.html'
   ,NULL
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[OptionGroup]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('10'
   ,'1'
   ,'1'
   ,'Cosmetologist'
   ,''
   ,'Department of Consumer Affairs Board of Barbering and Cosmetology'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=IND&p_qte_pgm_code=3300'
   ,'http://www.barbercosmo.ca.gov/licensees/online_prof.shtml'
   ,NULL
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[OptionGroup]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('11'
   ,'1'
   ,'1'
   ,'Esthetician'
   ,''
   ,'Department of Consumer Affairs Board of Barbering and Cosmetology'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=IND&p_qte_pgm_code=3300'
   ,'http://www.barbercosmo.ca.gov/licensees/online_prof.shtml'
   ,NULL
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[OptionGroup]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('12'
   ,'1'
   ,'1'
   ,'Manicurist'
   ,''
   ,'Department of Consumer Affairs Board of Barbering and Cosmetology'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=IND&p_qte_pgm_code=3300'
   ,'http://www.barbercosmo.ca.gov/licensees/online_prof.shtml'
   ,NULL
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[OptionGroup]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('13'
   ,'1'
   ,'1'
   ,'Barber'
   ,''
   ,'Department of Consumer Affairs Board of Barbering and Cosmetology'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=IND&p_qte_pgm_code=3300'
   ,'http://www.barbercosmo.ca.gov/licensees/online_prof.shtml'
   ,NULL
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[OptionGroup]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('14'
   ,'1'
   ,'1'
   ,'Electrologist'
   ,''
   ,'Department of Consumer Affairs Board of Barbering and Cosmetology'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=IND&p_qte_pgm_code=3300'
   ,'http://www.barbercosmo.ca.gov/licensees/online_prof.shtml'
   ,NULL
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[OptionGroup]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('15'
   ,'1'
   ,'1'
   ,'Marriage and Family Therapist'
   ,''
   ,'Department of Consumer Affairs Board of Behavioral Sciences'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=LX&p_qte_pgm_code=1800'
   ,''
   ,NULL
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[OptionGroup]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('16'
   ,'1'
   ,'1'
   ,'Educational Psychologist'
   ,''
   ,'Department of Consumer Affairs Board of Behavioral Sciences'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=LX&p_qte_pgm_code=1800'
   ,''
   ,NULL
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[StateProvinceID]
   ,[CountryID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[OptionGroup]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active])
VALUES
   ('18'
   ,'1'
   ,'1'
   ,'Certified Public Accountant with Attest Experience'
   ,'This licensee completed the experience required to perform the full range of accounting services, including signing attest reports on attest engagements.'
   ,'Department of Consumer Affairs California Board of Accountancy'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=PA&p_qte_pgm_code=0300'
   ,'http://www.dca.ca.gov/cba/licensees.shtml#individuals'
   ,'Certified Public Accountant'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True')
ALTER TABLE licensecertification WITH CHECK CHECK CONSTRAINT all 
 ALTER TABLE licensecertification ENABLE TRIGGER all 
 GO 

EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'