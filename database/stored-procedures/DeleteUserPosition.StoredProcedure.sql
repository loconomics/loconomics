/****** Object:  StoredProcedure [dbo].[DeleteUserPosition]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[DeleteUserPosition] (
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
