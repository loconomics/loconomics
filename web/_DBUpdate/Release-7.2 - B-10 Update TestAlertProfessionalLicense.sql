CREATE PROCEDURE [dbo].[TestAlertProfessionalLicense]
	@UserID int
	,@PositionID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 0
	
	DECLARE @OptionalAlertID int
	SET @OptionalAlertID = 13
	DECLARE @RequiredAlertID int
	SET @RequiredAlertID = 19
	DECLARE @IsRequired bit
	
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
		-- First ever check if this type of alert affects this type of user
		IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
			-- Check that user has that position (this is a position related alert). If it has not (=0), alert will off because doesn't affect:
			(SELECT count(*) FROM userprofilepositions WHERE UserID=@UserID AND PositionID=@PositionID) = 0 OR
			-- Check if the user has all the required licenses (can be 0 if 0 are required)
			(
				SELECT	count(*)
				FROM	jobTitleLicense As PL
						 INNER JOIN
                        [Address] As L
                          ON L.UserID = @UserID
                            AND L.AddressTypeID = 1 -- Only one address with type 1 (home) can exists
                            AND PL.StateProvinceID = L.StateProvinceID
                            AND PL.CountryID = L.CountryID
				WHERE
					PL.[Required] = @IsRequired
					 AND
					PL.PositionID = @PositionID
			) = 0  -- There is no (required) licenses for the position, off alert
			OR
			(
				-- With next subquery, we get all the number of valid license requests
				-- for the user and position
				SELECT	count(*)
				FROM	UserLicenseVerification As UL
						 INNER JOIN
                        [Address] As L
                          ON L.UserID = @UserID
                            AND L.AddressTypeID = 1 -- Only one address with type 1 (home) can exists
                            AND UL.StateProvinceID = L.StateProvinceID
                            AND UL.CountryID = L.CountryID
						 INNER JOIN
						jobTitleLicense As PL
						  ON PL.LicenseCertificationID = UL.LicenseCertificationID
							AND UL.PositionID = PL.PositionID
							AND UL.ProviderUserID = @UserID
							AND UL.StateProvinceID = PL.StateProvinceID
							AND UL.CountryID = PL.CountryID
						 AND
						-- Valid requests to off alert, depending on Status:
						UL.VerificationStatusID IN (1, 2, 3)
				WHERE
					PL.[Required] = @IsRequired
					 AND
					PL.PositionID = @PositionID
			) > 0 -- User has almost one license of the required list of licenses (changed on 2013-03-26 issue #203)
		BEGIN
			-- PASSED: disable alert
			EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 0
		END ELSE BEGIN
			-- NOT PASSED: active alert
			EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 1
		END

		-- Next loop:
		SET @i = @i + 1
	END
	
	-- Test if user profile must be actived or not
	EXEC dbo.TestProfileActivation @UserID, @PositionID
	
	
		/* Old code: In-loop-inside-if check based on UserVerification, that information is not indicative of the required license, OLD CODE:
		 EXISTS (
			SELECT	UserID
			FROM	UserVerification As UV
			WHERE	UV.UserID = @UserID
					 AND
					UV.VerificationID = 13 -- Professional license
					 AND
					UV.Active = 1
					 AND
					UV.VerificationStatusID = 1 -- 1:confirmed
		 )
		*/
END