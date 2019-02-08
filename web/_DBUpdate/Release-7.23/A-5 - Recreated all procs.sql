-- CheckUserEmail.sql

-- =============================================
-- Author:		<Author,,Name>
-- Create date: <Create Date,,>
-- Description:	<Description,,>
-- =============================================
ALTER PROCEDURE dbo.CheckUserEmail
	-- Add the parameters for the stored procedure here
	@Email nvarchar(56)
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    SELECT Email FROM UserProfile WHERE LOWER(Email) = LOWER(@Email)





END
GO
-- CreateCustomer.sql

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 16/04/2012
-- Description:	Create a Loconomics User as
-- only Customer profile and minimum information
-- (from the Register page or Facebook Login).
-- =============================================
ALTER PROCEDURE [dbo].[CreateCustomer]
	-- Add the parameters for the stored procedure here

		@UserID int,
		@Firstname varchar(45),
        @Lastname varchar(145),
		@Lang nvarchar(42),
		@CountryCode nvarchar(2),
        @GenderID int = -1,
		@PublicBio varchar(500) = null,
		@Phone varchar(20) = null
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    INSERT INTO dbo.users (
		UserID,
		FirstName,
		LastName,
		MiddleIn,
		SecondLastName,
		GenderID,
		PreferredLanguage,
		SignupCountryCode,
		PublicBio,
		IsProvider,
		IsCustomer,
		MobilePhone,
		CreatedDate,
		UpdatedDate,
		ModifiedBy,
		Active,
		TrialEndDate
	) VALUES (
		@UserID,
		@Firstname,
		@Lastname,
		'',
		'',
		coalesce(@GenderID, -1),
		@Lang,
		@CountryCode,
		@PublicBio,
		0,
		1,
		@Phone,
		GETDATE(),
		GETDATE(),
		'SYS',
		1,
		DATEADD(DAY, 14, SYSDATETIMEOFFSET())
	)

	-- Check alerts for the user to get its state updated
	EXEC TestAllUserAlerts @UserID
END

GO
-- DeleteUser.sql



/* CAUTION!
 * Delete all data from an user
 * account
 * TODO: need be update with all
 * the tables (calendar, pricing, etc.)
 */
-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 17/04/2012
-- Description:	Delete all data from an user
-- account
-- TODO: need be update with all
-- the tables (calendar, pricing, etc.)
-- =============================================
ALTER PROCEDURE [dbo].[DeleteUser]
	(
	@UserId int
	)
AS
	SET NOCOUNT ON

DELETE PPD
FROM providerpackagedetail PPD
INNER JOIN providerpackage PP
ON PP.ProviderPackageID = PPD.ProviderPackageID
AND (PP.ProviderUserID = @UserId OR PP.visibleToClientID = @UserId)

DELETE
FROM providerpackage
WHERE ProviderUserID = @UserId OR VisibleToClientID = @UserId

delete
FROM	CalendarProviderAttributes
WHERE userid = @UserID

delete
FROM			UserAlert
WHERE userid = @UserID

delete
FROM            UserLicenseCertifications
where provideruserid =  @UserId

delete
from	userstats
where userid = @userid

delete
from userbackgroundcheck
where userid = @userid

delete
from	serviceaddress
where addressid IN (
	select addressid
	from [address]
	where userid = @userid
)

delete
from	address
where userid = @userid

delete
from			booking
where clientuserid = @userid or serviceprofessionaluserid = @userid

delete
from			ServiceProfessionalClient
where clientuserid = @userid or serviceprofessionaluserid = @userid

delete
from			[messages]
where threadid IN (
	select threadid
	from messagingthreads
	where customeruserid = @userid or provideruserid = @userid
)

delete
FROM            messagingthreads
where provideruserid =  @UserId OR customeruserid = @UserID

delete
FROM            providerpaymentpreference
where provideruserid =  @UserId

delete
FROM            usereducation
where userid =  @UserId

delete
FROM            userreviews
where provideruserid =  @UserId OR customeruserId = @UserId

delete
FROM            providertaxform
where provideruserid =  @UserId

delete
FROM            userverification
where userid =  @UserId

delete
FROM            userprofileserviceattributes
where userid =  @UserId

delete
FROM			UserSolution
where userid =  @UserId

delete
FROM            userprofilepositions
where userid =  @UserId

delete
FROM            CCCUsers
where userid =  @UserId

delete
FROM            userprofile
where userid =  @UserId

delete
FROM            users
where userid = @UserId

delete
FROM            webpages_usersinroles
where userid =  @UserId

delete
FROM            webpages_oauthmembership
where userid =  @UserId

delete
FROM            webpages_membership
where userid = @UserId

delete
FROM            webpages_facebookcredentials
where userid = @UserId



GO
-- DeleteUserPosition.sql

ALTER PROCEDURE DeleteUserPosition (
	@UserID int,
	@PositionID int
) AS BEGIN

delete from [ServiceAttributeLanguageLevel]
where userid = @UserID AND PositionID = @PositionID

delete from ServiceAttributeExperienceLevel
where userid = @UserID AND PositionID = @PositionID

delete from userprofileserviceattributes
where userid = @UserID AND PositionID = @PositionID

delete from userprofilepositions
where userid = @UserID AND PositionID = @PositionID

END
GO
-- DelUserVerification.sql

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2013-07-15
-- Description:	Delete a user-verification
-- record, if there is one.
-- =============================================
ALTER PROCEDURE DelUserVerification
	@UserID int,
	@VerificationID int,
    @PositionID int = 0
