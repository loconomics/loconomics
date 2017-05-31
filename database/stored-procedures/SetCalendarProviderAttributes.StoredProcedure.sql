/****** Object:  StoredProcedure [dbo].[SetCalendarProviderAttributes]    Script Date: 5/24/2017 11:13:48 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

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
CREATE PROC [dbo].[SetCalendarProviderAttributes] (
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
