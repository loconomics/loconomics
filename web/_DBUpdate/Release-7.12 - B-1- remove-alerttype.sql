/*
  Removes AlertTypeID from Alert table
  Drops AlertType table
*/

ALTER TABLE [dbo].[alert]
DROP CONSTRAINT [PK__alert__AAFF8BB7025D5595]
GO

ALTER TABLE [dbo].[alert] ADD CONSTRAINT [PK__alert__AAFF8BB7025D5595] PRIMARY KEY CLUSTERED 
(
	[AlertID] ASC,
	[LanguageID] ASC,
	[CountryID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

ALTER TABLE [dbo].[alert]
DROP COLUMN [AlertTypeID]
GO

/*
AlertTypeID	AlertTypeName	AlertTypeDescription	CreatedDate	UpdatedDate	ModifiedBy	Active	LanguageID	CountryID	DisplayRank
1	Announcements	We want you in the know on all that's happening.	2012-08-11 00:00:00.000	2012-08-11 00:00:00.000	jd	1	1	1	4
2	Activate	Start things off right! You'll need to complete these alerts before your profile is active and viewable to others.	2012-08-11 00:00:00.000	2012-08-11 00:00:00.000	jd	1	1	1	1
3	Enhance	Show ‘em what you’ve got. These are optional but highly encouraged.	2012-08-11 00:00:00.000	2012-08-11 00:00:00.000	jd	1	1	1	2
4	Get paid	Very necessary. You'll need to complete these before you can accept a booking.	2012-08-11 00:00:00.000	2012-08-11 00:00:00.000	jd	1	1	1	3
*/

/*
  In case we want to save data from live DB:
*/
SELECT * FROM AlertType;
GO

DROP TABLE [dbo].[AlertType];
GO
