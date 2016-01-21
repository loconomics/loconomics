
/****** Object:  StoredProcedure [dbo].[GetPositions]    Script Date: 01/21/2016 14:32:24 ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetPositions]') AND type in (N'P', N'PC'))
DROP PROCEDURE [dbo].[GetPositions]
GO


