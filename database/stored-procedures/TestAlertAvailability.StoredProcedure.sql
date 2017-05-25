/****** Object:  StoredProcedure [dbo].[TestAlertAvailability]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'availability' are satisfied, 
-- updating user alert and enabling or 
-- disabling it profile.
-- =============================================
CREATE PROCEDURE [dbo].[TestAlertAvailability]
	@UserID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 2
    
    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		-- #735 ATTRIBUTES DISABLED (TEMPORARLY MAYBE)
		-- EXISTS (SELECT UserID FROM [CalendarProviderAttributes]
		-- WHERE UserID = @UserID)
		-- AND
		-- Updated script to follow new Calendar back-end that use events
		-- with a specific type instead of the special -and deleted- table 'FreeEvents':
		--AND EXISTS (SELECT UserID FROM [CalendarProviderFreeEvents]
		--WHERE UserID = @UserID)
		EXISTS (SELECT UserID FROM [CalendarEvents]
		WHERE UserID = @UserID AND EventType = 2)
	BEGIN
		-- PASSED: disable alert
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 0
	END ELSE BEGIN
		-- NOT PASSED: active alert
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 1
	END
	
	-- Test if user profile must be actived or not
	EXEC dbo.TestProfileActivation @UserID, 0
END
GO
