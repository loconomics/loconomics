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
                -- Check Country-level 
                (SELECT
                    COUNT(*)
                FROM
                    jobTitleLicense JL
                    INNER JOIN
                    Country C
                    ON JL.countryID = C.countryID
                    LEFT JOIN
                    userLicenseCertifications UL
                    ON JL.LicenseCertificationID = UL.LicenseCertificationID
                    AND UL.ProviderUserID = @userID
                WHERE
                    JL.positionID in (@PositionID, -1) 
                    AND C.languageID = (SELECT PreferredLanguageID FROM users WHERE UserID = @userID)
                    AND C.countryID in ((SELECT
                    P.countryID
                FROM
                    serviceaddress As SA
                     INNER JOIN
                    address As A
                      ON A.AddressID = SA.AddressID
                     INNER JOIN
                    postalcode As P
                    ON A.PostalCodeID = P.PostalCodeID
                WHERE
                    SA.UserID = @userID
                    AND SA.PositionID = @PositionID
                    AND JL.Active = 1
                    AND P.countryID not in ('0','-1')
                    AND JL.Required = @IsRequired
                GROUP BY
                    P.countryID))
                ) = 0 
                -- Check StateProvince-level 
                AND
                (
                SELECT
                    COUNT(*)
                FROM
                    jobTitleLicense JL
                    INNER JOIN
                    StateProvince SP
                    ON JL.stateProvinceID = SP.stateProvinceID
                    LEFT JOIN
                    userLicenseCertifications UL
                    ON JL.LicenseCertificationID = UL.LicenseCertificationID
                    AND UL.ProviderUserID = @userID
                WHERE
                    JL.positionID = @PositionID
                    AND SP.stateProvinceID in ((SELECT
                    P.stateProvinceID
                FROM
                    serviceaddress As SA
                     INNER JOIN
                    address As A
                      ON A.AddressID = SA.AddressID
                     INNER JOIN
                    postalcode As P
                    ON A.PostalCodeID = P.PostalCodeID
                WHERE
                    SA.UserID = @userID
                    AND SA.PositionID = @PositionID
                    AND JL.Active = 1
                    AND P.stateProvinceID not in ('0','-1')
                    AND JL.Required = @IsRequired
                GROUP BY
                    P.stateProvinceID))
                ) = 0 
                -- Check County-level 
                AND
                (
                SELECT
                    COUNT(*)
                FROM
                    jobTitleLicense JL
                    INNER JOIN
                    county CT
                    ON JL.countyID = CT.countyID
                    LEFT JOIN
                    userLicenseCertifications UL
                    ON JL.LicenseCertificationID = UL.LicenseCertificationID
                    AND UL.ProviderUserID = @userID
                WHERE
                    JL.positionID = @PositionID
                    AND CT.countyID in ((SELECT
                    P.countyID
                FROM
                    serviceaddress As SA
                     INNER JOIN
                    address As A
                      ON A.AddressID = SA.AddressID
                     INNER JOIN
                    postalcode As P
                    ON A.PostalCodeID = P.PostalCodeID
                WHERE
                    SA.UserID = @userID
                    AND SA.PositionID = @PositionID
                    AND JL.Active = 1
                    AND P.countyID not in ('0','-1')
                    AND JL.Required = @IsRequired
                GROUP BY
                    P.countyID))
                ) = 0 
                -- Check Municipal-level 
                AND
                ( 
                SELECT
                    COUNT(*)
                FROM
                    jobTitleLicense JL
                    INNER JOIN
                    municipality M
                    ON JL.MunicipalityID = M.MunicipalityID
                    LEFT JOIN
                    userLicenseCertifications UL
                    ON JL.LicenseCertificationID = UL.LicenseCertificationID
                    AND UL.ProviderUserID = @userID
                WHERE
                    JL.positionID = @PositionID
                    AND M.MunicipalityID in ((SELECT
                    P.MunicipalityID
                FROM
                    serviceaddress As SA
                     INNER JOIN
                    address As A
                      ON A.AddressID = SA.AddressID
                     INNER JOIN
                    postalcode As P
                    ON A.PostalCodeID = P.PostalCodeID
                WHERE
                    SA.UserID = @userID
                    AND SA.PositionID = @PositionID
                    AND JL.Active = 1
                    AND P.MunicipalityID not in ('0','-1')
                    AND JL.Required = @IsRequired
                GROUP BY
                    P.MunicipalityID))
                ) = 0
            )  
             -- If there are no (required) licenses for the job title, turn off alert
			OR
			(            
                 SELECT 
                 CASE WHEN COUNT(DISTINCT OptionGroup) <= SUM(CASE WHEN numberVerified > 0 AND OptionGroup is NOT NULL THEN 1 ELSE 0 END) THEN 1 ELSE 0 END
                 FROM
                (SELECT
                    JL.OptionGroup
                    ,COUNT(DISTINCT(JL.licenseCertificationID)) as numberOfLicenseOptions
                    ,SUM(CASE WHEN UL.StatusID IN (1, 2, 3, 5, 6) THEN 1 ELSE 0 END) as numberVerified
                FROM
                (SELECT
                    JL.OptionGroup
                    ,JL.licenseCertificationID
                FROM
                    JobTitleLicense JL
                WHERE
                    JL.Required = @IsRequired
                    AND licenseCertificationID in (
                    (SELECT
                        JL.licenseCertificationID
                    FROM
                        jobTitleLicense JL
                        INNER JOIN
                        Country C
                        ON JL.countryID = C.countryID
                        LEFT JOIN
                        userLicenseCertifications UL
                        ON JL.LicenseCertificationID = UL.LicenseCertificationID
                        AND UL.ProviderUserID = @userID
                    WHERE
                        JL.positionID in (@PositionID, -1) 
                        AND C.languageID = (SELECT PreferredLanguageID FROM users WHERE UserID = @userID)
                        AND C.countryID in ((SELECT
                        P.countryID
                    FROM
                        serviceaddress As SA
                         INNER JOIN
                        address As A
                          ON A.AddressID = SA.AddressID
                         INNER JOIN
                        postalcode As P
                        ON A.PostalCodeID = P.PostalCodeID
                    WHERE
                        SA.UserID = @userID
                        AND SA.PositionID = @PositionID
                        AND JL.Active = 1
                        AND P.countryID not in ('0','-1')
                        AND JL.Required = @IsRequired
                    GROUP BY
                        P.countryID))
                    ),
                    (
                    SELECT
                        JL.licenseCertificationID
                    FROM
                        jobTitleLicense JL
                        INNER JOIN
                        StateProvince SP
                        ON JL.stateProvinceID = SP.stateProvinceID
                        LEFT JOIN
                        userLicenseCertifications UL
                        ON JL.LicenseCertificationID = UL.LicenseCertificationID
                        AND UL.ProviderUserID = @userID
                    WHERE
                        JL.positionID = @PositionID
                        AND SP.stateProvinceID in ((SELECT
                        P.stateProvinceID
                    FROM
                        serviceaddress As SA
                         INNER JOIN
                        address As A
                          ON A.AddressID = SA.AddressID
                         INNER JOIN
                        postalcode As P
                        ON A.PostalCodeID = P.PostalCodeID
                    WHERE
                        SA.UserID = @userID
                        AND SA.PositionID = @PositionID
                        AND JL.Active = 1
                        AND P.stateProvinceID not in ('0','-1')
                        AND JL.Required = @IsRequired
                    GROUP BY
                        P.stateProvinceID))
                    ),
                    (
                    SELECT
                        JL.licenseCertificationID
                    FROM
                        jobTitleLicense JL
                        INNER JOIN
                        county CT
                        ON JL.countyID = CT.countyID
                        LEFT JOIN
                        userLicenseCertifications UL
                        ON JL.LicenseCertificationID = UL.LicenseCertificationID
                        AND UL.ProviderUserID = @userID
                    WHERE
                        JL.positionID = @PositionID
                        AND CT.countyID in ((SELECT
                        P.countyID
                    FROM
                        serviceaddress As SA
                         INNER JOIN
                        address As A
                          ON A.AddressID = SA.AddressID
                         INNER JOIN
                        postalcode As P
                        ON A.PostalCodeID = P.PostalCodeID
                    WHERE
                        SA.UserID = @userID
                        AND SA.PositionID = @PositionID
                        AND JL.Active = 1
                        AND P.countyID not in ('0','-1')
                        AND JL.Required = @IsRequired
                    GROUP BY
                        P.countyID))
                    ),
                    ( 
                    SELECT
                        JL.licenseCertificationID
                    FROM
                        jobTitleLicense JL
                        INNER JOIN
                        municipality M
                        ON JL.MunicipalityID = M.MunicipalityID
                        LEFT JOIN
                        userLicenseCertifications UL
                        ON JL.LicenseCertificationID = UL.LicenseCertificationID
                        AND UL.ProviderUserID = @userID
                    WHERE
                        JL.positionID = @PositionID
                        AND M.MunicipalityID in ((SELECT
                        P.MunicipalityID
                    FROM
                        serviceaddress As SA
                         INNER JOIN
                        address As A
                          ON A.AddressID = SA.AddressID
                         INNER JOIN
                        postalcode As P
                        ON A.PostalCodeID = P.PostalCodeID
                    WHERE
                        SA.UserID = @userID
                        AND SA.PositionID = @PositionID
                        AND JL.Active = 1
                        AND P.MunicipalityID not in ('0','-1')
                        AND JL.Required = @IsRequired
                    GROUP BY
                        P.MunicipalityID))
                    ))
                    GROUP BY
                        JL.OptionGroup
                        ,JL.licenseCertificationID) as JL
                    LEFT JOIN    	
                (SELECT 
                    V.licenseCertificationID,
                    V.VerificationStatusID as statusID
                FROM
                    userlicensecertifications As V
                WHERE
                    V.ProviderUserID = @userID
                     AND
                    V.PositionID = @PositionID) as UL
                ON
                    JL.LicenseCertificationID = UL.LicenseCertificationID
                GROUP BY 
                    OptionGroup) as hasAllRequiredLicenses
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