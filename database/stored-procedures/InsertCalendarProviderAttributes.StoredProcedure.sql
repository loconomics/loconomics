/****** Object:  StoredProcedure [dbo].[InsertCalendarProviderAttributes]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[InsertCalendarProviderAttributes]

@UserID int,
@AdvanceTime decimal(10, 2),
@MinTime decimal(10, 2),
@MaxTime decimal(10, 2),
@BetweenTime decimal(10, 2),
@UseCalendarProgram bit,
@CalendarType varchar(200),
@CalendarURL varchar(500),
@PrivateCalendarToken varchar(128)

as


IF EXISTS (SELECT * FROM CalendarProviderAttributes WHERE UserID = @UserID)

BEGIN 

        
        UPDATE CalendarProviderAttributes
        SET AdvanceTime = @AdvanceTime,
            MinTime = @MinTime,
            MaxTime = @MaxTime,
            BetweenTime = @BetweenTime,
            UseCalendarProgram = @UseCalendarProgram,
            CalendarType = @CalendarType,
            CalendarURL = @CalendarURL,
            PrivateCalendarToken = dbo.fx_IfNW(@PrivateCalendarToken, PrivateCalendarToken)
         WHERE UserID = @UserID 
 
END
ELSE
BEGIN
      
      INSERT INTO CalendarProviderAttributes VALUES (@UserID,@AdvanceTime,@MinTime,@MaxTime,@BetweenTime,@UseCalendarProgram,@CalendarType,@CalendarURL,@PrivateCalendarToken)

END
GO