AS
BEGIN
	DELETE FROM userverification
	WHERE UserID = @UserID
		AND VerificationID = @VerificationID
        AND PositionID = @PositionID
END
GO
-- GetUserCalendarProviderAttributes.sql


ALTER PROC [dbo].[GetUserCalendarProviderAttributes]

@UserID int


as

SELECT AdvanceTime,MinTime,MaxTime,BetweenTime,UseCalendarProgram,CalendarType,CalendarURL, PrivateCalendarToken, IncrementsSizeInMinutes
FROM CalendarProviderAttributes
WHERE UserID = @UserID
GO
-- InsertUserProfilePositions.sql

ALTER PROC [dbo].[InsertUserProfilePositions]

@UserID int,
@PositionID int,
@Language nvarchar(42),
@CancellationPolicyID int,
@Intro varchar(400) = '',
@InstantBooking bit = 0,
@collectPaymentAtBookMeButton bit = 0,
@title nvarchar(50)

AS

DECLARE @ResultMessage varchar(50)
DECLARE @userListingID int

BEGIN TRY

	INSERT INTO userprofilepositions (
		UserID, PositionID, Language, CreateDate, UpdatedDate, ModifiedBy, Active, StatusID, PositionIntro, CancellationPolicyID, InstantBooking,
		collectPaymentAtBookMeButton, Title
	) VALUES(
		@UserID,@PositionID,@Language, GETDATE(), GETDATE(), 'sys', 1, 2, @Intro, @CancellationPolicyID, @InstantBooking,
		@collectPaymentAtBookMeButton, @title
	)

	SET @userListingID = @@Identity

	-- Check alerts for the position to get its state updated
	EXEC TestAllUserAlerts @UserID, @PositionID

	SELECT 'Success' as Result, @userListingID as userListingID

END TRY

BEGIN CATCH

 SET @ResultMessage =  ERROR_MESSAGE();

-- TODO This needs refactor, since this error never happens now since userListingID exists
-- (may be different message per unique index on positionID) may be the source of the issue #840
IF @ResultMessage like 'Violation of PRIMARY KEY%'

