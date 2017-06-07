/****** Object:  StoredProcedure [dbo].[TestAlertBackgroundCheck]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Modified date: 2013-04-11
-- Description:	Test if the conditions for the
-- alert type 'backgroundcheck' are satisfied, 
-- updating user points and enabling or 
-- disabling it profile.
-- There are 2 alerts for this test:
--  12: backgroundcheck  (optional)
--  18: required-backgroundcheck  (required)
-- Because lookup backgroundacheck tables can
-- be required or not, any required one is 
-- related to the aler 18 and others to the
-- alert 12.
-- FROM DATE 2013-04-11:
-- Alerts will be off when almost a request
-- was done from provider, passing the test
-- request with state 'verified:2' and too
-- 'pending:1' and 'contact us:3; but not 
-- 'rejected/unable to verified:4'.
-- =============================================
CREATE PROCEDURE [dbo].[TestAlertBackgroundCheck]
	@UserID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 0
	
	DECLARE @OptionalAlertID int
	SET @OptionalAlertID = 12
	DECLARE @RequiredAlertID int
	SET @RequiredAlertID = 18
	DECLARE @IsRequired bit
    
    /* Background check must be checked per position, but is not saved
		on userverification per position. This means special treatment,
		and we must too ensure that is enabled only on positions affected
		by background-check according to the table PositionBackgroundCheck.
	   A position can satisfy a required background check if user has
	   already a background check with greater ID.
     */
    DECLARE @cur CURSOR
    DECLARE @PositionID int
    DECLARE @HigherBackgroundCheckID int
    
	SET @cur = CURSOR FOR 
		SELECT DISTINCT
		 PositionID
		FROM
		 UserProfilePositions
		WHERE
	     UserID = @UserID
	     
	OPEN @cur
	FETCH NEXT FROM @cur INTO @PositionID
	WHILE @@FETCH_STATUS = 0 BEGIN
		
		/* Go to a 2-steps loop, first for Optional and second for Required alert.
			allowing only tweak to vars preserving unduplicated the important code
		 */
		DECLARE @i int
		SET @i = 0
		WHILE @i < 2 BEGIN
			-- Setting up loop vars
			IF @i = 0 BEGIN
				-- Setting up vars for Optional
				SET @AlertID = @OptionalAlertID
				SET @IsRequired = 0
			END ELSE IF @i = 1 BEGIN
				-- Setting up vars for Required
				SET @AlertID = @RequiredAlertID
				SET @IsRequired = 1
			END ELSE
				BREAK

			/***
				RUN TEST CODE
			 ***/
			-- Reset var to avoid residual data
			SET @HigherBackgroundCheckID = null
			-- Get the higher background check that this position request for this user
			-- Or the lower background check if is a non-required alert
			SELECT	@HigherBackgroundCheckID = (CASE
						WHEN @IsRequired = 1
						 THEN MAX(PB.BackgroundCheckID)
						WHEN @IsRequired = 0
						 THEN MIN(PB.BackgroundCheckID)
					END)
			FROM	PositionBackgroundCheck As PB
			WHERE	PB.PositionID = @PositionID
				AND PB.[Required] = @IsRequired AND PB.Active = 1
				AND PB.CountryID = (SELECT TOP 1 CountryID FROM vwUsersContactData WHERE UserID = @UserID)
				AND PB.StateProvinceID = (SELECT TOP 1 StateProvinceID FROM vwUsersContactData WHERE UserID = @UserID)	

			-- First ever check if this type of alert affects this type of user
			IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
				-- if there is no a required background check, test passed
				@HigherBackgroundCheckID is null
				 OR
				-- if there is a required background check, check if user
				-- possess this or a greater background check to pass the test
				EXISTS (
					SELECT	UserID
					FROM	UserBackgroundCheck
					WHERE	UserID = @UserID
						-- Valid requests to off alert, depending on Status:
						AND StatusID IN (1, 2, 3)
						AND (
							-- For No-required, must have almost one background check, independently
							-- of is equals or greater, almost one
							@IsRequired = 0
							OR
							-- For required, must have a background check equals or greater than
							-- the higher one required for the position
							BackgroundCheckID >= @HigherBackgroundCheckID
						)
			) BEGIN
				-- PASSED: disable alert
				EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 0
			END ELSE BEGIN
				-- NOT PASSED: active alert
				EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 1
			END
		

			-- Next loop:
			SET @i = @i + 1
		END
		
		-- Next Position
		FETCH NEXT FROM @cur INTO @PositionID
	END
	CLOSE @cur
	DEALLOCATE @cur
	
	-- Test if user profile must be actived or not
	EXEC dbo.TestProfileActivation @UserID
	
			/* Old code: In-loop-inside-if check based on UserVerification; deprecated by a better, more controlled, background check
			EXISTS (
				SELECT	UserID
				FROM	UserVerification As UV
				WHERE	UV.UserID = @UserID
						 AND
						UV.VerificationID = 7
						 AND
						UV.Active = 1
						 AND
						UV.VerificationStatusID = 1 -- 1:confirmed
				*/
END
GO
