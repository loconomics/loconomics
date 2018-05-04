CREATE TABLE [dbo].[userprofilepositions_BACKUP](
	[UserID] [int] NOT NULL,
	[PositionID] [int] NOT NULL,
	[LanguageID] [int] NOT NULL,
	[CountryID] [int] NOT NULL,
	[CreateDate] [datetime] NULL,
	[UpdatedDate] [datetime] NULL,
	[ModifiedBy] [varchar](3) NULL,
	[Active] [bit] NULL,
	[PositionIntro] [varchar](2000) NULL,
	[StatusID] [int] NOT NULL,
	[CancellationPolicyID] [int] NULL,
	[additionalinfo1] [nvarchar](500) NULL,
	[additionalinfo2] [nvarchar](500) NULL,
	[additionalinfo3] [nvarchar](500) NULL,
	[InstantBooking] [bit] NOT NULL,
	[bookMeButtonReady] [bit] NOT NULL,
	[collectPaymentAtBookMeButton] [bit] NOT NULL
)
;
INSERT INTO [dbo].[userprofilepositions_BACKUP]
           ([UserID]
           ,[PositionID]
           ,[LanguageID]
           ,[CountryID]
           ,[CreateDate]
           ,[UpdatedDate]
           ,[ModifiedBy]
           ,[Active]
           ,[PositionIntro]
           ,[StatusID]
           ,[CancellationPolicyID]
           ,[additionalinfo1]
           ,[additionalinfo2]
           ,[additionalinfo3]
           ,[InstantBooking]
           ,[bookMeButtonReady]
           ,[collectPaymentAtBookMeButton])
SELECT [UserID]
      ,[PositionID]
      ,[LanguageID]
      ,[CountryID]
      ,[CreateDate]
      ,[UpdatedDate]
      ,[ModifiedBy]
      ,[Active]
      ,[PositionIntro]
      ,[StatusID]
      ,[CancellationPolicyID]
      ,[additionalinfo1]
      ,[additionalinfo2]
      ,[additionalinfo3]
      ,[InstantBooking]
      ,[bookMeButtonReady]
      ,[collectPaymentAtBookMeButton]
  FROM [dbo].[userprofilepositions]
