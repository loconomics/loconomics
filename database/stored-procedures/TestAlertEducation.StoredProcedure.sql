/****** Object:  StoredProcedure [dbo].[TestAlertEducation]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2013-06-12
-- Description:	Test if the conditions for the
-- alert type 'add-education' are satisfied, 
-- updating user points and enabling or 
-- disabling it profile.
-- =============================================
CREATE PROCEDURE [dbo].[TestAlertEducation]
	@UserID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 20
    
    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		EXISTS (SELECT UserID FROM UserEducation
				WHERE UserID = @UserID
					AND Active = 1
					/* Only require activation and InstitutionID, and this
					last is not-null and foreign key */
					/*AND FromYearAttended is not null
					AND (
						dbo.fx_IfNW(DegreeCertificate , null) is not null
						OR
						dbo.fx_IfNW(FieldOfStudy , null) is not null
					)*/
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
