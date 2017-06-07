/****** Object:  StoredProcedure [dbo].[TestAlertSocialMediaVerification]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'socialmediaverification' are satisfied, 
-- updating user points and enabling or 
-- disabling it profile.
-- =============================================
CREATE PROCEDURE [dbo].[TestAlertSocialMediaVerification]
	@UserID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 11
    
    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		EXISTS (
			SELECT	UserID
			FROM	UserVerification As UV
					 INNER JOIN
					Verification As V
					  ON UV.VerificationID = V.VerificationID
			WHERE	UV.UserID = @UserID
					 AND
					V.VerificationCategoryID = 3
					 AND
					UV.Active = 1
					 AND
					V.Active = 1
					 AND
					UV.VerificationStatusID = 1 -- 1:confirmed
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
