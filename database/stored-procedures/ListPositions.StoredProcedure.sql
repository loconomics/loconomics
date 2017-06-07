/****** Object:  StoredProcedure [dbo].[ListPositions]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO





CREATE PROC [dbo].[ListPositions]

@LanguageID int = 1,
@CountryID int  = 1

as



select  
a.positionid,  
a.PositionSingular  as position  
from positions a 
where a.LanguageID = @LanguageID and a.CountryID = @CountryID
and a.PositionSingular is not null
order by 2 asc
GO
