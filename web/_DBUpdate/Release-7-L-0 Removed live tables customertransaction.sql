-- Collateral: in live there were a direct created tables, if exists, remove drop them (a backup was done previously)
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK__customert__Booki__125EB334]') AND parent_object_id = OBJECT_ID(N'[dbo].[customertransaction]'))
ALTER TABLE [dbo].[customertransaction] DROP CONSTRAINT [FK__customert__Booki__125EB334]
GO

IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK__customert__Custo__116A8EFB]') AND parent_object_id = OBJECT_ID(N'[dbo].[customertransaction]'))
ALTER TABLE [dbo].[customertransaction] DROP CONSTRAINT [FK__customert__Custo__116A8EFB]
GO

IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK__customert__Custo__1352D76D]') AND parent_object_id = OBJECT_ID(N'[dbo].[customertransaction]'))
ALTER TABLE [dbo].[customertransaction] DROP CONSTRAINT [FK__customert__Custo__1352D76D]
GO

/****** Object:  Table [dbo].[customertransaction]    Script Date: 11/05/2015 13:34:16 ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[customertransaction]') AND type in (N'U'))
DROP TABLE [dbo].[customertransaction]
GO

IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[customertransactiontype]') AND type in (N'U'))
DROP TABLE [dbo].[customertransactiontype]
GO