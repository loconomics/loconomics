/****** Object:  StoredProcedure [dbo].[InsertUserProfilePositions]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[InsertUserProfilePositions]

@UserID int,
@PositionID int,
@LanguageID int,
@CountryID int,
@CancellationPolicyID int,
@Intro varchar(400) = '',
@InstantBooking bit = 0,
@collectPaymentAtBookMeButton bit = 0

AS

DECLARE @ResultMessage varchar(50)

BEGIN TRY

	INSERT INTO userprofilepositions (
		UserID, PositionID, LanguageID, CountryID, CreateDate, UpdatedDate, ModifiedBy, Active, StatusID, PositionIntro, CancellationPolicyID, InstantBooking,
		collectPaymentAtBookMeButton
	) VALUES(
		@UserID,@PositionID,@LanguageID,@CountryID, GETDATE(), GETDATE(), 'sys', 1, 2, @Intro, @CancellationPolicyID, @InstantBooking,
		@collectPaymentAtBookMeButton
	)
	
	-- Check alerts for the position to get its state updated
	EXEC TestAllUserAlerts @UserID, @PositionID

	SELECT  'Success' as Result

END TRY

BEGIN CATCH

 SET @ResultMessage =  ERROR_MESSAGE();

IF @ResultMessage like 'Violation of PRIMARY KEY%'
 
BEGIN

	-- SELECT 'You already have this position loaded' as Result

	IF EXISTS (SELECT * FROM UserProfilePositions WHERE
		UserID = @UserID AND PositionID = @PositionID
		AND LanguageID = @LanguageID AND CountryID = @CountryID
		AND Active = 0) BEGIN
		
		SELECT 'Position could not be added' As Result
		
	END ELSE BEGIN
	
		-- Enable this position and continue, no error
		UPDATE UserProfilePositions
		SET StatusID = 2
			,UpdatedDate = GETDATE()
			,ModifiedBy = 'sys'
			,PositionIntro = @Intro
			,CancellationPolicyID = @CancellationPolicyID
			,InstantBooking = @InstantBooking
			,collectPaymentAtBookMeButton = @collectPaymentAtBookMeButton
		WHERE 
			UserID = @UserID AND PositionID = @PositionID
			AND LanguageID = @LanguageID AND CountryID = @CountryID
			
		-- Check alerts for the position to get its state updated
		EXEC TestAllUserAlerts @UserID, @PositionID

		SELECT  'Success' as Result
	END
END

ELSE
BEGIN

	SELECT 'Sorry, it appears we have an error: ' + @ResultMessage as Result
	
END

END CATCH
 
 

GO
