/****** Object:  StoredProcedure [dbo].[GetUserDetails]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO





CREATE PROC [dbo].[GetUserDetails]

@UserID int


as




select 

FirstName, 
LastName,
SecondLastName,
MiddleIn,
PostalCode,
Photo,
PreferredLanguageID,
PreferredCountryID,
ADD_Details 
from users a 
join dbo.userprofilepositionadditional b 
on a.userid = b.userid  where a.UserID = @UserID
GO
