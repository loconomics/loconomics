SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Modified date: 2017-11-09
-- Description:	Test if the conditions for the
-- alert type 'personalinfo' are satisfied, 
-- updating user points and enabling or 
-- disabling it profile.
-- =============================================
ALTER PROCEDURE [dbo].[TestAlertPersonalInfo]
	@UserID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 3
    
    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
	  (
		EXISTS (
			SELECT UserID
			FROM Users
			WHERE 
				UserID = @UserID
				AND dbo.fx_IfNW(FirstName, null) is not null
				AND dbo.fx_IfNW(LastName, null) is not null
				AND (
				 dbo.fx_IfNW(MobilePhone, null) is not null
				  OR
				 dbo.fx_IfNW(AlternatePhone, null) is not null
				)
				-- GenderID now in TestAlertPublicBio, to match new forms
				--AND GenderID > 0
		)
	) BEGIN
		-- PASSED: disable alert
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 0
	END ELSE BEGIN
		-- NOT PASSED: active alert
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 1
	END
	
	-- Test if user profile must be actived or not
	EXEC dbo.TestProfileActivation @UserID
END
GO
