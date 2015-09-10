----------------------
-- BookingStatus merging and update process
----------------------

-----------------
BEGIN TRANSACTION
-----------------

BEGIN TRANSACTION
SET QUOTED_IDENTIFIER ON
SET ARITHABORT ON
SET NUMERIC_ROUNDABORT OFF
SET CONCAT_NULL_YIELDS_NULL ON
SET ANSI_NULLS ON
SET ANSI_PADDING ON
SET ANSI_WARNINGS ON
COMMIT

GO

-- Rename pricingestimate
-- First, the its KEYS
BEGIN TRANSACTION
GO
EXECUTE sp_rename N'dbo.pricingestimate.PricingEstimateID', N'Tmp_PricingSummaryID', 'COLUMN' 
GO
EXECUTE sp_rename N'dbo.pricingestimate.PricingEstimateRevision', N'Tmp_PricingSummaryRevision_1', 'COLUMN' 
GO
EXECUTE sp_rename N'dbo.pricingestimate.Tmp_PricingSummaryID', N'PricingSummaryID', 'COLUMN' 
GO
EXECUTE sp_rename N'dbo.pricingestimate.Tmp_PricingSummaryRevision_1', N'PricingSummaryRevision', 'COLUMN' 
GO
ALTER TABLE dbo.pricingestimate SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
BEGIN TRANSACTION
GO
EXECUTE sp_rename N'dbo.pricingestimatedetail.PricingEstimateID', N'Tmp_PricingSummaryID_2', 'COLUMN' 
GO
EXECUTE sp_rename N'dbo.pricingestimatedetail.PricingEstimateRevision', N'Tmp_PricingSummaryRevision_3', 'COLUMN' 
GO
EXECUTE sp_rename N'dbo.pricingestimatedetail.ProviderPricingDataInput', N'Tmp_ServiceProfessionalDataInput_4', 'COLUMN' 
GO
EXECUTE sp_rename N'dbo.pricingestimatedetail.CustomerPricingDataInput', N'Tmp_ClientDataInput_5', 'COLUMN' 
GO
EXECUTE sp_rename N'dbo.pricingestimatedetail.Tmp_PricingSummaryID_2', N'PricingSummaryID', 'COLUMN' 
GO
EXECUTE sp_rename N'dbo.pricingestimatedetail.Tmp_PricingSummaryRevision_3', N'PricingSummaryRevision', 'COLUMN' 
GO
EXECUTE sp_rename N'dbo.pricingestimatedetail.Tmp_ServiceProfessionalDataInput_4', N'ServiceProfessionalDataInput', 'COLUMN' 
GO
EXECUTE sp_rename N'dbo.pricingestimatedetail.Tmp_ClientDataInput_5', N'ClientDataInput', 'COLUMN' 
GO
ALTER TABLE dbo.pricingestimatedetail SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
-- Now, tables
EXEC sp_rename 'pricingestimate', 'pricingSummary'
EXEC sp_rename 'pricingestimatedetail', 'pricingSummaryDetail'

-- Changes to BookingType table
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
ALTER TABLE dbo.bookingtype
	DROP CONSTRAINT DF__bookingty__Servi__2215F810
GO
ALTER TABLE dbo.bookingtype
	DROP CONSTRAINT DF__bookingty__Servi__230A1C49
GO
ALTER TABLE dbo.bookingtype
	DROP CONSTRAINT DF__bookingty__Payme__23FE4082
GO
CREATE TABLE dbo.Tmp_bookingtype
	(
	BookingTypeID int NOT NULL,
	BookingTypeName varchar(50) NOT NULL,
	BookingTypeDescription varchar(500) NULL,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	FirstTimeServiceFeeFixed decimal(5, 2) NOT NULL,
	FirstTimeServiceFeePercentage decimal(5, 2) NOT NULL,
	PaymentProcessingFeePercentage decimal(5, 2) NOT NULL,
	PaymentProcessingFeeFixed decimal(5, 2) NOT NULL,
	FirstTimeServiceFeeMaximum decimal(5, 2) NOT NULL,
	FirstTimeServiceFeeMinimum decimal(5, 2) NOT NULL
	)  ON [PRIMARY]
