/****** Object:  UserDefinedFunction [dbo].[GetPositionString]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[GetPositionString] ( @UserID INT,@LangaugeID INT, @CountryID INT, @PositionCnt INT )

RETURNS VARCHAR(8000) AS BEGIN

        DECLARE @r VARCHAR(8000), @l VARCHAR(8000)

        SELECT @PositionCnt = @PositionCnt - 1,  @r = a.PositionSingular + ', '
          FROM positions a
          JOIN dbo.userprofilepositions up
              on a.positionid = up.PositionID
              AND a.LanguageID = up.LanguageID
              AND a.CountryID = up.CountryID 
        WHERE up.UserID = @UserID and up.LanguageID = @LangaugeID and up.CountryID = @CountryID
        
              
           AND @PositionCnt = ( SELECT COUNT(*) FROM positions a2
                          JOIN dbo.userprofilepositions up2
                          on a2.positionid = up2.PositionID
                          AND a2.LanguageID = up2.LanguageID
                          AND a2.CountryID = up2.CountryID 
                          
                       WHERE up.UserID = up2.UserID
                         AND a.PositionSingular <= a2.PositionSingular 
                         AND up.LanguageID = up2.LanguageID
                         AND up.CountryID = up2.CountryID
                          
                         
                         
                    ) ;
        IF @PositionCnt > 0 BEGIN
              EXEC @l = dbo.GetPositionString @UserID,@LangaugeID,@CountryID, @PositionCnt ;
              SET @r =  @l + @r ;
END
RETURN @r ;
END
GO
