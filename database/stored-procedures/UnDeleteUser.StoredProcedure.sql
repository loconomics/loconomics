/****** Object:  StoredProcedure [dbo].[UnDeleteUser]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-08-17
-- Description:	Restore a user account removed
-- throught the page /Account/$Delete/.
-- Of course, only restore from a 'weak delete'
-- =============================================
CREATE PROCEDURE [dbo].[UnDeleteUser]
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
