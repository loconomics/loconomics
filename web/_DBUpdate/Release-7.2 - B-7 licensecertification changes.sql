BEGIN TRANSACTION

ALTER TABLE licensecertification DROP CONSTRAINT PK__licensec__CE7A16FC19FFD4FC

ALTER TABLE licensecertification ADD PRIMARY KEY (LicenseCertificationID, LanguageID)


UPDATE licensecertification SET LicenseCertificationType = 'Legally required license/certification', LicenseCertificationTypeDescription = 'Our records indicate that state or federal law requires you to have a license for this profession.' WHERE LicenseCertificationID = -1 AND LanguageID = 1

UPDATE licensecertification SET LicenseCertificationType = 'Supplemental professional certification', LicenseCertificationTypeDescription = 'Do you have a certification you''d like clients to know about? Upload a photo of it, and we''ll do our best to verify it, although we can''t guarantee it.' WHERE LicenseCertificationID = 0 AND LanguageID = 1


ALTER TABLE licensecertification DROP CONSTRAINT FK__licensece__State__1BE81D6E

ALTER TABLE licensecertification DROP COLUMN StateProvinceID

ALTER TABLE licensecertification DROP COLUMN CountryID

ALTER TABLE licensecertification DROP COLUMN OptionGroup


UPDATE verificationstatus SET VerificationStatusName = 'Contact us', VerificationStatusDisplayDescription = 'We need more infomation to verify. Please contact us.', UpdatedDate = '4/23/2016' WHERE VerificationStatusID = 3 AND LanguageID = 1 AND CountryID = 1

INSERT INTO verificationstatus (VerificationStatusID, LanguageID, CountryID, VerificationStatusName, VerificationStatusDisplayDescription, CreatedDate, UpdatedDate, ModifiedBy, Active) VALUES (5, 1, 1, 'We do not verify', 'We do not verify this information.', '4/23/2016', '4/23/2016', 'jd', 1)

INSERT INTO verificationstatus (VerificationStatusID, LanguageID, CountryID, VerificationStatusName, VerificationStatusDisplayDescription, CreatedDate, UpdatedDate, ModifiedBy, Active) VALUES (6, 1, 1, 'Expires soon', 'This verification expires soon.', '4/23/2016', '4/23/2016', 'jd', 1)

COMMIT TRANSACTION