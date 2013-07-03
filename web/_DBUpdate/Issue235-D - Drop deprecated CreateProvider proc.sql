/****** Object:  StoredProcedure [dbo].[CreateProvider]    Script Date: 07/03/2013 19:22:43 ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CreateProvider]') AND type in (N'P', N'PC'))
DROP PROCEDURE [dbo].[CreateProvider]
GO