GO
ALTER TABLE dbo.Tmp_bookingtype SET (LOCK_ESCALATION = TABLE)
GO
ALTER TABLE dbo.Tmp_bookingtype ADD CONSTRAINT
	DF__bookingty__Servi__2215F810 DEFAULT ((0)) FOR FirstTimeServiceFeeFixed
GO
ALTER TABLE dbo.Tmp_bookingtype ADD CONSTRAINT
	DF__bookingty__Servi__230A1C49 DEFAULT ((0)) FOR FirstTimeServiceFeePercentage
GO
ALTER TABLE dbo.Tmp_bookingtype ADD CONSTRAINT
	DF__bookingty__Payme__23FE4082 DEFAULT ((0)) FOR PaymentProcessingFeePercentage
GO
ALTER TABLE dbo.Tmp_bookingtype ADD CONSTRAINT
	DF_bookingtype_PaymentProcessingFeeFixed DEFAULT 0 FOR PaymentProcessingFeeFixed
GO
ALTER TABLE dbo.Tmp_bookingtype ADD CONSTRAINT
	DF_bookingtype_FirstTimeServiceFeeMaximum DEFAULT 0 FOR FirstTimeServiceFeeMaximum
GO
ALTER TABLE dbo.Tmp_bookingtype ADD CONSTRAINT
	DF_bookingtype_FirstTimeServiceFeeMinimum DEFAULT 0 FOR FirstTimeServiceFeeMinimum
