/*
   martes, 05 de febrero de 201318:55:18
   User: 
   Server: localhost\SQLEXPRESS
   Database: loconomics
   Application: 
*/

/* To prevent any potential data loss issues, you should review this script in detail before running it outside the context of the database designer.*/
BEGIN TRANSACTION
SET QUOTED_IDENTIFIER ON
SET ARITHABORT ON
SET NUMERIC_ROUNDABORT OFF
SET CONCAT_NULL_YIELDS_NULL ON
SET ANSI_NULLS ON
SET ANSI_PADDING ON
SET ANSI_WARNINGS ON
COMMIT
BEGIN TRANSACTION
GO
ALTER TABLE dbo.CalendarProviderAttributes ADD
	PrivateCalendarToken varchar(128) NULL
GO
ALTER TABLE dbo.CalendarProviderAttributes SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.CalendarProviderAttributes', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.CalendarProviderAttributes', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.CalendarProviderAttributes', 'Object', 'CONTROL') as Contr_Per 

GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROC [dbo].[GetUserCalendarProviderAttributes]

@UserID int


as

SELECT AdvanceTime,MinTime,MaxTime,BetweenTime,UseCalendarProgram,CalendarType,CalendarURL, PrivateCalendarToken
FROM CalendarProviderAttributes
WHERE UserID = @UserID

GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROC [dbo].[InsertCalendarProviderAttributes]

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