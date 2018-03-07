exec sp_rename @objname = 'dbo.Solution.SmallImage', @newname = 'Image', @objtype = 'COLUMN'
ALTER TABLE dbo.Solution DROP COLUMN Aliases
ALTER TABLE dbo.Solution DROP COLUMN ShortClientDescription
ALTER TABLE dbo.Solution DROP COLUMN LongClientDescription
ALTER TABLE dbo.Solution DROP COLUMN ShortProfessionalDescription
ALTER TABLE dbo.Solution DROP COLUMN LongProfessionalDescription
ALTER TABLE dbo.Solution DROP COLUMN BannerImage

exec sp_rename @objname = 'dbo.SearchSubCategory.ShortDescription', @newname = 'Description', @objtype = 'COLUMN'
exec sp_rename @objname = 'dbo.SearchSubCategory.SmallImage', @newname = 'Image', @objtype = 'COLUMN'
ALTER TABLE dbo.SearchSubCategory DROP COLUMN LongDescription
ALTER TABLE dbo.SearchSubCategory DROP COLUMN BannerImage