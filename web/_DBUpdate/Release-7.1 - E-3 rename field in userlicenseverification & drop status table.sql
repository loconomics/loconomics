exec sp_rename @objname = 'userlicenseverification.StatusID', @newname = 'VerificationStatusID', @objtype = 'COLUMN'

DROP TABLE dbo.status;