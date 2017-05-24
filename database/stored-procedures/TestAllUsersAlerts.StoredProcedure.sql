/****** Object:  StoredProcedure [dbo].[TestAllUsersAlerts]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description: Execute the TestAllUserAlerts
-- per ALL users on the database and all its
-- positions
-- CAREFUL: database performance can be affected
-- by this, use as an utility on testing or
-- special maintenance / update that can require
-- it.
-- =============================================
CREATE PROCEDURE [dbo].[TestAllUsersAlerts]
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @UserID int
    DECLARE @cur CURSOR
    
	SET @cur = CURSOR FOR 
		SELECT UserID
		FROM Users
		WHERE Active = 1
		 
	OPEN @cur
	FETCH NEXT FROM @cur INTO @UserID
	WHILE @@FETCH_STATUS = 0 BEGIN
		-- Execute this same proc but for a concrete positionID
		EXEC TestAllUserAlerts @UserID
		
		FETCH NEXT FROM @cur INTO @UserID
	END
	CLOSE @cur
	DEALLOCATE @cur

END
GO