GO
IF EXISTS(SELECT * FROM dbo.bookingtype)
	 EXEC('INSERT INTO dbo.Tmp_bookingtype (BookingTypeID, BookingTypeName, BookingTypeDescription, CreatedDate, UpdatedDate, ModifiedBy, Active, FirstTimeServiceFeeFixed, FirstTimeServiceFeePercentage, PaymentProcessingFeePercentage, PaymentProcessingFeeFixed)
		SELECT BookingTypeID, BookingTypeName, BookingTypeDescription, CreatedDate, UpdatedDate, ModifiedBy, Active, ServiceFeeFixed, ServiceFeePercentage, PaymentProcessingFeePercentage, PaymentProcessingFeeFixed FROM dbo.bookingtype WITH (HOLDLOCK TABLOCKX)')
GO
ALTER TABLE dbo.bookingrequest
	DROP CONSTRAINT FK__bookingre__Booki__5A1A5A11
GO
DROP TABLE dbo.bookingtype
GO
EXECUTE sp_rename N'dbo.Tmp_bookingtype', N'bookingtype', 'OBJECT' 
GO
ALTER TABLE dbo.bookingtype ADD CONSTRAINT
	PK__bookingt__649EC4B15090EFD7 PRIMARY KEY CLUSTERED 
	(
	BookingTypeID
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

GO
COMMIT
select Has_Perms_By_Name(N'dbo.bookingtype', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.bookingtype', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.bookingtype', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.bookingrequest ADD CONSTRAINT
	FK__bookingre__Booki__5A1A5A11 FOREIGN KEY
	(
	BookingTypeID
	) REFERENCES dbo.bookingtype
	(
	BookingTypeID
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.bookingrequest SET (LOCK_ESCALATION = TABLE)
GO
COMMIT

-- Rename to TEMP name table Booking because a new one will be created
EXEC sp_rename 'booking', 'BookingOLD'

GO

-- New Booking table scheme

CREATE TABLE [dbo].[booking](
	[BookingID] [int] IDENTITY(1,1) NOT NULL,
	[ClientUserID] [int] NULL,
	[ServiceProfessionalUserID] [int] NULL,
	[JobTitleID] [int] NOT NULL,
    [LanguageID] [int] NOT NULL,
    [CountryID] [int] NOT NULL,
	[BookingStatusID] [int] NOT NULL,
	[BookingTypeID] [int] NOT NULL,
	[CancellationPolicyID] [int] NOT NULL,
	[ParentBookingID] [int] NULL,
	
	[ServiceAddressID] [int] NULL,
	[ServiceDateID] [int] NULL,
	[AlternativeDate1ID] [int] NULL,
	[AlternativeDate2ID] [int] NULL,

	[PricingSummaryID] [int] NOT NULL,
	[PricingSummaryRevision] [int] NOT NULL,
	[PaymentTransactionID] [varchar](250) NULL,
	[PaymentLastFourCardNumberDigits] [varchar](64) NULL,
	[TotalPricePaidByClient] [decimal](25, 2) NULL,
	[TotalServiceFeesPaidByClient] [decimal](25, 2) NULL,
	[TotalPaidToServiceProfessional] [decimal](25, 2) NULL,
	[TotalServiceFeesPaidByServiceProfessional] [decimal](25, 2) NULL,

	[InstantBooking] [bit] NOT NULL,
    [FirstTimeBooking] [bit] NOT NULL,
	[SendReminder] [bit] NOT NULL,
	[SendPromotional] [bit] NOT NULL,
	[Recurrent] [bit] NOT NULL,
	[MultiSession] [bit] NOT NULL,
	[PricingAdjustmentApplied] [bit] NOT NULL,		
	[PaymentCollected] [bit] NOT NULL,
	[PaymentAuthorized] [bit] NOT NULL,
	[AwaitingResponseFromUserID] [int] NULL,
	[PricingAdjustmentRequested] [bit] NOT NULL,
	[SupportTicketNumber] [varchar](200) NULL,
	
	[MessagingLog] [nvarchar](400) NOT NULL,
	[CreatedDate] [datetime] NOT NULL,
	[UpdatedDate] [datetime] NOT NULL,
	[ModifiedBy] [varchar](25) NOT NULL,
	
	[SpecialRequests] [text] NULL,
	[PreNotesToClient] [text] NULL,
	[PostNotesToClient] [text] NULL,
	[PreNotesToSelf] [text] NULL,
	[PostNotesToSelf] [text] NULL,

 CONSTRAINT [PK__booking__bookingIDKey] PRIMARY KEY CLUSTERED 
(
	[BookingID] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO

SET ANSI_PADDING OFF
GO

ALTER TABLE [dbo].[booking]  WITH CHECK ADD  CONSTRAINT [FK__booking__parentbooking] FOREIGN KEY([ParentBookingID])
REFERENCES [dbo].[booking] ([BookingID])
GO

ALTER TABLE [dbo].[booking]  WITH CHECK ADD  CONSTRAINT [FK__booking__client] FOREIGN KEY([ClientUserID])
REFERENCES [dbo].[users] ([UserID])
GO

ALTER TABLE [dbo].[booking]  WITH CHECK ADD  CONSTRAINT [FK__booking__serviceProfessional] FOREIGN KEY([ServiceProfessionalUserID])
REFERENCES [dbo].[users] ([UserID])
GO

ALTER TABLE [dbo].[booking]  WITH CHECK ADD  CONSTRAINT [FK__booking__jobtitle] FOREIGN KEY([JobTitleID], [LanguageID],[CountryID])
REFERENCES [dbo].[positions] ([PositionID], [LanguageID],[CountryID])
GO

ALTER TABLE [dbo].[booking]  WITH CHECK ADD  CONSTRAINT [FK__booking__status] FOREIGN KEY([BookingStatusID])
REFERENCES [dbo].[BookingStatus] ([BookingStatusID])
GO

ALTER TABLE [dbo].[booking]  WITH CHECK ADD  CONSTRAINT [FK__booking__type] FOREIGN KEY([BookingTypeID])
REFERENCES [dbo].[BookingType] ([BookingTypeID])
GO

ALTER TABLE [dbo].[booking]  WITH CHECK ADD  CONSTRAINT [FK__booking__cancellationPolicy] FOREIGN KEY([CancellationPolicyID], [LanguageID],[CountryID])
REFERENCES [dbo].[cancellationpolicy] ([CancellationPolicyID], [LanguageID],[CountryID])
GO

ALTER TABLE [dbo].[booking]  WITH CHECK ADD  CONSTRAINT [FK__booking__serviceAddress] FOREIGN KEY([ServiceAddressID])
REFERENCES [dbo].[address] ([AddressID])
GO

ALTER TABLE [dbo].[booking]  WITH CHECK ADD  CONSTRAINT [FK__booking__serviceDate] FOREIGN KEY([ServiceDateID])
REFERENCES [dbo].[CalendarEvents] ([Id])
GO

ALTER TABLE [dbo].[booking]  WITH CHECK ADD  CONSTRAINT [FK__booking__alternativeDate1] FOREIGN KEY([AlternativeDate1ID])
REFERENCES [dbo].[CalendarEvents] ([Id])
GO

ALTER TABLE [dbo].[booking]  WITH CHECK ADD  CONSTRAINT [FK__booking__alternativeDate2] FOREIGN KEY([AlternativeDate2ID])
REFERENCES [dbo].[CalendarEvents] ([Id])
GO

ALTER TABLE [dbo].[booking]  WITH CHECK ADD  CONSTRAINT [FK__booking__pricingSummary] FOREIGN KEY([PricingSummaryID], [PricingSummaryRevision])
REFERENCES [dbo].[PricingSummary] ([PricingSummaryID], [PricingSummaryRevision])
GO

ALTER TABLE [dbo].[booking]  WITH CHECK ADD  CONSTRAINT [FK__booking__AwaitingResponseFromUserID] FOREIGN KEY([AwaitingResponseFromUserID])
REFERENCES [dbo].[users] ([UserID])
GO


ALTER TABLE [dbo].[booking] ADD  CONSTRAINT [Contraint__booking__PricingAdjustmentApplied]  DEFAULT ((0)) FOR [PricingAdjustmentApplied]
GO

ALTER TABLE [dbo].[booking] ADD  CONSTRAINT [Contraint_booking_MessagingLog]  DEFAULT ('') FOR [MessagingLog]
GO

ALTER TABLE [dbo].[booking] ADD  CONSTRAINT [Contraint_booking_InstantBooking]  DEFAULT ((0)) FOR [InstantBooking]
GO

ALTER TABLE [dbo].[booking] ADD  CONSTRAINT [Contraint_booking_SendReminder]  DEFAULT ((0)) FOR [SendReminder]
GO

ALTER TABLE [dbo].[booking] ADD  CONSTRAINT [Contraint_booking_SendPromotional]  DEFAULT ((0)) FOR [SendPromotional]
GO

ALTER TABLE [dbo].[booking] ADD  CONSTRAINT [Contraint_booking_PaymentCollected]  DEFAULT ((0)) FOR [PaymentCollected]
GO

ALTER TABLE [dbo].[booking] ADD  CONSTRAINT [Contraint_booking_PaymentAuthorized]  DEFAULT ((0)) FOR [PaymentAuthorized]
GO

ALTER TABLE [dbo].[booking] ADD  CONSTRAINT [Contraint_booking_Recurrent]  DEFAULT ((0)) FOR [Recurrent]
GO

ALTER TABLE [dbo].[booking] ADD  CONSTRAINT [Contraint_booking_MultiSession]  DEFAULT ((0)) FOR [MultiSession]
GO

ALTER TABLE [dbo].[booking] ADD  CONSTRAINT [Contraint_booking_PricingAdjustmentRequested]  DEFAULT ((0)) FOR [PricingAdjustmentRequested]
GO

GO
DECLARE @v sql_variant 
SET @v = N'The languageID related to the jobTitleID, and the one used on the API call by the creator of the booking'
EXECUTE sp_addextendedproperty N'MS_Description', @v, N'SCHEMA', N'dbo', N'TABLE', N'booking', N'COLUMN', N'LanguageID'
GO

GO
DECLARE @v sql_variant 
SET @v = N'The countryID related to the jobTitleID, and the one used on the API call by the creator of the booking'
EXECUTE sp_addextendedproperty N'MS_Description', @v, N'SCHEMA', N'dbo', N'TABLE', N'booking', N'COLUMN', N'CountryID'
GO


-- DATA Copy
-- Avoid foreign key alerts
EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER all'

GO

-- Copy mixed data from old tables to new Booking
ALTER TABLE booking NOCHECK CONSTRAINT all
GO

SET IDENTITY_INSERT booking ON

INSERT INTO booking (
    BookingID, ClientUserID, ServiceProfessionalUserID,
    JobTitleID, LanguageID, CountryID,
    BookingStatusID, BookingTypeID, CancellationPolicyID, ParentBookingID,
    ServiceAddressID, ServiceDateID, AlternativeDate1ID, AlternativeDate2ID,
    PricingSummaryID, PricingSummaryRevision,
    PaymentTransactionID, PaymentLastFourCardNumberDigits,
    TotalPricePaidByClient, TotalServiceFeesPaidByClient,
    TotalPaidToServiceProfessional, TotalServiceFeesPaidByServiceProfessional,
    InstantBooking, FirstTimeBooking, SendReminder, SendPromotional,
    Recurrent, MultiSession,
    PricingAdjustmentApplied, PaymentCollected, PaymentAuthorized,
    AwaitingResponseFromUserID, PricingAdjustmentRequested, SupportTicketNumber,
    MessagingLog, CreatedDate, UpdatedDate, ModifiedBy,
    SpecialRequests, PreNotesToClient, PostNotesToClient,
    PreNotesToSelf, PostNotesToSelf
) SELECT
B.BookingRequestID As BookingID,
R.CustomerUserID,
R.ProviderUserID,
R.PositionID,
1 As LanguageID, -- The only one used until now
1 As CountryID, -- The only one used until now
(
    CASE WHEN B.BookingStatusID = 1 THEN 6
         WHEN B.BookingStatusID = 2 THEN 7
         WHEN B.BookingStatusID = 3 THEN 7
         WHEN B.BookingStatusID = 4 THEN 8
         WHEN B.BookingStatusID = 5 THEN 9
         WHEN B.BookingStatusID = 6 THEN 3
         WHEN R.BookingRequestStatusID = 1 THEN 1
         WHEN R.BookingRequestStatusID = 2 THEN 2
         WHEN R.BookingRequestStatusID = 3 THEN 1
         WHEN R.BookingRequestStatusID = 4 THEN 3
         WHEN R.BookingRequestStatusID = 5 THEN 4
         WHEN R.BookingRequestStatusID = 6 THEN 5
         -- On R.BookingRequestStatusID = 7 must exists a bookingStatusID so will fall in an early case
         -- Other larges requestStatuses were never used so don't need upgrade path
         -- LET FAIL THE PROCESS WITH A DEFAULT NULL THAT BREAKS THE NOT-NULL CONSTRAINT
         ELSE null
    END
) As BookingStatusID,
(
    CASE WHEN R.BookingTypeID = 1 THEN 1
         WHEN R.BookingTypeID = 2 THEN 1
         WHEN R.BookingTypeID = 3 THEN 1
         WHEN R.BookingTypeID = 4 THEN 1
         WHEN R.BookingTypeID = 5 THEN 4
         WHEN R.BookingTypeID = 6 THEN 1
         WHEN R.BookingTypeID = 7 THEN 2
         WHEN R.BookingTypeID = 8 THEN 3
         -- Cannot be other, fail when null
         ELSE NULL
    END
) As BookingTypeID,
R.CancellationPolicyID,
null As ParentBookingID,

R.AddressID,
(
    CASE WHEN B.ConfirmedDateID is not null THEN B.ConfirmedDateID
         ELSE R.PreferredDateID
    END
) As ServiceDateID,
R.AlternativeDate1ID,
R.AlternativeDate2ID,

R.PricingEstimateID,
(SELECT max(PR.PricingSummaryRevision) FROM PricingSummary As PR WHERE PR.PricingSummaryID = R.PricingEstimateID) As PricingSummaryRevision,
R.PaymentTransactionID,
R.PaymentLastFourCardNumberDigits,
B.TotalPricePaidByCustomer,
B.TotalServiceFeesPaidByCustomer,
B.TotalPaidToProvider,
B.TotalServiceFeesPaidByProvider,

R.InstantBooking,
(
    CASE WHEN R.BookingTypeID = 1 THEN Cast(1 as bit)
         -- Any other is not first-time (the 3 for firts-time recurring was never used)
         ELSE Cast(0 as bit)
    END
) As FirstTimeBooking,
R.SendReminder,
R.SendPromotional,
Cast(0 as bit) As Recurrent, -- Recurrent not implemented, all false
Cast(0 as bit) As MultiSession, -- MultiSession not implemented, all false
B.PricingAdjustmentApplied,
(
    CASE WHEN PaymentTransactionID is null THEN Cast(0 as bit)
         ELSE Cast(1 as bit)
    END
) As PaymentCollected, -- When payment was enabled for the booking
(
    CASE WHEN PaymentTransactionID is null THEN Cast(0 as bit)
         ELSE Cast(1 as bit)
    END
) As PaymentAuthorized, -- Same as PaymentCollected at this point, will be relevant
                        -- for later uses when gets a different value depending on transaction state
null As AwaitingResponseFromUserID,
Cast(0 as bit) As PricingAdjustmentRequested,
null As SupportTicketNumber,

(coalesce(R.MessagingLog, '') + coalesce(B.MessagingLog collate SQL_Latin1_General_CP1_CI_AS, '')) As MessagingLog,
R.CreatedDate As CreatedDate,
coalesce(B.UpdatedDate, R.UpdatedDate) As UpdatedDate,
coalesce(B.ModifiedBy, R.ModifiedBy) As ModifiedBy,

R.SpecialRequests,
B.PreNotesToClient,
B.PostNotesToClient,
B.PreNotesToSelf,
B.PostNotesToSelf

FROM BookingOLD As B INNER JOIN BookingRequest As R ON B.BookingRequestID = R.BookingRequestID

SET IDENTITY_INSERT booking OFF

GO

-- New BookingStatus data
DELETE FROM BookingStatus
GO
INSERT INTO BookingStatus VALUES (1, 'incomplete', 'A booking has been started (usually by a customer) but not completed and still saved for later completion', '2015-08-29 13:09:00', '2015-08-29 13:09:00', 'jd', Cast(1 as bit))
INSERT INTO BookingStatus VALUES (2, 'request', 'A booking request has been completed and awaiting service professional or customer response', '2015-08-29 13:09:00', '2015-08-29 13:09:00', 'jd', Cast(1 as bit))
INSERT INTO BookingStatus VALUES (3, 'cancelled', 'A booking has been cancelled by either customer or service professional (the creator of the booking on each case) per the edit booking rules and cancellation policy has been enforced', '2015-08-29 13:09:00', '2015-08-29 13:09:00', 'jd', Cast(1 as bit))
INSERT INTO BookingStatus VALUES (4, 'denied', 'A booking request has been denied by a service professional or customer (is done by the opposite user to the one that created the booking).', '2015-08-29 13:09:00', '2015-08-29 13:09:00', 'jd', Cast(1 as bit))
INSERT INTO BookingStatus VALUES (5, 'requestExpired', 'A booking request has expired due to service professional or customer inaction.', '2015-08-29 13:09:00', '2015-08-29 13:09:00', 'jd', Cast(1 as bit))
INSERT INTO BookingStatus VALUES (6, 'confirmed', 'Booking has been confirmed and awaiting service to be performed.', '2015-08-29 13:09:00', '2015-08-29 13:09:00', 'jd', Cast(1 as bit))
INSERT INTO BookingStatus VALUES (7, 'servicePerformed', 'Service performed.', '2015-08-29 13:09:00', '2015-08-29 13:09:00', 'jd', Cast(1 as bit))
INSERT INTO BookingStatus VALUES (8, 'completed', 'Customer has paid in full and service professional has been paid in full.', '2015-08-29 13:09:00', '2015-08-29 13:09:00', 'jd', Cast(1 as bit))
INSERT INTO BookingStatus VALUES (9, 'dispute', 'Booking is in dispute-dispute created.', '2015-08-29 13:09:00', '2015-08-29 13:09:00', 'jd', Cast(1 as bit))

GO

-- New BookingType data
DELETE FROM BookingType
GO
INSERT INTO Bookingtype (BookingTypeID, BookingTypeName, BookingTypeDescription, CreatedDate, UpdatedDate, ModifiedBy, Active, FirstTimeServiceFeeFixed, FirstTimeServiceFeePercentage, PaymentProcessingFeePercentage, PaymentProcessingFeeFixed, FirstTimeServiceFeeMaximum, FirstTimeServiceFeeMinimum) VALUES (1, 'marketplaceBooking', 'Booked through the Loconomics Marketplace. Done by the client.', '2015-08-29 13:09:00', '2015-08-29 13:09:00', 'jd', Cast(1 as bit), 0, 10, 2.9, 0.3, 10, 5)
INSERT INTO Bookingtype (BookingTypeID, BookingTypeName, BookingTypeDescription, CreatedDate, UpdatedDate, ModifiedBy, Active, FirstTimeServiceFeeFixed, FirstTimeServiceFeePercentage, PaymentProcessingFeePercentage, PaymentProcessingFeeFixed, FirstTimeServiceFeeMaximum, FirstTimeServiceFeeMinimum) VALUES (2, 'bookNowBooking', 'Booked from a service professional website. Done by the client.', '2015-08-29 13:09:00', '2015-08-29 13:09:00', 'jd', Cast(1 as bit), 0, 0, 2.9, 0.3, 0, 0)
INSERT INTO Bookingtype (BookingTypeID, BookingTypeName, BookingTypeDescription, CreatedDate, UpdatedDate, ModifiedBy, Active, FirstTimeServiceFeeFixed, FirstTimeServiceFeePercentage, PaymentProcessingFeePercentage, PaymentProcessingFeeFixed, FirstTimeServiceFeeMaximum, FirstTimeServiceFeeMinimum) VALUES (3, 'serviceProfessionalBooking', 'Booked by the service professional. Done by the service professional', '2015-08-29 13:09:00', '2015-08-29 13:09:00', 'jd', Cast(1 as bit), 0, 0, 2.9, 0.3, 0, 0)
INSERT INTO Bookingtype (BookingTypeID, BookingTypeName, BookingTypeDescription, CreatedDate, UpdatedDate, ModifiedBy, Active, FirstTimeServiceFeeFixed, FirstTimeServiceFeePercentage, PaymentProcessingFeePercentage, PaymentProcessingFeeFixed, FirstTimeServiceFeeMaximum, FirstTimeServiceFeeMinimum) VALUES (4, 'exchangeBooking', 'Booked as an exchange booking. Done by the client', '2015-08-29 13:09:00', '2015-08-29 13:09:00', 'jd', Cast(1 as bit), 0, 0, 2.9, 0.3, 0, 0)
INSERT INTO Bookingtype (BookingTypeID, BookingTypeName, BookingTypeDescription, CreatedDate, UpdatedDate, ModifiedBy, Active, FirstTimeServiceFeeFixed, FirstTimeServiceFeePercentage, PaymentProcessingFeePercentage, PaymentProcessingFeeFixed, FirstTimeServiceFeeMaximum, FirstTimeServiceFeeMinimum) VALUES (5, 'partnerBooking', 'Booked through a White Label marketplace/site. Done by the client.', '2015-08-29 13:09:00', '2015-08-29 13:09:00', 'jd', Cast(1 as bit), 0, 0, 2.9, 0.3, 0, 0)

GO

-- Remove OLD Booking tables
DROP TABLE [dbo].[bookingOLD]
GO
DROP TABLE [bookingrequest]
GO
DROP TABLE [bookingrequestStatus]
GO

-- Reenable foreign keys
EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER all'

GO

-- Minor renames
EXEC sp_rename 'bookingstatus', 'bookingStatus'
EXEC sp_rename 'bookingtype', 'bookingType'
GO

-----------------
COMMIT TRANSACTION
-----------------