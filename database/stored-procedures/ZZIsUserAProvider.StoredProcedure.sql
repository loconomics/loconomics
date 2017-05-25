/****** Object:  StoredProcedure [dbo].[ZZIsUserAProvider]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROC [dbo].[ZZIsUserAProvider]

@UserID int

As

select 

count(*) As answer
from users a 
where
	a.UserID = @UserID
	 AND
	a.IsProvider = 1
GO
