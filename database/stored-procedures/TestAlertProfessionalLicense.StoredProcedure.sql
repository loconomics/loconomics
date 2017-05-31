/****** Object:  StoredProcedure [dbo].[TestAlertProfessionalLicense]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
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
    SET @i = -1
    WHILE @i < 2 BEGIN
        -- Next loop:
        SET @i = @i + 1
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
            
            Global set of conditions to match to pass the alert (disable the alert):
            IF (
                alertAffectsUser = 0
                 OR
                userHasPosition = 0
                 OR
                -- Has all required licenses
                (
                    countryLevel = 0
                     AND
                    stateProvinceLevel = 0
                     AND
                    countyLevel = 0
                     AND
                    municipalLevel = 0
                )
                 OR
                -- There are no required licenses
                (
                    -- User has almost one license of the required list of licenses (changed on 2013-03-26 issue #203)
                    userLicensesOfEachOptionGroup > 0
                )
            )
         ***/
         
        -- GET RESULT FOR EACH INDIVIDUAL QUERY
         
        -- First ever check if this type of alert affects this type of user
        DECLARE @alertAffectsUser bit
        SET @alertAffectsUser = dbo.fxCheckAlertAffectsUser(@UserID, @AlertID)

        -- Check that user has that position (this is a position related alert). If it has not (=0), alert will off because doesn't affect:
        DECLARE @userHasPosition int
        SELECT @userHasPosition = count(*) FROM userprofilepositions WHERE UserID=@UserID AND PositionID=@PositionID

        -- Check if the user has all the required licenses (can be 0 if 0 are required) 
        -- Check Country-level 
        DECLARE @countryLevel int
        SELECT
            @countryLevel = COUNT(*)
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
            AND C.countryID in (SELECT
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
            P.countryID)
        
        -- Check StateProvince-level 
        DECLARE @stateProvinceLevel int
        SELECT
            @stateProvinceLevel = COUNT(*)
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
                AND SP.stateProvinceID in (SELECT
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
                P.stateProvinceID)
                
        -- Check County-level
        DECLARE @countyLevel int
        SELECT
            @countyLevel = COUNT(*)
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
                AND CT.countyID in (SELECT
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
                P.countyID)
                
        -- Check Municipal-level 
        DECLARE @municipalLevel int
        SELECT
            @municipalLevel = COUNT(*)
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
            AND M.MunicipalityID in (SELECT
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
            P.MunicipalityID)
                
        
        -- If there are no (required) licenses
        DECLARE @userLicensesOfEachOptionGroup int
        SELECT 
            @userLicensesOfEachOptionGroup =
            CASE 
                WHEN COUNT(DISTINCT OptionGroup) <= SUM(
                    CASE
                        WHEN numberVerified > 0 AND OptionGroup is NOT NULL
                        THEN 1
                        ELSE 0
                    END
                )
                THEN 1
                ELSE 0
            END
         FROM
            (
                SELECT
                    JL.OptionGroup
                    ,COUNT(DISTINCT(JL.licenseCertificationID)) as numberOfLicenseOptions
                    ,SUM(CASE WHEN UL.StatusID IN (1, 2, 3, 5, 6) THEN 1 ELSE 0 END) as numberVerified
                FROM
                    (
                        SELECT
                            JL.OptionGroup
                            ,JL.licenseCertificationID
                        FROM
                            JobTitleLicense JL
                        WHERE
                            JL.Required = @IsRequired
                            AND JL.PositionID = @PositionID
                            AND licenseCertificationID in
                            (
                                (
                                SELECT
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
                                    AND C.countryID in
                                    (
                                        SELECT
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
                                            P.countryID
                                    )
                                ) UNION (
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
                                    AND SP.stateProvinceID in
                                    (
                                        SELECT
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
                                            P.stateProvinceID
                                    )
                                ) UNION (
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
                                    AND JL.Active = 1
                                    AND JL.Required = @IsRequired
                                    AND CT.countyID in
                                    (
                                        SELECT
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
                                            AND P.countyID not in ('0','-1')
                                        GROUP BY
                                            P.countyID
                                    )
                                ) UNION (
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
                                    AND M.MunicipalityID in
                                    (
                                        SELECT
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
                                            P.MunicipalityID
                                    )
                                )
                            )
                        GROUP BY
                            JL.OptionGroup
                            ,JL.licenseCertificationID
                    ) as JL
                LEFT JOIN
                (
                    SELECT 
                        V.licenseCertificationID,
                        V.VerificationStatusID as statusID
                    FROM
                        userlicensecertifications As V
                    WHERE
                        V.ProviderUserID = @userID
                         AND
                        V.PositionID = @PositionID
                ) as UL
                ON
                    JL.LicenseCertificationID = UL.LicenseCertificationID
                GROUP BY OptionGroup
            ) as hasAllRequiredLicenses


        -- FINAL CHECK OF CONDITIONS
        IF (
            @alertAffectsUser = 0
             OR
            @userHasPosition = 0
             OR
            -- Has all required licenses
            (
                @countryLevel = 0
                 AND
                @stateProvinceLevel = 0
                 AND
                @countyLevel = 0
                 AND
                @municipalLevel = 0
            )
             OR
            -- There are no required licenses
            (
                -- User has almost one license of the required list of licenses (changed on 2013-03-26 issue #203)
                @userLicensesOfEachOptionGroup > 0
            )
        )
        BEGIN
            -- PASSED: disable alert
            EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 0
        END ELSE BEGIN
            -- NOT PASSED: active alert
            EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 1
        END
    END
    
    -- Test if user profile must be actived or not
    EXEC dbo.TestProfileActivation @UserID, @PositionID
    

END

GO
