
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM licensecertification 
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('-1'
   ,'Legally required license/certification'
   ,'Our records indicate that state or federal law requires you to have a license for this profession.'
   ,''
   ,''
   ,''
   ,'11/8/2015 12:00:00 AM'
   ,'11/8/2015 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('0'
   ,'Supplemental professional certification'
   ,'Do you have a certification you''d like clients to know about? Upload a photo of it, and we''ll do our best to verify it, although we can''t guarantee it.'
   ,''
   ,''
   ,''
   ,'11/8/2015 12:00:00 AM'
   ,'11/8/2015 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('1'
   ,'Certified Public Accountant with Attest Experience'
   ,'This licensee completed the experience required to perform the full range of accounting services, including signing attest reports on attest engagements.'
   ,'Department of Consumer Affairs California Board of Accountancy'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=PA&p_qte_pgm_code=0300'
   ,'http://www.dca.ca.gov/cba/licensees.shtml#individuals'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('2'
   ,'Certified Public Accountant without Attest Experience'
   ,'This licensee completed the experience required, except attest experience, and therefore is not authorized to sign reports on attest engagements. This licensee can perform all other accounting services and may also participate in attest engagements.'
   ,'Department of Consumer Affairs California Board of Accountancy'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=PA&p_qte_pgm_code=0300'
   ,'http://www.dca.ca.gov/cba/licensees.shtml#individuals'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('3'
   ,'Acupuncturist'
   ,''
   ,'Department of Consumer Affairs Acupuncture Board'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=AC&p_qte_pgm_code=6500'
   ,'http://www.acupuncture.ca.gov/licensees/index.shtml'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('4'
   ,'Architect'
   ,''
   ,'Department of Consumer Affairs California Architects Board'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=GEN&p_qte_pgm_code=0600'
   ,'http://www.cab.ca.gov/candidates/license_requirements.shtml'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('5'
   ,'Mechanics-Brake Adjuster'
   ,''
   ,'Department of Consumer Affairs Bureau of Automotive Repair'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=MEC&p_qte_pgm_code=1310'
   ,'http://www.bar.ca.gov/02_IndustryActivities/01_GettingLicensed/index.html'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('6'
   ,'Mechanics-Lamp Adjuster'
   ,''
   ,'Department of Consumer Affairs Bureau of Automotive Repair'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=MEC&p_qte_pgm_code=1310'
   ,'http://www.bar.ca.gov/02_IndustryActivities/01_GettingLicensed/index.html'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('7'
   ,'Smog Technician - Advanced Emission Specialist'
   ,''
   ,'Department of Consumer Affairs Bureau of Automotive Repair'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=SMC&p_qte_pgm_code=1310'
   ,'http://www.bar.ca.gov/02_IndustryActivities/01_GettingLicensed/index.html'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('8'
   ,'Smog Check Technician - Basic Area Technician'
   ,''
   ,'Department of Consumer Affairs Bureau of Automotive Repair'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=SMC&p_qte_pgm_code=1310'
   ,'http://www.bar.ca.gov/02_IndustryActivities/01_GettingLicensed/index.html'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('9'
   ,'Smog Check Technican - Intern Technician'
   ,''
   ,'Department of Consumer Affairs Bureau of Automotive Repair'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=SMC&p_qte_pgm_code=1310'
   ,'http://www.bar.ca.gov/02_IndustryActivities/01_GettingLicensed/index.html'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('10'
   ,'Cosmetologist'
   ,''
   ,'Department of Consumer Affairs Board of Barbering and Cosmetology'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=IND&p_qte_pgm_code=3300'
   ,'http://www.barbercosmo.ca.gov/licensees/online_prof.shtml'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('11'
   ,'Esthetician'
   ,''
   ,'Department of Consumer Affairs Board of Barbering and Cosmetology'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=IND&p_qte_pgm_code=3300'
   ,'http://www.barbercosmo.ca.gov/licensees/online_prof.shtml'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('12'
   ,'Manicurist'
   ,''
   ,'Department of Consumer Affairs Board of Barbering and Cosmetology'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=IND&p_qte_pgm_code=3300'
   ,'http://www.barbercosmo.ca.gov/licensees/online_prof.shtml'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('13'
   ,'Barber'
   ,''
   ,'Department of Consumer Affairs Board of Barbering and Cosmetology'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=IND&p_qte_pgm_code=3300'
   ,'http://www.barbercosmo.ca.gov/licensees/online_prof.shtml'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('14'
   ,'Electrologist'
   ,''
   ,'Department of Consumer Affairs Board of Barbering and Cosmetology'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=IND&p_qte_pgm_code=3300'
   ,'http://www.barbercosmo.ca.gov/licensees/online_prof.shtml'
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('15'
   ,'Marriage and Family Therapist'
   ,''
   ,'Department of Consumer Affairs Board of Behavioral Sciences'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=LX&p_qte_pgm_code=1800'
   ,''
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('16'
   ,'Educational Psychologist'
   ,''
   ,'Department of Consumer Affairs Board of Behavioral Sciences'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=LX&p_qte_pgm_code=1800'
   ,''
   ,'4/27/2012 12:00:00 AM'
   ,'4/27/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('17'
   ,'Certified Massage Therapist (CMT)'
   ,'Required to complete at least 500 hours of massage education and training at an approved massage therapy school.  CMTs also must undergo background checks, including fingerprinting and other identification verification procedures.'
   ,'The California Massage Therapy Council (CAMTC)'
   ,'https://www.camtc.org/VerifyCertification.aspx'
   ,'https://www.camtc.org/FormDownloads/CAMTCApplicationChecklist.pdf'
   ,'6/21/2012 12:00:00 AM'
   ,'6/21/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('18'
   ,'Certified Massage Practitioner (CMP)'
   ,'Generally must complete at least 250 hours of education and training.  CMPs also must undergo background checks, including fingerprinting and other identification verification procedures.'
   ,'The California Massage Therapy Council (CAMTC)'
   ,'https://www.camtc.org/VerifyCertification.aspx'
   ,'https://www.camtc.org/FormDownloads/CAMTCApplicationChecklist.pdf'
   ,'6/21/2012 12:00:00 AM'
   ,'6/21/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('19'
   ,'Certified Nurse Assistant'
   ,''
   ,'California Department of Public Health'
   ,'http://www.apps.cdph.ca.gov/cvl/SearchPage.aspx'
   ,'http://www.cdph.ca.gov/certlic/occupations/Pages/AidesAndTechs.aspx'
   ,'7/6/2012 12:00:00 AM'
   ,'7/6/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('20'
   ,'Home Health Aide'
   ,''
   ,'California Department of Public Health'
   ,'http://www.apps.cdph.ca.gov/cvl/SearchPage.aspx'
   ,'http://www.cdph.ca.gov/certlic/occupations/Pages/AidesAndTechs.aspx'
   ,'7/6/2012 12:00:00 AM'
   ,'7/6/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('21'
   ,'ACSM Certified Personal Trainer'
   ,'The ACSM Certified Personal Trainer (CPT) works with apparently healthy individuals and those with health challenges who are able to exercise independently to enhance quality of life, improve health-related physical fitness, performance, manage health risk, and promote lasting health behavior change. The CPT conducts basic preparticipation health screening assessments, submaximal cardiovascular exercise tests, and muscular strength/endurance, flexibility, and body composition tests. The CPT facilitates motivation and adherence as well as develops and administers programs designed to enhance muscular strength/endurance, flexibility, cardiorespiratory fitness, body composition, and/or any of the motor skill related components of physical fitness (i.e., balance, coordination, power, agility, speed, and reaction time).'
   ,'American College of Sports Medicine (ACSM)'
   ,'http://members.acsm.org/source/custom/Online_locator/OnlineLocator.cfm'
   ,'http://certification.acsm.org/acsm-certified-personal-trainer'
   ,'7/10/2012 12:00:00 AM'
   ,'7/10/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('22'
   ,'ACSM Certified Group Exercise Instructor'
   ,'The ACSM GEI works in a group exercise setting with apparently healthy individuals and those with health challenges who are able to exercise independently to enhance quality of life, improve health-related physical fitness, manage health risk, and promote lasting health behavior change. The GEI leads safe and effective exercise programs using a variety of leadership techniques to foster group camaraderie, support, and motivation to enhance muscular strength and endurance, flexibility, cardiovascular fitness, body composition, and any of the motor skills related to the domains of health-related physical fitness.'
   ,'American College of Sports Medicine (ACSM)'
   ,'http://members.acsm.org/source/custom/Online_locator/OnlineLocator.cfm'
   ,'http://certification.acsm.org/acsm-certified-group-exercise-instructor'
   ,'7/10/2012 12:00:00 AM'
   ,'7/10/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('23'
   ,'ACSM Certified Health Fitness Specialist'
   ,'The ACSM Certified Health Fitness SpecialistSM (HFS) is a health/fitness professional with a minimum of a bachelor''s degree in exercise science. The HFS performs pre-exercise health risk assessments, conducts physical fitness assessments, interprets results, develops exercise prescriptions, and applies behavioral and motivational strategies to apparently healthy individuals and individuals with medically controlled diseases and health conditions to support clients in adopting and maintaining healthy lifestyle behaviors. The academic preparation of the HFS also includes fitness management, administration, and supervision. The HFS is typically employed or self-employed in commercial, community, studio, corporate, university, and hospital settings.'
   ,'American College of Sports Medicine (ACSM)'
   ,'http://members.acsm.org/source/custom/Online_locator/OnlineLocator.cfm'
   ,'http://certification.acsm.org/acsm-certified-health-fitness-specialist'
   ,'7/10/2012 12:00:00 AM'
   ,'7/10/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('24'
   ,'ACSM Certified Clinical Exercise Specialist'
   ,'The ACSM Certified Clinical Exercise SpecialistSM (CES) is a professional with a minimum of a Bachelor''s degree in exercise science. The CES works with patients and clients challenged with cardiovascular, pulmonary, and metabolic diseases and disorders, as well as with apparently healthy populations in cooperation with other healthcare professionals to enhance quality of life, manage health risk, and promote lasting health behavior change. The CES conducts pre-participation health screening, maximal and submaximal graded exercise tests, and performs strength, flexibility and body composition tests. The CES develops and administer programs designed to enhance aerobic endurance, cardiovascular function, muscular strength and endurance, balance, and range of motion. The CES educates their clients about testing, exercise program components, and clinical and lifestyle self- are for control of chronic disease and health conditions.'
   ,'American College of Sports Medicine (ACSM)'
   ,'http://members.acsm.org/source/custom/Online_locator/OnlineLocator.cfm'
   ,'http://certification.acsm.org/acsm-certified-clinical-exercise-specialist'
   ,'7/10/2012 12:00:00 AM'
   ,'7/10/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('25'
   ,'ACSM Registered Clinical Exercise Physiologist'
   ,'The ACSM Registered Clinical Exercise Physiologist (RCEP) is an allied health professional with a minimum of a Master''s degree in exercise science, and works in the application of physical activity and behavioral interventions for those clinical diseases and health conditions that have been shown to provide therapeutic and/or functional benefit. Services provided by an RCEP include, but are not limited to, individuals with cardiovascular, pulmonary, metabolic, orthopedic, musculoskeletal, neuromuscular, neoplastic, immunologic, and hematologic disease. The RCEP provides primary and secondary prevention and rehabilitative strategies designed to improve physical fitness and health in populations ranging across the lifespan.  The RCEP performs exercise screening, clinical exercise testing, exercise prescription, exercise and physical activity counseling, exercise supervision, exercise and health education/promotion, and measurement and evaluation of exercise and physical activity related outcome measures. The RCEP works individually or as part of an interdisciplinary team in a clinical, community, or public health setting. The practice and supervision of the RCEP is guided by published professional guidelines, standards, and applicable state and federal laws and regulations.  '
   ,'American College of Sports Medicine (ACSM)'
   ,'http://members.acsm.org/source/custom/Online_locator/OnlineLocator.cfm'
   ,'http://certification.acsm.org/acsm-registered-clinical-exercise-physiologist'
   ,'7/10/2012 12:00:00 AM'
   ,'7/10/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('26'
   ,'ACSM Exercise Is Medicine® Credential'
   ,'In 2007, ACSM''s Exercise is Medicine® (EIM) campaign was initiated to promote exercise as a health strategy for the general public and to promote a collaboration between health care providers and exercise professionals. The EIM initiative now includes a credential program that will provide exercise professionals with the opportunity to work closely with the medical community and provide numerous additional benefits to the certified professional.  These benefits include: A respected credential to work with individuals who are healthy, individuals with health-related conditions who have been cleared by their physicians for exercise (Level 1 or 2), and for patients who require clinical support and monitoring (Level 3) Provides health care providers with a system to validate the qualifications of exercise professionals who are eligible to work with their patients An opportunity for fitness professionals to market to health care providers and to develop or cultivate patient referrals on a regular basis The system developed by the American College of Sports Medicine to credential exercise professionals for EIM designation considered three components: Professional preparation necessary to safely and effectively prescribe exercise to a patient population Development of the skills needed to work within the health care system Development of the skills needed to support sustained behavior change '
   ,'American College of Sports Medicine (ACSM)'
   ,'http://members.acsm.org/source/custom/Online_locator/OnlineLocator.cfm'
   ,'http://certification.acsm.org/exercise-is-medicine-credential'
   ,'7/10/2012 12:00:00 AM'
   ,'7/10/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('27'
   ,'ACSM/ACS Certified Cancer Exercise Trainer'
   ,'An ACSM/ACS Certified Cancer Exercise Trainer provides the following services: Designs and administers fitness assessments and exercise programs specific to one''s cancer diagnosis, treatment and current recovery status. Utilizes a basic understanding of cancer diagnoses, surgeries, treatments, related symptoms and side-effects of the various therapies.'
   ,'American College of Sports Medicine (ACSM)'
   ,'http://members.acsm.org/source/custom/Online_locator/OnlineLocator.cfm'
   ,'http://certification.acsm.org/acsm-cancer-exercise-trainer'
   ,'7/10/2012 12:00:00 AM'
   ,'7/10/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('28'
   ,'ACSM/NCPAD Certified Inclusive Fitness Trainer'
   ,' Utilize safe, effective and adapted methods of exercise training. Provide adapted exercise recommendations with an understanding of exercise precautions for people with disabilities. Provide services with an understanding of current ADA policy specific to recreation facilities (U.S. Access Board Guidelines) and standards for accessible facility design. Utilize motivational techniques and provide instruction to individuals with disabilities to begin and continue healthy lifestyles. '
   ,'American College of Sports Medicine (ACSM)'
   ,'http://members.acsm.org/source/custom/Online_locator/OnlineLocator.cfm'
   ,'http://certification.acsm.org/acsm-inclusive-fitness-trainer'
   ,'7/10/2012 12:00:00 AM'
   ,'7/10/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('29'
   ,'ACSM/NSPAPPH Certified Physical Activity in Public Health Specialist'
   ,'A certified ACSM/NSPAPPH Physical Activity in Public Health Specialist (PAPHS) conducts needs assessments, plans, develops and coordinates physical activity interventions provided at local, state and federal levels.  A PAPHS is also called upon to provide leadership, develop partnerships and advise local, state and federal health departments on all physical activity-related initiatives. They ensure they are consistent, based on best available evidence and coordinated with other physical activity programs, in order to optimize effectiveness and public health benefit.'
   ,'American College of Sports Medicine (ACSM)'
   ,'http://members.acsm.org/source/custom/Online_locator/OnlineLocator.cfm'
   ,'http://certification.acsm.org/acsm-physical-activity-in-public-health-specialist'
   ,'7/10/2012 12:00:00 AM'
   ,'7/10/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('30'
   ,'ASE Engine Repair'
   ,'Auto technicians and other professionals who want to become ASE certified can take one or more of ASE’s 40-plus exams. The exams are grouped into specialties such as automobile, medium/heavy truck, truck equipment, school bus, collision repair, and more.  The exams stress knowledge of job-related skills. The tests are no cinch to pass; in fact, usually only two out of every three test-takers pass on their first attempt. After passing at least one exam and providing proof of two years of relevant work experience, the test-taker becomes ASE certified. To remain certified, ASE-certified professionals must be retested every five years.'
   ,'National Institute for Automotive Service Excellence (ASE) '
   ,'http://www.ase.com/getattachment/About-ASE/Download-Forms/EmployerCertStatusRequestForm2008-(1).pdf.aspx'
   ,'http://www.ase.com/Landing-Pages/Technicians.aspx'
   ,'10/9/2012 12:00:00 AM'
   ,'10/9/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('31'
   ,'ASE Automatic Transmission/Transaxle'
   ,'Auto technicians and other professionals who want to become ASE certified can take one or more of ASE’s 40-plus exams. The exams are grouped into specialties such as automobile, medium/heavy truck, truck equipment, school bus, collision repair, and more.  The exams stress knowledge of job-related skills. The tests are no cinch to pass; in fact, usually only two out of every three test-takers pass on their first attempt. After passing at least one exam and providing proof of two years of relevant work experience, the test-taker becomes ASE certified. To remain certified, ASE-certified professionals must be retested every five years.'
   ,'National Institute for Automotive Service Excellence (ASE) '
   ,'http://www.ase.com/getattachment/About-ASE/Download-Forms/EmployerCertStatusRequestForm2008-(1).pdf.aspx'
   ,'http://www.ase.com/Landing-Pages/Technicians.aspx'
   ,'10/9/2012 12:00:00 AM'
   ,'10/9/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('32'
   ,'ASE Manual Drive Train & Axles'
   ,'Auto technicians and other professionals who want to become ASE certified can take one or more of ASE’s 40-plus exams. The exams are grouped into specialties such as automobile, medium/heavy truck, truck equipment, school bus, collision repair, and more.  The exams stress knowledge of job-related skills. The tests are no cinch to pass; in fact, usually only two out of every three test-takers pass on their first attempt. After passing at least one exam and providing proof of two years of relevant work experience, the test-taker becomes ASE certified. To remain certified, ASE-certified professionals must be retested every five years.'
   ,'National Institute for Automotive Service Excellence (ASE) '
   ,'http://www.ase.com/getattachment/About-ASE/Download-Forms/EmployerCertStatusRequestForm2008-(1).pdf.aspx'
   ,'http://www.ase.com/Landing-Pages/Technicians.aspx'
   ,'10/9/2012 12:00:00 AM'
   ,'10/9/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('33'
   ,'ASE Suspension & Steering'
   ,'Auto technicians and other professionals who want to become ASE certified can take one or more of ASE’s 40-plus exams. The exams are grouped into specialties such as automobile, medium/heavy truck, truck equipment, school bus, collision repair, and more.  The exams stress knowledge of job-related skills. The tests are no cinch to pass; in fact, usually only two out of every three test-takers pass on their first attempt. After passing at least one exam and providing proof of two years of relevant work experience, the test-taker becomes ASE certified. To remain certified, ASE-certified professionals must be retested every five years.'
   ,'National Institute for Automotive Service Excellence (ASE) '
   ,'http://www.ase.com/getattachment/About-ASE/Download-Forms/EmployerCertStatusRequestForm2008-(1).pdf.aspx'
   ,'http://www.ase.com/Landing-Pages/Technicians.aspx'
   ,'10/9/2012 12:00:00 AM'
   ,'10/9/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('34'
   ,'ASE Brakes'
   ,'Auto technicians and other professionals who want to become ASE certified can take one or more of ASE’s 40-plus exams. The exams are grouped into specialties such as automobile, medium/heavy truck, truck equipment, school bus, collision repair, and more.  The exams stress knowledge of job-related skills. The tests are no cinch to pass; in fact, usually only two out of every three test-takers pass on their first attempt. After passing at least one exam and providing proof of two years of relevant work experience, the test-taker becomes ASE certified. To remain certified, ASE-certified professionals must be retested every five years.'
   ,'National Institute for Automotive Service Excellence (ASE) '
   ,'http://www.ase.com/getattachment/About-ASE/Download-Forms/EmployerCertStatusRequestForm2008-(1).pdf.aspx'
   ,'http://www.ase.com/Landing-Pages/Technicians.aspx'
   ,'10/9/2012 12:00:00 AM'
   ,'10/9/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('35'
   ,'ASE Electrical/Electronic Systems'
   ,'Auto technicians and other professionals who want to become ASE certified can take one or more of ASE’s 40-plus exams. The exams are grouped into specialties such as automobile, medium/heavy truck, truck equipment, school bus, collision repair, and more.  The exams stress knowledge of job-related skills. The tests are no cinch to pass; in fact, usually only two out of every three test-takers pass on their first attempt. After passing at least one exam and providing proof of two years of relevant work experience, the test-taker becomes ASE certified. To remain certified, ASE-certified professionals must be retested every five years.'
   ,'National Institute for Automotive Service Excellence (ASE) '
   ,'http://www.ase.com/getattachment/About-ASE/Download-Forms/EmployerCertStatusRequestForm2008-(1).pdf.aspx'
   ,'http://www.ase.com/Landing-Pages/Technicians.aspx'
   ,'10/9/2012 12:00:00 AM'
   ,'10/9/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('36'
   ,'ASE Heating & Air Conditioning'
   ,'Auto technicians and other professionals who want to become ASE certified can take one or more of ASE’s 40-plus exams. The exams are grouped into specialties such as automobile, medium/heavy truck, truck equipment, school bus, collision repair, and more.  The exams stress knowledge of job-related skills. The tests are no cinch to pass; in fact, usually only two out of every three test-takers pass on their first attempt. After passing at least one exam and providing proof of two years of relevant work experience, the test-taker becomes ASE certified. To remain certified, ASE-certified professionals must be retested every five years.'
   ,'National Institute for Automotive Service Excellence (ASE) '
   ,'http://www.ase.com/getattachment/About-ASE/Download-Forms/EmployerCertStatusRequestForm2008-(1).pdf.aspx'
   ,'http://www.ase.com/Landing-Pages/Technicians.aspx'
   ,'10/9/2012 12:00:00 AM'
   ,'10/9/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('37'
   ,'ASE Engine Performance'
   ,'Auto technicians and other professionals who want to become ASE certified can take one or more of ASE’s 40-plus exams. The exams are grouped into specialties such as automobile, medium/heavy truck, truck equipment, school bus, collision repair, and more.  The exams stress knowledge of job-related skills. The tests are no cinch to pass; in fact, usually only two out of every three test-takers pass on their first attempt. After passing at least one exam and providing proof of two years of relevant work experience, the test-taker becomes ASE certified. To remain certified, ASE-certified professionals must be retested every five years.'
   ,'National Institute for Automotive Service Excellence (ASE) '
   ,'http://www.ase.com/getattachment/About-ASE/Download-Forms/EmployerCertStatusRequestForm2008-(1).pdf.aspx'
   ,'http://www.ase.com/Landing-Pages/Technicians.aspx'
   ,'10/9/2012 12:00:00 AM'
   ,'10/9/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('38'
   ,'ASE Light Vehicle Diesel Engines'
   ,'Auto technicians and other professionals who want to become ASE certified can take one or more of ASE’s 40-plus exams. The exams are grouped into specialties such as automobile, medium/heavy truck, truck equipment, school bus, collision repair, and more.  The exams stress knowledge of job-related skills. The tests are no cinch to pass; in fact, usually only two out of every three test-takers pass on their first attempt. After passing at least one exam and providing proof of two years of relevant work experience, the test-taker becomes ASE certified. To remain certified, ASE-certified professionals must be retested every five years.'
   ,'National Institute for Automotive Service Excellence (ASE) '
   ,'http://www.ase.com/getattachment/About-ASE/Download-Forms/EmployerCertStatusRequestForm2008-(1).pdf.aspx'
   ,'http://www.ase.com/Landing-Pages/Technicians.aspx'
   ,'10/9/2012 12:00:00 AM'
   ,'10/9/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('39'
   ,'ASE Painting & Refinishing'
   ,'Auto technicians and other professionals who want to become ASE certified can take one or more of ASE’s 40-plus exams. The exams are grouped into specialties such as automobile, medium/heavy truck, truck equipment, school bus, collision repair, and more.  The exams stress knowledge of job-related skills. The tests are no cinch to pass; in fact, usually only two out of every three test-takers pass on their first attempt. After passing at least one exam and providing proof of two years of relevant work experience, the test-taker becomes ASE certified. To remain certified, ASE-certified professionals must be retested every five years.'
   ,'National Institute for Automotive Service Excellence (ASE) '
   ,'http://www.ase.com/getattachment/About-ASE/Download-Forms/EmployerCertStatusRequestForm2008-(1).pdf.aspx'
   ,'http://www.ase.com/Landing-Pages/Technicians.aspx'
   ,'10/9/2012 12:00:00 AM'
   ,'10/9/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('40'
   ,'ASE Non-Structural Analysis & Damage Repair'
   ,'Auto technicians and other professionals who want to become ASE certified can take one or more of ASE’s 40-plus exams. The exams are grouped into specialties such as automobile, medium/heavy truck, truck equipment, school bus, collision repair, and more.  The exams stress knowledge of job-related skills. The tests are no cinch to pass; in fact, usually only two out of every three test-takers pass on their first attempt. After passing at least one exam and providing proof of two years of relevant work experience, the test-taker becomes ASE certified. To remain certified, ASE-certified professionals must be retested every five years.'
   ,'National Institute for Automotive Service Excellence (ASE) '
   ,'http://www.ase.com/getattachment/About-ASE/Download-Forms/EmployerCertStatusRequestForm2008-(1).pdf.aspx'
   ,'http://www.ase.com/Landing-Pages/Technicians.aspx'
   ,'10/9/2012 12:00:00 AM'
   ,'10/9/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('41'
   ,'ASE Structural Analysis & Damage Repair'
   ,'Auto technicians and other professionals who want to become ASE certified can take one or more of ASE’s 40-plus exams. The exams are grouped into specialties such as automobile, medium/heavy truck, truck equipment, school bus, collision repair, and more.  The exams stress knowledge of job-related skills. The tests are no cinch to pass; in fact, usually only two out of every three test-takers pass on their first attempt. After passing at least one exam and providing proof of two years of relevant work experience, the test-taker becomes ASE certified. To remain certified, ASE-certified professionals must be retested every five years.'
   ,'National Institute for Automotive Service Excellence (ASE) '
   ,'http://www.ase.com/getattachment/About-ASE/Download-Forms/EmployerCertStatusRequestForm2008-(1).pdf.aspx'
   ,'http://www.ase.com/Landing-Pages/Technicians.aspx'
   ,'10/9/2012 12:00:00 AM'
   ,'10/9/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('42'
   ,'ASE Mechanical & Electrical Components'
   ,'Auto technicians and other professionals who want to become ASE certified can take one or more of ASE’s 40-plus exams. The exams are grouped into specialties such as automobile, medium/heavy truck, truck equipment, school bus, collision repair, and more.  The exams stress knowledge of job-related skills. The tests are no cinch to pass; in fact, usually only two out of every three test-takers pass on their first attempt. After passing at least one exam and providing proof of two years of relevant work experience, the test-taker becomes ASE certified. To remain certified, ASE-certified professionals must be retested every five years.'
   ,'National Institute for Automotive Service Excellence (ASE) '
   ,'http://www.ase.com/getattachment/About-ASE/Download-Forms/EmployerCertStatusRequestForm2008-(1).pdf.aspx'
   ,'http://www.ase.com/Landing-Pages/Technicians.aspx'
   ,'10/9/2012 12:00:00 AM'
   ,'10/9/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('43'
   ,'ASE Damage Analysis & Estimating'
   ,'Auto technicians and other professionals who want to become ASE certified can take one or more of ASE’s 40-plus exams. The exams are grouped into specialties such as automobile, medium/heavy truck, truck equipment, school bus, collision repair, and more.  The exams stress knowledge of job-related skills. The tests are no cinch to pass; in fact, usually only two out of every three test-takers pass on their first attempt. After passing at least one exam and providing proof of two years of relevant work experience, the test-taker becomes ASE certified. To remain certified, ASE-certified professionals must be retested every five years.'
   ,'National Institute for Automotive Service Excellence (ASE) '
   ,'http://www.ase.com/getattachment/About-ASE/Download-Forms/EmployerCertStatusRequestForm2008-(1).pdf.aspx'
   ,'http://www.ase.com/Landing-Pages/Technicians.aspx'
   ,'10/9/2012 12:00:00 AM'
   ,'10/9/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('44'
   ,'ASE Auto Service Consultant'
   ,'Auto technicians and other professionals who want to become ASE certified can take one or more of ASE’s 40-plus exams. The exams are grouped into specialties such as automobile, medium/heavy truck, truck equipment, school bus, collision repair, and more.  The exams stress knowledge of job-related skills. The tests are no cinch to pass; in fact, usually only two out of every three test-takers pass on their first attempt. After passing at least one exam and providing proof of two years of relevant work experience, the test-taker becomes ASE certified. To remain certified, ASE-certified professionals must be retested every five years.'
   ,'National Institute for Automotive Service Excellence (ASE) '
   ,'http://www.ase.com/getattachment/About-ASE/Download-Forms/EmployerCertStatusRequestForm2008-(1).pdf.aspx'
   ,'http://www.ase.com/Landing-Pages/Technicians.aspx'
   ,'10/9/2012 12:00:00 AM'
   ,'10/9/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('45'
   ,'ASE Exhaust Systems'
   ,'Auto technicians and other professionals who want to become ASE certified can take one or more of ASE’s 40-plus exams. The exams are grouped into specialties such as automobile, medium/heavy truck, truck equipment, school bus, collision repair, and more.  The exams stress knowledge of job-related skills. The tests are no cinch to pass; in fact, usually only two out of every three test-takers pass on their first attempt. After passing at least one exam and providing proof of two years of relevant work experience, the test-taker becomes ASE certified. To remain certified, ASE-certified professionals must be retested every five years.'
   ,'National Institute for Automotive Service Excellence (ASE) '
   ,'http://www.ase.com/getattachment/About-ASE/Download-Forms/EmployerCertStatusRequestForm2008-(1).pdf.aspx'
   ,'http://www.ase.com/Landing-Pages/Technicians.aspx'
   ,'10/9/2012 12:00:00 AM'
   ,'10/9/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('46'
   ,'ACE Personal Trainer '
   ,'Founded in 1985, the American Council on Exercise® (ACE ®) is a nonprofit organization committed to America’s health and wellbeing. Over the past 25 years, they have become an established resource for both fitness professionals and consumers, providing comprehensive, unbiased, scientific research impacting the fitness industry and validating themselves as the country’s trusted authority on fitness. Today, ACE is the largest nonprofit fitness certification, education and training organization in the world with nearly 50,000 certified professionals who hold more than 55,000 ACE certifications. With a long heritage in certification, education, training and public outreach, they are among the most respected fitness organizations in the industry and a resource consumers have come to trust for health and fitness education. {ACE}'
   ,'American Council on Exercise® (ACE) '
   ,'http://www.acefitness.org/findanacepro/default.aspx'
   ,'http://www.acefitness.org/getcertified/personal-trainer-certification.aspx'
   ,'10/9/2012 12:00:00 AM'
   ,'10/9/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('47'
   ,'ACE Group Fitness Instructor'
   ,'The ACE® Group Fitness Instructor Certification is designed for fitness professionals teaching any form of exercise in a group setting.
Passing the ACE Group Fitness Instructor Certification Exam demonstrates the instructor possesses the foundation of knowledge and skills necessary to teach a safe and effective group fitness class, no matter what type of modality. This includes:
Anatomy
Kinesiology
Exercise Physiology
Instructional Techniques
Class Design
Cueing
Injury Prevention [ACE]'
   ,'American Council on Exercise® (ACE)'
   ,'http://www.acefitness.org/findanacepro/default.aspx'
   ,'http://www.acefitness.org/getcertified/group-fitness-certification.aspx'
   ,'10/9/2012 12:00:00 AM'
   ,'10/9/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('48'
   ,'ACE Health Coach'
   ,'Intended for fitness, wellness, health care, human resources and allied health professionals who want to make a resounding difference in the way people live,
 ACE Health Coach emphasizes fitness, nutrition and the science behind true behavior modification. As the only certification of its kind accredited by the National Commission for Certifying Agencies (NCCA), ACE Health Coach helps professionals connect with people in a way that makes them not only want to change, but believe they can do it long term.[ACE]'
   ,'American Council on Exercise® (ACE)'
   ,'http://www.acefitness.org/findanacepro/default.aspx'
   ,'http://www.acefitness.org/getcertified/health-coach-certification.aspx'
   ,'10/9/2012 12:00:00 AM'
   ,'10/9/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('49'
   ,'ACE Advanced Health & Fitness Specialist Certification'
   ,'Earning the ACE® Advanced Health & Fitness Specialist Certification demonstrates that the personal trainer has the knowledge to provide in-depth preventative and post rehabilitative fitness programming for individuals who are at risk for or are recovering from a variety of cardiovascular, pulmonary, metabolic and musculoskeletal issues. [ACE]'
   ,'American Council on Exercise® (ACE)'
   ,'http://www.acefitness.org/findanacepro/default.aspx'
   ,'http://www.acefitness.org/getcertified/certification_ahfs.aspx'
   ,'10/9/2012 12:00:00 AM'
   ,'10/9/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('50'
   ,'NASM Certified Personal Trainer (CPT)'
   ,'With the NASM CPT certification:
-Learn the basics of anatomy, physiology, kinesiology, nutrition, and behavioral coaching.
-Confidently design innovative exercise programs that are specific to a client’s needs and abilities.
-Help clients achieve their goals safely and effectively!'
   ,'National Academy of Sports Medicine (NASM)'
   ,'http://www.nasm.org/certificationsearch.aspx'
   ,'http://www.nasm.org/getcertified/'
   ,'10/9/2012 12:00:00 AM'
   ,'10/9/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('51'
   ,'NASM Performance Enhancement Specialist (PES)'
   ,'With the NASM PES Advance Specialization:
-Improve athlete’s endurance, strength, speed, and power
-Reduce athlete’s risk of injury'
   ,'National Academy of Sports Medicine (NASM)'
   ,'http://www.nasm.org/certificationsearch.aspx'
   ,'http://www.nasm.org/train/'
   ,'10/9/2012 12:00:00 AM'
   ,'10/9/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('52'
   ,'NASM Corrective Exercise Specialist (CES)'
   ,'With the NASM CES Advance Specialization:
-Increase muscle activation and correct muscle weakness
-Prevent future injury'
   ,'National Academy of Sports Medicine (NASM)'
   ,'http://www.nasm.org/certificationsearch.aspx'
   ,'http://www.nasm.org/prevent/'
   ,'10/9/2012 12:00:00 AM'
   ,'10/9/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('53'
   ,'Cosmetologist'
   ,''
   ,'California Board of Barbering and Cosmetology'
   ,'http://www2.dca.ca.gov/pls/wllpub/wllqryna$lcev2.startup?p_qte_code=IND&p_qte_pgm_code=3300'
   ,'http://www.dca.ca.gov/proflic/cosmetology_renew.shtml'
   ,'12/3/2012 12:00:00 AM'
   ,'12/3/2012 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('54'
   ,'Certified Professional Dog Trainer - Knowledge Assessed'
   ,'CPDT-KA (Certified Professional Dog Trainer - Knowledge Assessed): proven knowledge deemed necessary by animal behavior experts for an entry level dog trainer'
   ,'Certification Council for Professional Dog Trainers'
   ,'http://www.ccpdt.org/index.php?option=com_certificants&Itemid=102'
   ,'http://www.ccpdt.org/index.php?option=com_phocadownload&view=category&id=24&Itemid=139'
   ,'1/5/2013 12:00:00 AM'
   ,'1/5/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('55'
   ,'Certified Professional Dog Trainer - Knowledge & Skills Assessed'
   ,'CPDT-KSA (Certified Professional Dog Trainer - Knowledge & Skills Assessed): proven knowledge deemed necessary by animal behavior experts for an entry level dog  trainer and demonstrated the skills necessary to train dogs and teach others to train their dogs.'
   ,'Certification Council for Professional Dog Trainers'
   ,'http://www.ccpdt.org/index.php?option=com_certificants&Itemid=102'
   ,'http://www.ccpdt.org/index.php?option=com_phocadownload&view=category&id=24&Itemid=139'
   ,'1/5/2013 12:00:00 AM'
   ,'1/5/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('56'
   ,'Certified Behavior Consultant Canine - Knowledge Assessed'
   ,'CBCC-KA (Certified Behavior Consultant Canine - Knowledge Assessed): proven knowledge deemed necessary by animal behavior experts for a canine behavior consultant'
   ,'Certification Council for Professional Dog Trainers'
   ,'http://www.ccpdt.org/index.php?option=com_certificants&Itemid=102'
   ,'http://www.ccpdt.org/index.php?option=com_phocadownload&view=category&id=24&Itemid=139'
   ,'1/5/2013 12:00:00 AM'
   ,'1/5/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('57'
   ,'Certified Behavior Consultant Canine - Knowledge & Skills Assessed'
   ,'CBCC-KSA (Certified Behavior Consultant Canine - Knowledge & Skills Assessed): proven knowledge deemed necessary by animal behavior experts for a canine behavior consultant and demonstrated the skills necessary to modify a dog''s complex behavior issues.'
   ,'Certification Council for Professional Dog Trainers'
   ,'http://www.ccpdt.org/index.php?option=com_certificants&Itemid=102'
   ,'http://www.ccpdt.org/index.php?option=com_phocadownload&view=category&id=24&Itemid=139'
   ,'1/5/2013 12:00:00 AM'
   ,'1/5/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('58'
   ,'TIPS Certified'
   ,'TIPS (Training for Intervention ProcedureS) is a dynamic, skills-based training program designed to prevent intoxication, drunk driving and underage drinking by enhancing the fundamental "people skills" of servers, sellers and consumers of alcohol. TIPS gives individuals the knowledge and confidence they need to recognize potential alcohol-related problems and intervene to prevent alcohol-related tragedies.'
   ,'Health Communications, Inc.'
   ,'http://www.gettips.com/lookupcert.shtml'
   ,'http://www.gettips.com/home/choose.shtml'
   ,'1/23/2013 12:00:00 AM'
   ,'1/23/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('59'
   ,'Reiki Level 1'
   ,''
   ,''
   ,''
   ,''
   ,'1/29/2013 12:00:00 AM'
   ,'1/29/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('60'
   ,'Reiki Level 2'
   ,''
   ,''
   ,''
   ,''
   ,'1/29/2013 12:00:00 AM'
   ,'1/29/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('61'
   ,'Reiki Master'
   ,''
   ,''
   ,''
   ,''
   ,'1/29/2013 12:00:00 AM'
   ,'1/29/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('62'
   ,'Reiki Master'
   ,''
   ,''
   ,''
   ,''
   ,'1/29/2013 12:00:00 AM'
   ,'1/29/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('63'
   ,'General Massage Practitioner'
   ,'The only difference is that a General Massage Practitioner Permit requires a minimum of 100 hours of training from a certified massage school while an Advanced Massage Practitioner Permit requires a minimum of 200 hours of training from a certified massage school.'
   ,'San Francisco Department of Public Health'
   ,'http://www.sfdph.org/dph/EH/Massage/default.asp'
   ,'http://www.sfdph.org/dph/files/EHSdocs/ehsMassagedocs/FAQ.pdf'
   ,'2/4/2013 12:00:00 AM'
   ,'2/4/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('64'
   ,'Advanced Massage Practitioner'
   ,'The only difference is that a General Massage Practitioner Permit requires a minimum of 100 hours of training from a certified massage school while an Advanced Massage Practitioner Permit requires a minimum of 200 hours of training from a certified massage school.'
   ,'San Francisco Department of Public Health'
   ,'http://www.sfdph.org/dph/EH/Massage/default.asp'
   ,'http://www.sfdph.org/dph/files/EHSdocs/ehsMassagedocs/FAQ.pdf'
   ,'2/4/2013 12:00:00 AM'
   ,'2/4/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('65'
   ,'Licensed Attorney'
   ,''
   ,'California State Bar Association'
   ,'http://members.calbar.ca.gov/fal/MemberSearch/QuickSearch'
   ,'https://www.calbarxap.com/'
   ,'7/17/2014 12:00:00 AM'
   ,'7/17/2014 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')
INSERT INTO [licensecertification]
   ([LicenseCertificationID]
   ,[LicenseCertificationType]
   ,[LicenseCertificationTypeDescription]
   ,[LicenseCertificationAuthority]
   ,[VerificationWebsiteURL]
   ,[HowToGetLicensedURL]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[LanguageID])
VALUES
   ('66'
   ,'San Francisco Business License'
   ,''
   ,'San Francisco City Treasurer'
   ,''
   ,''
   ,'2/4/2013 12:00:00 AM'
   ,'2/4/2013 12:00:00 AM'
   ,'jd'
   ,'True'
   ,'1')

/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
