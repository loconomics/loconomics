/****** Object:  StoredProcedure [dbo].[ut_ModifyUserAlertsState]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-08-18
-- Description:	Allow FORCE enable or disable all
-- the alerts affecting the user given for
-- the position given (or common profile if
-- zero), WITHOUT perform the alert 
-- tests/conditions (what can means data
-- corruption in some cases, waiting that some
-- things are complete because the alert is off
-- and they are not).
-- 
-- NOTE: Utility procedure, not to use
-- from the program, else as sysadmin, tester
-- or developer.
-- 
-- =============================================
CREATE PROCEDURE [dbo].[ut_ModifyUserAlertsState] 
	@UserID int
	,@PositionID int = 0
	,@StateActive bit = 1 -- 0 to disable all alerts
	,@TestProfileActivation bit = 0
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	
	DECLARE @AlertID int
	DECLARE @PositionSpecific bit
    DECLARE @cur CURSOR
    
	SET @cur = CURSOR FOR 
		SELECT AlertID, PositionSpecific
		FROM Alert
		
	OPEN @cur
	FETCH NEXT FROM @cur INTO @AlertID, @PositionSpecific
	WHILE @@FETCH_STATUS = 0 BEGIN
	
		IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 1 BEGIN
			IF @PositionSpecific = 1 BEGIN
				IF @PositionID > 0
					EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, @StateActive
			END ELSE
				EXEC dbo.SetUserAlert @UserID, 0, @AlertID, @StateActive
		END

		FETCH NEXT FROM @cur INTO @AlertID, @PositionSpecific
	END
	CLOSE @cur
	DEALLOCATE @cur
    
    IF @TestProfileActivation = 1
		EXEC TestProfileActivation @UserID, @PositionID
END
GO