BEGIN

	-- SELECT 'You already have this position loaded' as Result

	IF EXISTS (SELECT * FROM UserProfilePositions WHERE
		UserID = @UserID AND PositionID = @PositionID
		AND Language = @Language
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
			AND Language = @Language

		-- Check alerts for the position to get its state updated
		EXEC TestAllUserAlerts @UserID, @PositionID

		SELECT @userListingID = userListingID FROM UserProfilePositions
		WHERE
			UserID = @UserID AND PositionID = @PositionID
			AND Language = @Language

		SELECT 'Success' as Result, @userListingID as userListingID
	END
END

ELSE
BEGIN

	SELECT 'Sorry, it appears we have an error: ' + @ResultMessage as Result

END

END CATCH

GO
-- SetCalendarProviderAttributes.sql


-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2014-02-12
-- Description:	It sets (insert or update) the
-- given calendar attributes for the provider,
-- each field is optional to be set, if null is
-- given, current db value is preserved.
--
-- NOTE: minTime and maxTime fields are being
-- gradually removed, firstly from user use and
-- later totally from code and db #279.
-- This proc doesn't provide way to set both of
-- that since code is not using it already.
-- NOTE: with standard iCal support, fields
-- UseCalendarProgram and CalendarType gets
-- unused, with fixed values of 1 and ''.
-- =============================================
ALTER PROC [dbo].[SetCalendarProviderAttributes] (
	@UserID int,
	@AdvanceTime decimal(10, 2),
	@BetweenTime decimal(10, 2),
	@CalendarURL varchar(500),
	@PrivateCalendarToken varchar(128),
	@IncrementsSizeInMinutes int = null
) AS BEGIN

	IF EXISTS (SELECT * FROM CalendarProviderAttributes WHERE UserID = @UserID)

        UPDATE CalendarProviderAttributes SET
			AdvanceTime = coalesce(@AdvanceTime, AdvanceTime),
            BetweenTime = coalesce(@BetweenTime, BetweenTime),
            CalendarURL = coalesce(@CalendarURL, CalendarURL),
            PrivateCalendarToken = dbo.fx_IfNW(@PrivateCalendarToken, PrivateCalendarToken),
            IncrementsSizeInMinutes = coalesce(@IncrementsSizeInMinutes, IncrementsSizeInMinutes)

            -- Deprecated fields, to be removed:
            ,CalendarType = ''
            ,UseCalendarProgram = 1
         WHERE UserID = @UserID

	ELSE

		INSERT INTO CalendarProviderAttributes (
			UserID,
			AdvanceTime,
			BetweenTime,
			CalendarURL,
			PrivateCalendarToken,
			IncrementsSizeInMinutes

			-- Deprecated fields, to be removed:
			,CalendarType
			,UseCalendarProgram
			,MinTime
			,MaxTime
		) VALUES (
			@UserID,
			coalesce(@AdvanceTime, 0),
			coalesce(@BetweenTime, 0),
			@CalendarURL,
			@PrivateCalendarToken,
			@IncrementsSizeInMinutes

			-- Deprecated fields
			,''
			,1
			,0
			,0
		)

END
GO
-- SetUserAlert.sql

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Allow active or disactive
--  (remove) an alert for an user and position
--  (PositionID=0 for alerts not related with
--  a position), with current Date-Time.
--
-- =============================================
ALTER PROCEDURE [dbo].[SetUserAlert]
	@UserID int
	,@PositionID int
	,@AlertID int
	,@Active bit
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    IF @Active = 1 BEGIN
		UPDATE UserAlert WITH (Serializable) SET
			Active = 1,
			UpdatedDate = getdate(),
			ModifiedBy = 'sys'
		WHERE
			UserID = @UserID
			 AND
			PositionID = @PositionID
			 AND
			AlertID = @AlertID

		IF @@RowCount = 0
			INSERT INTO UserAlert (
				UserID, PositionID, AlertID, CreatedDate, UpdatedDate,
				ModifiedBy, Active
			) VALUES (
				@UserID, @PositionID, @AlertID, getdate(), getdate(),
				'sys', 1
			)

    END ELSE BEGIN
		DELETE FROM UserAlert
		WHERE UserID = @UserID AND PositionID = @PositionID
			AND AlertID = @AlertID
    END
END
GO
-- SetUserVerification.sql

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-07-17
-- Description:	Inserts or update a user
-- verification record.
-- =============================================
ALTER PROCEDURE [dbo].[SetUserVerification]
	@UserID int
	,@VerificationID int
	,@VerifiedDate datetime
	,@VerificationStatusID int
	,@PositionID int = 0
AS
BEGIN
    UPDATE UserVerification WITH (serializable) SET
        UpdatedDate = getdate(),
        VerifiedBy = 'sys',
        LastVerifiedDate = @VerifiedDate,
        Active = 1,
        VerificationStatusID = @VerificationStatusID,
        PositionID = @PositionID
    WHERE
        UserID = @UserID
         AND
        VerificationID = @VerificationID

    IF @@rowcount = 0 BEGIN
        INSERT INTO UserVerification (
            UserID, VerificationID, DateVerified, CreatedDate,
            UpdatedDate, VerifiedBy, LastVerifiedDate, Active, VerificationStatusID
        ) VALUES (
            @UserID, @VerificationID, @VerifiedDate, getdate(), getdate(), 'sys', getdate(), 1, @VerificationStatusID
        )
    END
END
GO
-- sp_MSforeach_worker.sql




ALTER PROC [dbo].[sp_MSforeach_worker]
	@command1 nvarchar(2000), @replacechar nchar(1) = N'?', @command2 nvarchar(2000) = null, @command3 nvarchar(2000) = null, @worker_type int =1
as

	create table #qtemp (	/* Temp command storage */
		qnum				int				NOT NULL,
		qchar				nvarchar(2000)	COLLATE database_default NULL
	)

	set nocount on
	declare @name nvarchar(517), @namelen int, @q1 nvarchar(2000), @q2 nvarchar(2000)
   declare @q3 nvarchar(2000), @q4 nvarchar(2000), @q5 nvarchar(2000)
	declare @q6 nvarchar(2000), @q7 nvarchar(2000), @q8 nvarchar(2000), @q9 nvarchar(2000), @q10 nvarchar(2000)
	declare @cmd nvarchar(2000), @replacecharindex int, @useq tinyint, @usecmd tinyint, @nextcmd nvarchar(2000)
   declare @namesave nvarchar(517), @nametmp nvarchar(517), @nametmp2 nvarchar(258)

	declare @local_cursor cursor
	if @worker_type=1
		set @local_cursor = hCForEachDatabase
	else
		set @local_cursor = hCForEachTable

	open @local_cursor
	fetch @local_cursor into @name

	while (@@fetch_status >= 0) begin

      select @namesave = @name
		select @useq = 1, @usecmd = 1, @cmd = @command1, @namelen = datalength(@name)
		while (@cmd is not null) begin		/* Generate @q* for exec() */
			select @replacecharindex = charindex(@replacechar, @cmd)
			while (@replacecharindex <> 0) begin

            /* 7.0, if name contains ' character, and the name has been single quoted in command, double all of them in dbname */
            /* if the name has not been single quoted in command, do not doulbe them */
            /* if name contains ] character, and the name has been [] quoted in command, double all of ] in dbname */
            select @name = @namesave
            select @namelen = datalength(@name)
            declare @tempindex int
            if (substring(@cmd, @replacecharindex - 1, 1) = N'''') begin
               /* if ? is inside of '', we need to double all the ' in name */
               select @name = REPLACE(@name, N'''', N'''''')
            end else if (substring(@cmd, @replacecharindex - 1, 1) = N'[') begin
               /* if ? is inside of [], we need to double all the ] in name */
               select @name = REPLACE(@name, N']', N']]')
            end else if ((@name LIKE N'%].%]') and (substring(@name, 1, 1) = N'[')) begin
               /* ? is NOT inside of [] nor '', and the name is in [owner].[name] format, handle it */
               /* !!! work around, when using LIKE to find string pattern, can't use '[', since LIKE operator is treating '[' as a wide char */
               select @tempindex = charindex(N'].[', @name)
               select @nametmp  = substring(@name, 2, @tempindex-2 )
               select @nametmp2 = substring(@name, @tempindex+3, len(@name)-@tempindex-3 )
               select @nametmp  = REPLACE(@nametmp, N']', N']]')
               select @nametmp2 = REPLACE(@nametmp2, N']', N']]')
               select @name = N'[' + @nametmp + N'].[' + @nametmp2 + ']'
            end else if ((@name LIKE N'%]') and (substring(@name, 1, 1) = N'[')) begin
               /* ? is NOT inside of [] nor '', and the name is in [name] format, handle it */
               /* j.i.c., since we should not fall into this case */
               /* !!! work around, when using LIKE to find string pattern, can't use '[', since LIKE operator is treating '[' as a wide char */
               select @nametmp = substring(@name, 2, len(@name)-2 )
               select @nametmp = REPLACE(@nametmp, N']', N']]')
               select @name = N'[' + @nametmp + N']'
            end
            /* Get the new length */
            select @namelen = datalength(@name)

            /* start normal process */
				if (datalength(@cmd) + @namelen - 1 > 2000) begin
					/* Overflow; put preceding stuff into the temp table */
					if (@useq > 9) begin
						close @local_cursor
						if @worker_type=1
							deallocate hCForEachDatabase
						else
							deallocate hCForEachTable
						return 1
					end
					if (@replacecharindex < @namelen) begin
						/* If this happened close to beginning, make sure expansion has enough room. */
						/* In this case no trailing space can occur as the row ends with @name. */
						select @nextcmd = substring(@cmd, 1, @replacecharindex)
						select @cmd = substring(@cmd, @replacecharindex + 1, 2000)
						select @nextcmd = stuff(@nextcmd, @replacecharindex, 1, @name)
						select @replacecharindex = charindex(@replacechar, @cmd)
						insert #qtemp values (@useq, @nextcmd)
						select @useq = @useq + 1
						continue
					end
					/* Move the string down and stuff() in-place. */
					/* Because varchar columns trim trailing spaces, we may need to prepend one to the following string. */
					/* In this case, the char to be replaced is moved over by one. */
					insert #qtemp values (@useq, substring(@cmd, 1, @replacecharindex - 1))
					if (substring(@cmd, @replacecharindex - 1, 1) = N' ') begin
						select @cmd = N' ' + substring(@cmd, @replacecharindex, 2000)
						select @replacecharindex = 2
					end else begin
						select @cmd = substring(@cmd, @replacecharindex, 2000)
						select @replacecharindex = 1
					end
					select @useq = @useq + 1
				end
				select @cmd = stuff(@cmd, @replacecharindex, 1, @name)
				select @replacecharindex = charindex(@replacechar, @cmd)
			end

			/* Done replacing for current @cmd.  Get the next one and see if it's to be appended. */
			select @usecmd = @usecmd + 1
			select @nextcmd = case (@usecmd) when 2 then @command2 when 3 then @command3 else null end
			if (@nextcmd is not null and substring(@nextcmd, 1, 2) = N'++') begin
				insert #qtemp values (@useq, @cmd)
				select @cmd = substring(@nextcmd, 3, 2000), @useq = @useq + 1
				continue
			end

			/* Now exec() the generated @q*, and see if we had more commands to exec().  Continue even if errors. */
			/* Null them first as the no-result-set case won't. */
			select @q1 = null, @q2 = null, @q3 = null, @q4 = null, @q5 = null, @q6 = null, @q7 = null, @q8 = null, @q9 = null, @q10 = null
			select @q1 = qchar from #qtemp where qnum = 1
			select @q2 = qchar from #qtemp where qnum = 2
			select @q3 = qchar from #qtemp where qnum = 3
			select @q4 = qchar from #qtemp where qnum = 4
			select @q5 = qchar from #qtemp where qnum = 5
			select @q6 = qchar from #qtemp where qnum = 6
			select @q7 = qchar from #qtemp where qnum = 7
			select @q8 = qchar from #qtemp where qnum = 8
			select @q9 = qchar from #qtemp where qnum = 9
			select @q10 = qchar from #qtemp where qnum = 10
			truncate table #qtemp
			exec (@q1 + @q2 + @q3 + @q4 + @q5 + @q6 + @q7 + @q8 + @q9 + @q10 + @cmd)
			select @cmd = @nextcmd, @useq = 1
		end
    fetch @local_cursor into @name
	end /* while FETCH_SUCCESS */
	close @local_cursor
	if @worker_type=1
		deallocate hCForEachDatabase
	else
		deallocate hCForEachTable

	return 0


GO
-- sp_MSforeachtable.sql


ALTER PROC [dbo].[sp_MSforeachtable]
	@command1 nvarchar(2000), @replacechar nchar(1) = N'?', @command2 nvarchar(2000) = null,
  @command3 nvarchar(2000) = null, @whereand nvarchar(2000) = null,
	@precommand nvarchar(2000) = null, @postcommand nvarchar(2000) = null
AS
	declare @mscat nvarchar(12)
	select @mscat = ltrim(str(convert(int, 0x0002)))
	if (@precommand is not null)
		exec(@precommand)
   exec(N'declare hCForEachTable cursor global for select ''['' + REPLACE(schema_name(syso.schema_id), N'']'', N'']]'') + '']'' + ''.'' + ''['' + REPLACE(object_name(o.id), N'']'', N'']]'') + '']'' from dbo.sysobjects o join sys.all_objects syso on o.id = syso.object_id '
         + N' where OBJECTPROPERTY(o.id, N''IsUserTable'') = 1 ' + N' and o.category & ' + @mscat + N' = 0 '
         + @whereand)
	declare @retval int
	select @retval = @@error
	if (@retval = 0)
		exec @retval = dbo.sp_MSforeach_worker @command1, @replacechar, @command2, @command3, 0
	if (@retval = 0 and @postcommand is not null)
		exec(@postcommand)
	return @retval

GO
-- TestAlertAvailability.sql

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'availability' are satisfied,
-- updating user alert and enabling or
-- disabling it profile.
-- =============================================
ALTER PROCEDURE [dbo].[TestAlertAvailability]
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
-- TestAlertBackgroundCheck.sql

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
ALTER PROCEDURE [dbo].[TestAlertBackgroundCheck]
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
-- TestAlertBasicInfoVerification.sql

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'basicinfoverification' are satisfied,
-- updating user points and enabling or
-- disabling it profile.
-- =============================================
ALTER PROCEDURE [dbo].[TestAlertBasicInfoVerification]
	@UserID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 10

    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		3 = ( -- 3 Verifications being checked (1, 2, 4)
			SELECT	count(*)
			FROM	UserVerification As UV
			WHERE	UV.UserID = @UserID
					 AND
					UV.VerificationID IN (1, 2, 4)
					 AND
					UV.Active = 1
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
-- TestAlertEducation.sql

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2013-06-12
-- Description:	Test if the conditions for the
-- alert type 'add-education' are satisfied,
-- updating user points and enabling or
-- disabling it profile.
-- =============================================
ALTER PROCEDURE [dbo].[TestAlertEducation]
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
-- TestAlertLocation.sql

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'location' are satisfied,
-- updating user points and enabling or
-- disabling it profile.
-- =============================================
ALTER PROCEDURE [dbo].[TestAlertLocation]
	@UserID int
	,@PositionID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 16

    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		-- Check that user has that position (this is a position related alert). If it has not (=0), alert will off because doesn't affect:
		(SELECT count(*) FROM userprofilepositions WHERE UserID=@UserID AND PositionID=@PositionID) = 0 OR
		EXISTS (SELECT AddressID FROM ServiceAddress
	WHERE UserID = @UserID
		AND PositionID = @PositionID
		AND ( -- Must have almost one address to perfor work Or from it travel
			ServicesPerformedAtLocation = 1
			 OR
			TravelFromLocation = 1
		)
		AND Active = 1
	) BEGIN
		-- PASSED: disable alert
		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 0
	END ELSE BEGIN
		-- NOT PASSED: active alert
		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 1
	END

	-- Test if user profile must be actived or not
	EXEC dbo.TestProfileActivation @UserID, @PositionID
END
GO
-- TestAlertPayment.sql


-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'payment' are satisfied,
-- updating user points and enabling or
-- disabling it profile.
-- =============================================
ALTER PROCEDURE [dbo].[TestAlertPayment]
	@UserID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 5

	DECLARE @hasInstantBooking bit
	IF (SELECT sum(Cast(InstantBooking as int)) FROM userprofilepositions WHERE userID = @UserID) > 0
	BEGIN
		SET @hasInstantBooking = 1
	END

    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		@hasInstantBooking = Cast(0 as bit) OR
		/* Marketplace Way */
		dbo.isMarketplacePaymentAccountActive(@UserID) = Cast(1 as bit)
	BEGIN
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
-- TestAlertPersonalInfo.sql

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
-- TestAlertPhoto.sql

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'photo' are satisfied,
-- updating user points and enabling or
-- disabling it profile.
-- =============================================
ALTER PROCEDURE [dbo].[TestAlertPhoto]
	@UserID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 4

    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		EXISTS (SELECT UserID FROM Users
	WHERE UserID = @UserID
		AND dbo.fx_IfNW(Photo, null) is not null
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
-- TestAlertPositionServices.sql

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'positionservices' are satisfied,
-- updating user points and enabling or
-- disabling it profile.
-- =============================================
ALTER PROCEDURE [dbo].[TestAlertPositionServices]
	@UserID int,
	@PositionID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 8

	DECLARE @CATS TABLE (CatID int)

	INSERT INTO @CATS (CatID)
	SELECT DISTINCT A.ServiceAttributeCategoryID
	FROM ServiceAttributeCategory As A
		  INNER JOIN
		 ServiceCategoryPositionAttribute As B
		   ON A.ServiceAttributeCategoryID = B.ServiceAttributeCategoryID
			AND B.PositionID = @PositionID
	WHERE A.RequiredInput = 1
		AND A.Active = 1
		AND B.Active = 1

    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		-- Check that user has that position (this is a position related alert). If it has not (=0), alert will off because doesn't affect:
		(SELECT count(*) FROM userprofilepositions WHERE UserID=@UserID AND PositionID=@PositionID) = 0 OR
		-- Check all required data
		-- Must have almost one service attribute selected
		-- per required category for the position
		@PositionID = 0
		OR (SELECT count(*) FROM (SELECT A.ServiceAttributeCategoryID
		FROM userprofileserviceattributes As A
		 INNER JOIN
		ServiceCategoryPositionAttribute As B
		  ON A.ServiceAttributeCategoryID = B.ServiceAttributeCategoryID
		   AND A.ServiceAttributeID = B.ServiceAttributeID
		  -- We only check the 'RequiredInput' Categories
		   AND B.ServiceAttributeCategoryID IN (SELECT CatID FROM @CATS)
		WHERE A.UserID = @UserID AND A.PositionID = @PositionID
			AND A.Active = 1 AND B.Active = 1
		GROUP BY A.ServiceAttributeCategoryID
	) As Z) = (SELECT count(*) FROM @CATS)
	BEGIN
		--PRINT 'you''re cool!'
		-- PASSED: disable alert
		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 0
	END ELSE BEGIN
		--PRINT 'buuuhhhh!'
		-- NOT PASSED: active alert
		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 1
	END

	-- Test if user profile must be actived or not
	EXEC dbo.TestProfileActivation @UserID, @PositionID
END
GO
-- TestAlertPricingDetails.sql


ALTER PROCEDURE [dbo].[TestAlertPricingDetails]
	@UserID int,
	@PositionID int
AS
BEGIN


	SET NOCOUNT ON;
	DECLARE @AlertID int
	SET @AlertID = 1


    IF	dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR

		(SELECT count(*) FROM userprofilepositions WHERE UserID=@UserID AND PositionID=@PositionID) = 0 OR


		EXISTS (SELECT * FROM ProviderPackage
			WHERE ProviderUserID = @UserID
				AND PositionID = @PositionID
				AND Active = 1
		)

		BEGIN

		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 0
	END ELSE BEGIN

		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 1
	END


	EXEC dbo.TestProfileActivation @UserID, @PositionID
END
GO
-- TestAlertProfessionalLicense.sql

ALTER PROCEDURE [dbo].[TestAlertProfessionalLicense]
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
                                    AND C.language = (SELECT PreferredLanguage FROM users WHERE UserID = @userID)
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
-- TestAlertPublicBio.sql

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'publicbio' are satisfied,
-- updating user points and enabling or
-- disabling it profile.
-- =============================================
ALTER PROCEDURE [dbo].[TestAlertPublicBio]
	@UserID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 9

    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		EXISTS (
			SELECT UserID
			FROM Users
			WHERE UserID = @UserID
				AND dbo.fx_IfNW(PublicBio, null) is not null
				--AND GenderID > 0
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
-- TestAlertReferenceRequests.sql

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'referencerequests' are satisfied,
-- updating user points and enabling or
-- disabling it profile.
-- =============================================
ALTER PROCEDURE [dbo].[TestAlertReferenceRequests]
	@UserID int
	,@PositionID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 14

    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		-- Check that user has that position (this is a position related alert). If it has not (=0), alert will off because doesn't affect:
		(SELECT count(*) FROM userprofilepositions WHERE UserID=@UserID AND PositionID=@PositionID) = 0 OR
		EXISTS (
			SELECT	UserID
			FROM	UserVerification As UV
			WHERE	UV.UserID = @UserID
					 AND
					UV.VerificationID = 12 -- Reference(s) from former clients
				    -- Only 12, 11 is for 'Loconomics' user-reviewed' out of this alert.
					 AND
					UV.Active = 1
					 AND
					-- Check for verifications: 1:confirmed, 2:pending
					-- Pending is enough because means a request done by
					-- provider, and this alert is just for the request not
					-- require confirmations (but confirmation do the work, too)
					UV.VerificationStatusID IN (1, 2)
					 AND
					(
					 -- Its verification for this position..
					 UV.PositionID = @PositionID
					  OR
					 -- or is verification for 'any' position
					 UV.PositionID = 0
					)

	) BEGIN
		-- PASSED: disable alert
		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 0
	END ELSE BEGIN
		-- NOT PASSED: active alert
		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 1
	END

	-- Test if user profile must be actived or not
	EXEC dbo.TestProfileActivation @UserID, @PositionID
END
GO
-- TestAlertShowcaseWork.sql


-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'showcasework' are satisfied,
-- updating user points and enabling or
-- disabling it profile.
-- =============================================
ALTER PROCEDURE [dbo].[TestAlertShowcaseWork]
	@UserID int
	,@PositionID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 17

    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		-- Check that user has that position (this is a position related alert). If it has not (=0), alert will off because doesn't affect:
		(SELECT count(*) FROM userprofilepositions WHERE UserID=@UserID AND PositionID=@PositionID) = 0 OR
		EXISTS (SELECT ProviderServicePhotoID FROM ProviderServicePhoto
	WHERE UserID = @UserID
		AND PositionID = @PositionID
		-- Must be almost one photo with address, caption and must be primary photo (to avoid provider has photos but not one chosed as primary)
		AND dbo.fx_IfNW(PhotoAddress, null) is not null
		AND IsPrimaryPhoto = 1
		AND Active = 1
	) BEGIN
		-- PASSED: disable alert
		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 0
	END ELSE BEGIN
		-- NOT PASSED: active alert
		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 1
	END

	-- Test if user profile must be actived or not
	EXEC dbo.TestProfileActivation @UserID, @PositionID
END
GO
-- TestAlertSocialMediaVerification.sql

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'socialmediaverification' are satisfied,
-- updating user points and enabling or
-- disabling it profile.
-- =============================================
ALTER PROCEDURE [dbo].[TestAlertSocialMediaVerification]
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
-- TestAlertTaxDocs.sql

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'taxdocs' are satisfied,
-- updating user points and enabling or
-- disabling it profile.
-- =============================================
ALTER PROCEDURE [dbo].[TestAlertTaxDocs]
	@UserID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 6

    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		EXISTS (SELECT ProviderUserID FROM ProviderTaxForm
	WHERE ProviderUserID = @UserID
		AND dbo.fx_IfNW(FullName, null) is not null
		AND dbo.fx_IfNW(StreetApt, null) is not null
		AND dbo.fx_IfNW(City, null) is not null
		AND dbo.fx_IfNW(PostalCodeID, null) is not null
		AND dbo.fx_IfNW(StateProvinceID, null) is not null
		AND dbo.fx_IfNW(CountryID, null) is not null
		AND dbo.fx_IfNW([Signature], null) is not null
		AND dbo.fx_IfNW(TINTypeID, null) is not null
		AND dbo.fx_IfNW(DateTimeSubmitted, null) is not null
		AND dbo.fx_IfNW(LastThreeTINDigits, null) is not null
		AND (
		 TaxEntityTypeID = 1
		  OR
		 dbo.fx_IfNW(BusinessName, null) is not null
		)
		AND Active = 1
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
-- TestAlertVerifyEmail.sql

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-07-17
-- Description:	Test if the conditions for the
-- alert type 'verifyemail' are satisfied,
-- updating user points and enabling or
-- disabling it profile.
-- =============================================
ALTER PROCEDURE [dbo].[TestAlertVerifyEmail]
	@UserID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 15

    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		EXISTS (SELECT UserID FROM webpages_Membership
	WHERE UserID = @UserID
		AND ConfirmationToken is null
		AND IsConfirmed = 1
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
-- TestAllUserAlerts.sql


ALTER PROCEDURE [dbo].[TestAllUserAlerts]
	@UserID int
	,@PositionID int = 0
AS
BEGIN


	SET NOCOUNT ON;
    EXEC TestAlertPersonalInfo				@UserID
    EXEC TestAlertPhoto						@UserID
    EXEC TestAlertPayment					@UserID

	EXEC TestAlertAvailability				@UserID
	EXEC TestAlertSocialMediaVerification	@UserID
	EXEC TestAlertBackgroundCheck			@UserID
	EXEC TestAlertBasicInfoVerification		@UserID
	EXEC TestAlertVerifyEmail				@UserID
	EXEC TestAlertPublicBio					@UserID
	EXEC TestAlertEducation					@UserID

    IF @PositionID = 0 BEGIN
		DECLARE @cur CURSOR
		SET @cur = CURSOR FOR
			SELECT DISTINCT
			 PositionID
			FROM
			 UserProfilePositions
			WHERE
		     UserID = @UserID
		     AND PositionID <> 0

		OPEN @cur
		FETCH NEXT FROM @cur INTO @PositionID
		WHILE @@FETCH_STATUS = 0 BEGIN

			EXEC TestAlertPricingDetails		@UserID, @PositionID
			EXEC TestAlertPositionServices		@UserID, @PositionID
			EXEC TestAlertReferenceRequests		@UserID, @PositionID
			EXEC TestAlertProfessionalLicense	@UserID, @PositionID
			EXEC TestAlertLocation				@UserID, @PositionID
			EXEC TestAlertShowcaseWork			@UserID, @PositionID

			FETCH NEXT FROM @cur INTO @PositionID
		END
		CLOSE @cur
		DEALLOCATE @cur
    END ELSE BEGIN
		EXEC TestAlertPricingDetails		@UserID, @PositionID
		EXEC TestAlertPositionServices		@UserID, @PositionID
		EXEC TestAlertReferenceRequests		@UserID, @PositionID
		EXEC TestAlertProfessionalLicense	@UserID, @PositionID
		EXEC TestAlertLocation				@UserID, @PositionID
		EXEC TestAlertShowcaseWork			@UserID, @PositionID
    END

    EXEC TestProfileActivation @UserID, @PositionID
END
GO
-- TestAllUsersAlerts.sql

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description: Execute the TestAllUserAlerts
-- per ALL users on the database and all its
-- positions
-- CAREFUL: database performance can be affected
-- by this, use as an utility on testing or
-- special maintenance / update that can require
-- it.
-- =============================================
ALTER PROCEDURE [dbo].[TestAllUsersAlerts]
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @UserID int
    DECLARE @cur CURSOR

	SET @cur = CURSOR FOR
		SELECT UserID
		FROM Users
		WHERE Active = 1

	OPEN @cur
	FETCH NEXT FROM @cur INTO @UserID
	WHILE @@FETCH_STATUS = 0 BEGIN
		-- Execute this same proc but for a concrete positionID
		EXEC TestAllUserAlerts @UserID

		FETCH NEXT FROM @cur INTO @UserID
	END
	CLOSE @cur
	DEALLOCATE @cur

END
GO
-- TestProfileActivation.sql

ALTER PROCEDURE [dbo].[TestProfileActivation]
	@UserID int,
	@PositionID int = 0
AS
BEGIN


	SET NOCOUNT ON;
    DECLARE @cur CURSOR

    IF @PositionID = 0 BEGIN
		SET @cur = CURSOR FOR
			SELECT DISTINCT
			 PositionID
			FROM
			 UserProfilePositions
			WHERE
		     UserID = @UserID
		     AND PositionID <> 0

		OPEN @cur
		FETCH NEXT FROM @cur INTO @PositionID
		WHILE @@FETCH_STATUS = 0 BEGIN

			EXEC TestProfileActivation @UserID, @PositionID

			FETCH NEXT FROM @cur INTO @PositionID
		END
		CLOSE @cur
		DEALLOCATE @cur
    END ELSE BEGIN

		-- StatusID (marketplaceReady and auto switch status)
		IF (SELECT TOP 1 StatusID FROM UserProfilePositions
			WHERE UserID = @UserID AND PositionID = @PositionID)
			IN (1, 2) -- Its a state for automatic activation
		BEGIN

			UPDATE UserProfilePositions SET
				StatusID =
				CASE WHEN (SELECT count(*)
					FROM UserAlert As UA
						 INNER JOIN
						Alert As A
						  ON UA.AlertID = A.AlertID
					WHERE UA.UserID = @UserID
							AND
						  (UA.PositionID = 0 OR UA.PositionID = @PositionID)
							AND
						  A.Required = 1
							AND
						  UA.Active = 1
				) = 0 THEN 1
				ELSE 2
				END,

				UpdatedDate = GETDATE(),
				ModifiedBy = 'sys'
			WHERE
				UserID = @UserID AND PositionID = @PositionID
		END

		-- Flag BookMeButtonReady
		UPDATE UserProfilePositions SET
			bookMeButtonReady =
			CASE WHEN (SELECT count(*)
				FROM UserAlert As UA
					 INNER JOIN
					Alert As A
					  ON UA.AlertID = A.AlertID
				WHERE UA.UserID = @UserID
						AND
					  (UA.PositionID = 0 OR UA.PositionID = @PositionID)
						AND
					  A.bookMeButtonRequired = 1
						AND
					  UA.Active = 1
			) = 0 THEN 1
			ELSE 0
			END,

			UpdatedDate = GETDATE(),
			ModifiedBy = 'sys'
		WHERE
			UserID = @UserID AND PositionID = @PositionID
	END
END

GO
-- UnDeleteUser.sql

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-08-17
-- Description:	Restore a user account removed
-- throught the page /Account/$Delete/.
-- Of course, only restore from a 'weak delete'
-- =============================================
ALTER PROCEDURE UnDeleteUser
	@UserID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    UPDATE userprofile SET Email = substring(Email, len('DELETED:') + 2, len(Email) - len('DELETED: '))
    WHERE UserID = @UserID

    UPDATE users SET Active = 1, AccountStatusID = 1
    WHERE UserID = @UserID
END
GO
-- ut_AutocheckReviewVerifications.sql

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2013-07-15
-- Description:	Automatically checks the reviews
-- providers have from customers to enable or
-- disable the related user-verifications:
-- 11: loconomics user reviewed
-- 12: review from former client
-- =============================================
ALTER PROCEDURE ut_AutocheckReviewVerifications
AS BEGIN

	DECLARE @cur CURSOR
	DECLARE @UserID int, @PositionID int, @RevDate datetime

	----------------------------------
	-- Reviews

	SET @cur = CURSOR FOR
		SELECT	UserID, PositionID
		FROM	userprofilepositions
		WHERE	Active = 1

	OPEN @cur
	FETCH NEXT FROM @cur INTO @UserID, @PositionID
	WHILE @@FETCH_STATUS = 0 BEGIN

		-- Check 12: 'review from former client'
		SET @RevDate = null
		SELECT TOP 1 @RevDate = CreatedDate
		FROM UserReviews
		WHERE ProviderUserID = @UserID
			AND BookingID = 0
			AND PositionID = @PositionID

		IF @RevDate is not null
			-- There is reviews from former clients, verification confirmed
			EXEC SetUserVerification @UserID, 12, @RevDate, 1, @PositionID
		ELSE BEGIN
			-- Check if there is a verification already
			SET @RevDate = null
			SELECT TOP 1 @RevDate = CreatedDate
			FROM UserVerification
			WHERE	UserID = @UserID
					AND VerificationID = 12
					AND (PositionID = 0 OR PositionID = @PositionID)
			IF @RevDate is not null
				-- State: Pending, enough to off the provider-alert but not
				-- show the verification as done.
				-- Verification specific for the position
				EXEC SetUserVerification @UserID, 12, @RevDate, 2, @PositionID
		END

		-- Check 11: 'Loconomics user reviewed'
		SET @RevDate = null
		SELECT TOP 1 @RevDate = CreatedDate
		FROM UserReviews
		WHERE ProviderUserID = @UserID
			AND BookingID > 0
			AND PositionID = @PositionID

		IF @RevDate is not null
			EXEC SetUserVerification @UserID, 11, @RevDate, 1, @PositionID
		ELSE
			EXEC DelUserVerification @UserID, 11, @PositionID

		FETCH NEXT FROM @cur INTO @UserID, @PositionID
	END
	CLOSE @cur
	DEALLOCATE @cur

    -------------------------------
	-- Final check

	SET @cur = CURSOR FOR
		SELECT	UserID
		FROM	Users
		WHERE	Active = 1 AND IsProvider = 1

	OPEN @cur
	FETCH NEXT FROM @cur INTO @UserID
	WHILE @@FETCH_STATUS = 0 BEGIN

		-- Remove old user-verifications for 'loconomics reviews' without positionID,
		-- that doesn't work (and check was already done in previous loop)
		EXEC DelUserVerification @UserID, 11, 0

		-- Remove old user-verifications for 'former customers' without positionID,
		-- that doesn't work (and check was already done in previous loop)
		EXEC DelUserVerification @UserID, 12, 0

		FETCH NEXT FROM @cur INTO @UserID
	END
	CLOSE @cur
	DEALLOCATE @cur

END
GO
-- ut_ModifyUserAlertsState.sql

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
ALTER PROCEDURE [dbo].[ut_ModifyUserAlertsState]
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
