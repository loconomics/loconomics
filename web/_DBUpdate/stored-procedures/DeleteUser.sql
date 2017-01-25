DROP PROCEDURE [dbo].[DeleteUser]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


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
CREATE PROCEDURE [dbo].[DeleteUser]
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
FROM            userprofilepositions
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
