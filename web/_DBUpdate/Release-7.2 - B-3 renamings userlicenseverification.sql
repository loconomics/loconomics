BEGIN TRANSACTION

exec sp_rename @objname = 'userlicenseverification', @newname = 'UserLicenseCertifications'

exec sp_rename @objname = 'UserLicenseCertifications.userLicenseVerificationID', @newname = 'userLicenseCertificationID', @objtype = 'COLUMN'

COMMIT TRANSACTION