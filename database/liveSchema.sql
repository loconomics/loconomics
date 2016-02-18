CREATE TABLE dbo.accountstatus (
	AccountStatusID int NOT NULL,
	AccountStatusName varchar(25) NOT NULL,
	AccountStatusDescription varchar(200),
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) DEFAULT ('sys') NOT NULL,
	Active bit DEFAULT ((1)) NOT NULL,
	PRIMARY KEY (AccountStatusID)
);

CREATE TABLE dbo.address (
	AddressID int IDENTITY(1,1) NOT NULL,
	UserID int NOT NULL,
	AddressTypeID int NOT NULL,
	AddressName varchar(50) NOT NULL,
	AddressLine1 varchar(100) NOT NULL,
	AddressLine2 varchar(100),
	City varchar(100) NOT NULL,
	StateProvinceID int NOT NULL,
	PostalCodeID int NOT NULL,
	CountryID int NOT NULL,
	Latitude float(53),
	Longitude float(53),
	GoogleMapsURL varchar(2073),
	SpecialInstructions varchar(1000),
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit,
	PRIMARY KEY (AddressID)
);

CREATE TABLE dbo.addresstype (
	AddressTypeID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	AddressType varchar(50),
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	UniquePerUser bit NOT NULL,
	Selectable bit DEFAULT ((1)) NOT NULL,
	PRIMARY KEY (AddressTypeID,CountryID,LanguageID)
);

CREATE TABLE dbo.alert (
	AlertID int NOT NULL,
	AlertTypeID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	AlertName varchar(30) NOT NULL,
	AlertHeadlineDisplay varchar(100),
	AlertTextDisplay varchar(300) NOT NULL,
	AlertDescription varchar(500),
	AlertEmailText varchar(25),
	ProviderProfileCompletePoints int NOT NULL,
	CustomerProfileCompletePoints int NOT NULL,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	AlertPageURL varchar(2000),
	Required bit NOT NULL,
	PositionSpecific bit DEFAULT ((0)) NOT NULL,
	DisplayRank int DEFAULT ((1)) NOT NULL,
	ProviderAlert bit DEFAULT ((1)) NOT NULL,
	CustomerAlert bit DEFAULT ((0)) NOT NULL,
	PRIMARY KEY (AlertID,AlertTypeID,CountryID,LanguageID)
);

CREATE TABLE dbo.alerttype (
	AlertTypeID int NOT NULL,
	AlertTypeName varchar(25) NOT NULL,
	AlertTypeDescription varchar(200),
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	LanguageID int DEFAULT ((1)) NOT NULL,
	CountryID int DEFAULT ((1)) NOT NULL,
	DisplayRank int DEFAULT ((1)) NOT NULL,
	PRIMARY KEY (AlertTypeID)
);

CREATE TABLE dbo.backgroundcheck (
	BackgroundCheckID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	BackgroundCheckName varchar(100) NOT NULL,
	BackgroundCheckDescription varchar(1000),
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	BackGroundCheckPrice decimal(5,2),
	PRIMARY KEY (BackgroundCheckID,CountryID,LanguageID)
);

CREATE TABLE dbo.booking (
	BookingID int IDENTITY(1,1) NOT NULL,
	ClientUserID int,
	ServiceProfessionalUserID int,
	JobTitleID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	BookingStatusID int NOT NULL,
	BookingTypeID int NOT NULL,
	CancellationPolicyID int NOT NULL,
	ParentBookingID int,
	ServiceAddressID int,
	ServiceDateID int,
	AlternativeDate1ID int,
	AlternativeDate2ID int,
	PricingSummaryID int NOT NULL,
	PricingSummaryRevision int NOT NULL,
	PaymentTransactionID varchar(250),
	PaymentLastFourCardNumberDigits varchar(64),
	TotalPricePaidByClient decimal(25,2),
	TotalServiceFeesPaidByClient decimal(25,2),
	TotalPaidToServiceProfessional decimal(25,2),
	TotalServiceFeesPaidByServiceProfessional decimal(25,2),
	InstantBooking bit DEFAULT ((0)) NOT NULL,
	FirstTimeBooking bit NOT NULL,
	SendReminder bit DEFAULT ((0)) NOT NULL,
	SendPromotional bit DEFAULT ((0)) NOT NULL,
	Recurrent bit DEFAULT ((0)) NOT NULL,
	MultiSession bit DEFAULT ((0)) NOT NULL,
	PricingAdjustmentApplied bit DEFAULT ((0)) NOT NULL,
	PaymentEnabled bit DEFAULT ((0)) NOT NULL,
	PaymentCollected bit DEFAULT ((0)) NOT NULL,
	PaymentAuthorized bit DEFAULT ((0)) NOT NULL,
	AwaitingResponseFromUserID int,
	PricingAdjustmentRequested bit DEFAULT ((0)) NOT NULL,
	SupportTicketNumber varchar(200),
	MessagingLog nvarchar(400) DEFAULT ('') NOT NULL,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	SpecialRequests text,
	PreNotesToClient text,
	PostNotesToClient text,
	PreNotesToSelf text,
	PostNotesToSelf text,
	PRIMARY KEY (BookingID)
);

CREATE TABLE dbo.bookingStatus (
	BookingStatusID int NOT NULL,
	BookingStatusName varchar(50) NOT NULL,
	BookingStatusDescription varchar(500),
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	PRIMARY KEY (BookingStatusID)
);

CREATE TABLE dbo.bookingType (
	BookingTypeID int NOT NULL,
	BookingTypeName varchar(50) NOT NULL,
	BookingTypeDescription varchar(500),
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	FirstTimeServiceFeeFixed decimal(5,2) DEFAULT ((0)) NOT NULL,
	FirstTimeServiceFeePercentage decimal(5,2) DEFAULT ((0)) NOT NULL,
	PaymentProcessingFeePercentage decimal(5,2) DEFAULT ((0)) NOT NULL,
	PaymentProcessingFeeFixed decimal(5,2) DEFAULT ((0)) NOT NULL,
	FirstTimeServiceFeeMaximum decimal(5,2) DEFAULT ((0)) NOT NULL,
	FirstTimeServiceFeeMinimum decimal(5,2) DEFAULT ((0)) NOT NULL,
	PRIMARY KEY (BookingTypeID)
);

CREATE TABLE dbo.CalendarAvailabilityType (
	CalendarAvailabilityTypeID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	CalendarAvailabilityTypeName nvarchar(50) NOT NULL,
	CalendarAvailabilityTypeDescription nvarchar(300) NOT NULL,
	UserDescription varchar(500),
	AddAppointmentType bit DEFAULT ((0)) NOT NULL,
	SelectableAs nvarchar(50),
	PRIMARY KEY (CalendarAvailabilityTypeID)
);

CREATE TABLE dbo.CalendarEventComments (
	Id int IDENTITY(1,1) NOT NULL,
	IdEvent int NOT NULL,
	Comment nvarchar(max),
	PRIMARY KEY (Id)
);

CREATE TABLE dbo.CalendarEventExceptionsPeriod (
	IdException int NOT NULL,
	DateStart datetime NOT NULL,
	DateEnd datetime,
	PRIMARY KEY (DateStart,IdException)
);

CREATE TABLE dbo.CalendarEventExceptionsPeriodsList (
	Id int IDENTITY(1,1) NOT NULL,
	IdEvent int NOT NULL,
	PRIMARY KEY (Id)
);

CREATE TABLE dbo.CalendarEventRecurrencesPeriod (
	IdRecurrence int NOT NULL,
	DateStart datetime NOT NULL,
	DateEnd datetime,
	PRIMARY KEY (DateStart,IdRecurrence)
);

CREATE TABLE dbo.CalendarEventRecurrencesPeriodList (
	Id int IDENTITY(1,1) NOT NULL,
	IdEvent int NOT NULL,
	PRIMARY KEY (Id)
);

CREATE TABLE dbo.CalendarEvents (
	Id int IDENTITY(1,1) NOT NULL,
	UserId int NOT NULL,
	EventType int DEFAULT ((1)) NOT NULL,
	Summary varchar(500),
	UID varchar(150),
	CalendarAvailabilityTypeID int NOT NULL,
	Transparency bit DEFAULT ((0)) NOT NULL,
	StartTime datetime NOT NULL,
	EndTime datetime NOT NULL,
	IsAllDay bit DEFAULT ((0)) NOT NULL,
	StampTime datetime,
	TimeZone nvarchar(100),
	Priority int,
	Location nvarchar(100),
	UpdatedDate datetime,
	CreatedDate datetime,
	ModifyBy nvarchar(50),
	Class nvarchar(50),
	Organizer nvarchar(max),
	Sequence int,
	Geo nvarchar(100),
	RecurrenceId datetime,
	TimeBlock time,
	DayofWeek int,
	Description nvarchar(max),
	PRIMARY KEY (Id)
);

CREATE TABLE dbo.CalendarEventsAttendees (
	Id int IDENTITY(1,1) NOT NULL,
	IdEvent int NOT NULL,
	Attendee nvarchar(max),
	Role nvarchar(50),
	Uri nvarchar(200),
	PRIMARY KEY (Id)
);

CREATE TABLE dbo.CalendarEventsContacts (
	Id int IDENTITY(1,1) NOT NULL,
	IdEvent int NOT NULL,
	Contact nvarchar(500),
	PRIMARY KEY (Id)
);

CREATE TABLE dbo.CalendarEventType (
	EventTypeId int NOT NULL,
	EventType nvarchar(100),
	Description nvarchar(max),
	DisplayName nvarchar(100),
	PRIMARY KEY (EventTypeId)
);

CREATE TABLE dbo.CalendarProviderAttributes (
	UserID int NOT NULL,
	AdvanceTime decimal(10,2) NOT NULL,
	MinTime decimal(10,2) DEFAULT ((0)) NOT NULL,
	MaxTime decimal(10,2) DEFAULT ((0)) NOT NULL,
	BetweenTime decimal(10,2) NOT NULL,
	UseCalendarProgram bit NOT NULL,
	CalendarType varchar(200),
	CalendarURL varchar(500),
	PrivateCalendarToken varchar(128),
	IncrementsSizeInMinutes int DEFAULT ((15)) NOT NULL,
	PRIMARY KEY (UserID)
);

CREATE TABLE dbo.CalendarReccurrence (
	ID int IDENTITY(1,1) NOT NULL,
	EventID int,
	"Count" int,
	EvaluationMode nvarchar(50),
	Frequency int,
	Interval int,
	RestristionType int,
	Until datetime,
	FirstDayOfWeek int,
	PRIMARY KEY (ID)
);

CREATE TABLE dbo.CalendarReccurrenceFrequency (
	ID int IDENTITY(1,1) NOT NULL,
	CalendarReccursiveID int,
	ByDay bit,
	ByHour bit,
	ByMinute bit,
	ByMonth bit,
	ByMonthDay bit,
	BySecond bit,
	BySetPosition bit,
	ByWeekNo bit,
	ByYearDay bit,
	ExtraValue int,
	FrequencyDay int,
	DayOfWeek int,
	PRIMARY KEY (ID)
);

CREATE TABLE dbo.CalendarRecurrenceFrequencyTypes (
	ID int NOT NULL,
	FrequencyType nvarchar(30),
	UnitPlural nvarchar(30),
	PRIMARY KEY (ID)
);

CREATE TABLE dbo.cancellationpolicy (
	CancellationPolicyID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	CancellationPolicyName varchar(50) NOT NULL,
	CancellationPolicyDescription varchar(1000),
	HoursRequired int,
	RefundIfCancelledBefore float(53),
	RefundIfCancelledAfter float(53),
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	RefundOfLoconomicsFee float(53) DEFAULT ((0.0)) NOT NULL,
	PRIMARY KEY (CancellationPolicyID,CountryID,LanguageID)
);

CREATE TABLE dbo.clienttype (
	CllientTypeID int NOT NULL,
	ClientTypeName varchar(50) NOT NULL,
	ClientTypeDescription varchar(500),
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25),
	Active bit NOT NULL,
	PRIMARY KEY (CllientTypeID,CountryID,LanguageID)
);

CREATE TABLE dbo.country (
	CountryID int NOT NULL,
	LanguageID int NOT NULL,
	CountryName varchar(100) NOT NULL,
	CountryCode varchar(3) NOT NULL,
	CountryCodeAlpha2 char(2),
	CountryCallingCode varchar(3),
	CreatedDate datetime,
	UpdatedDate datetime,
	ModifiedBy varchar(25),
	Active bit NOT NULL,
	PRIMARY KEY (CountryID,LanguageID)
);

CREATE TABLE dbo.county (
	CountyID int NOT NULL,
	CountyName varchar(100),
	FIPSCode int,
	StateProvinceID int NOT NULL,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	PRIMARY KEY (CountyID)
);

CREATE TABLE dbo.exDate (
	exDateID int IDENTITY(1,1) NOT NULL,
	rRuleID int NOT NULL,
	date datetime NOT NULL,
	type varchar(6) NOT NULL,
	PRIMARY KEY (exDateID)
);

CREATE TABLE dbo.ExperienceLevel (
	ExperienceLevelID int IDENTITY(1,1) NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	ExperienceLevelName varchar(140) NOT NULL,
	ExperienceLevelDescription varchar(140),
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	PRIMARY KEY (CountryID,ExperienceLevelID,LanguageID)
);

CREATE TABLE dbo.Gender (
	GenderID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	GenderSingular nvarchar(16) NOT NULL,
	GenderPlural nvarchar(16) NOT NULL,
	SubjectPronoun varchar(25),
	ObjectPronoun varchar(25),
	PossesivePronoun varchar(25),
	PRIMARY KEY (CountryID,GenderID,LanguageID)
);

CREATE TABLE dbo.institution (
	InstitutionID int IDENTITY(1,1) NOT NULL,
	DeptOfEdInstitutionID varchar(25),
	InstitutionName varchar(200) NOT NULL,
	InstitutionAddress varchar(200),
	InstitutionCity varchar(100),
	InstitutionState varchar(25),
	StateProvinceID int,
	InstitutionZip varchar(25),
	InstitutionPhone varchar(25),
	InstitutionOPEID varchar(25),
	InstitutionIPEDSUnitID varchar(25),
	InstitutionURL varchar(2083),
	CountryID int,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	PRIMARY KEY (InstitutionID)
);

CREATE TABLE dbo.language (
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	LanguageName varchar(50) NOT NULL,
	Active bit,
	LanguageCode varchar(2),
	CreatedDate datetime,
	UpdatedDate datetime,
	ModifiedBy varchar(25),
	PRIMARY KEY (CountryID,LanguageID)
);

CREATE TABLE dbo.languagelevel (
	LanguageLevelID int IDENTITY(1,1) NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	LanguageLevelName varchar(140) NOT NULL,
	LanguageLevelDescription varchar(2000),
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	PRIMARY KEY (CountryID,LanguageID,LanguageLevelID)
);

CREATE TABLE dbo.licensecertification (
	LicenseCertificationID int NOT NULL,
	StateProvinceID int NOT NULL,
	CountryID int NOT NULL,
	LicenseCertificationType varchar(100) NOT NULL,
	LicenseCertificationTypeDescription varchar(5000),
	LicenseCertificationAuthority varchar(500),
	VerificationWebsiteURL varchar(2078),
	HowToGetLicensedURL varchar(2078),
	OptionGroup varchar(50),
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	PRIMARY KEY (LicenseCertificationID)
);

CREATE TABLE dbo.Messages (
	MessageID int IDENTITY(1,1) NOT NULL,
	ThreadID int NOT NULL,
	MessageTypeID int NOT NULL,
	AuxID int,
	AuxT nvarchar(50),
	BodyText varchar(5000) NOT NULL,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(50) NOT NULL,
	SentByUserId int DEFAULT ((0)) NOT NULL,
	PRIMARY KEY (MessageID)
);

CREATE TABLE dbo.messagethreadstatus (
	MessageThreadStatusID int NOT NULL,
	MessageThreadStatusName varchar(25) NOT NULL,
	MessageThreadStatusDescription varchar(100),
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	MessageStatusColor varchar(7) NOT NULL,
	PRIMARY KEY (MessageThreadStatusID)
);

CREATE TABLE dbo.messagetype (
	MessageTypeID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	MessageTypeName varchar(50),
	MessageTypeDescription varchar(200),
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	PRIMARY KEY (CountryID,LanguageID,MessageTypeID)
);

CREATE TABLE dbo.MessagingThreads (
	ThreadID int IDENTITY(1,1) NOT NULL,
	CustomerUserID int NOT NULL,
	ProviderUserID int NOT NULL,
	PositionID int,
	MessageThreadStatusID int NOT NULL,
	Subject nvarchar(100),
	LastMessageID int,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(50) NOT NULL,
	PRIMARY KEY (ThreadID)
);

CREATE TABLE dbo.positionbackgroundcheck (
	PositionID int NOT NULL,
	BackgroundCheckID varchar(25) NOT NULL,
	StateProvinceID varchar(25) NOT NULL,
	CountryID varchar(25) NOT NULL,
	Required bit NOT NULL,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	PRIMARY KEY (BackgroundCheckID,CountryID,PositionID,StateProvinceID)
);

CREATE TABLE dbo.positionlicense (
	PositionID int NOT NULL,
	LicenseCertificationID varchar(25) NOT NULL,
	StateProvinceID varchar(25) NOT NULL,
	CountryID varchar(25) NOT NULL,
	Required bit NOT NULL,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	PRIMARY KEY (CountryID,LicenseCertificationID,PositionID,StateProvinceID)
);

CREATE TABLE dbo.positionpackageserviceattributecategory (
	PositionID int NOT NULL,
	ServiceAttributeCategoryID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	CreateDate datetime DEFAULT ('sysdate') NOT NULL,
	UpdatedDate datetime DEFAULT ('sysdate') NOT NULL,
	ModifiedBy varchar(25) DEFAULT ('sys') NOT NULL,
	Active bit DEFAULT ((1)) NOT NULL,
	PRIMARY KEY (CountryID,LanguageID,PositionID,ServiceAttributeCategoryID)
);

CREATE TABLE dbo.positionpricingtype (
	PositionID int NOT NULL,
	PricingTypeID int NOT NULL,
	ClientTypeID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	PRIMARY KEY (ClientTypeID,CountryID,LanguageID,PositionID,PricingTypeID)
);

CREATE TABLE dbo.positionratings (
	PositionID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	Rating1 varchar(25) NOT NULL,
	Rating2 varchar(25) NOT NULL,
	Rating3 varchar(25) NOT NULL,
	Rating4 varchar(25),
	Rating1FormDescription varchar(1000),
	Rating2FormDescription varchar(1000),
	Rating3FormDescription varchar(1000),
	Rating4FormDescription varchar(1000),
	Rating1ProfileDescription varchar(1000),
	Rating2ProfileDescription varchar(1000),
	Rating3ProfileDescription varchar(1000),
	Rating4ProfileDescription varchar(1000),
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	PRIMARY KEY (CountryID,LanguageID,PositionID)
);

CREATE TABLE dbo.positions (
	PositionID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	PositionSingular varchar(200),
	PositionPlural varchar(200),
	Aliases varchar(200),
	PositionDescription varchar(2000),
	CreatedDate datetime,
	UpdatedDate datetime,
	ModifiedBy varchar(2),
	GovID varchar(20),
	GovPosition varchar(200),
	GovPositionDescription varchar(2000),
	Active bit,
	DisplayRank int,
	PositionSearchDescription varchar(1000),
	AttributesComplete bit DEFAULT ((0)) NOT NULL,
	StarRatingsComplete bit DEFAULT ((0)) NOT NULL,
	PricingTypeComplete bit DEFAULT ((0)) NOT NULL,
	EnteredByUserID int,
	Approved bit,
	CanBeRemote bit DEFAULT ((0)) NOT NULL,
	PRIMARY KEY (CountryID,LanguageID,PositionID)
);

CREATE TABLE dbo.postalcode (
	PostalCodeID int NOT NULL,
	PostalCode varchar(25),
	City varchar(250),
	StateProvinceID int NOT NULL,
	CountryID int NOT NULL,
	Latitude float(53),
	Longitude float(53),
	TimeZone decimal(18),
	DST bit,
	Location varchar(250),
	PostalCodeType varchar(50),
	CreatedDate datetime,
	UpdatedDate datetime,
	ModifiedBy varchar(25),
	PRIMARY KEY (PostalCodeID)
);

CREATE TABLE dbo.PricingGroups (
	PricingGroupID int NOT NULL,
	InternalGroupName varchar(50) NOT NULL,
	SelectionTitle varchar(100) NOT NULL,
	SummaryTitle varchar(100) NOT NULL,
	DynamicSummaryTitle varchar(100) NOT NULL,
	LanguageID int,
	CountryID int,
	PRIMARY KEY (PricingGroupID)
);

CREATE TABLE dbo.pricingSummary (
	PricingSummaryID int NOT NULL,
	PricingSummaryRevision int DEFAULT ((1)) NOT NULL,
	ServiceDurationMinutes int,
	FirstSessionDurationMinutes int,
	SubtotalPrice decimal(7,2),
	FeePrice decimal(7,2),
	TotalPrice decimal(7,2),
	PFeePrice decimal(7,2) DEFAULT ((0)),
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	SubtotalRefunded decimal(7,2),
	FeeRefunded decimal(7,2),
	TotalRefunded decimal(7,2),
	DateRefunded datetime,
	PRIMARY KEY (PricingSummaryID,PricingSummaryRevision)
);

CREATE TABLE dbo.pricingSummaryDetail (
	PricingSummaryID int NOT NULL,
	PricingSummaryRevision int NOT NULL,
	ServiceProfessionalServiceID int NOT NULL,
	ServiceProfessionalDataInput varchar(100),
	ClientDataInput varchar(500),
	HourlyPrice decimal(5,2),
	Price decimal(7,2),
	ServiceDurationMinutes int,
	FirstSessionDurationMinutes int,
	ServiceName varchar(50) NOT NULL,
	ServiceDescription varchar(1000),
	NumberOfSessions int NOT NULL,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	PRIMARY KEY (PricingSummaryID,PricingSummaryRevision,ServiceProfessionalServiceID)
);

CREATE TABLE dbo.pricingtype (
	PricingTypeID int NOT NULL,
	LanguageID int DEFAULT ((1)) NOT NULL,
	CountryID int DEFAULT ((1)) NOT NULL,
	Description varchar(50),
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(50) NOT NULL,
	Active bit DEFAULT ((1)) NOT NULL,
	DisplayRank int DEFAULT ((0)) NOT NULL,
	PRIMARY KEY (CountryID,LanguageID,PricingTypeID)
);

CREATE TABLE dbo.PricingVariableDefinition (
	PricingVariableID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	PositionID int NOT NULL,
	PricingTypeID int NOT NULL,
	InternalName varchar(60) NOT NULL,
	IsProviderVariable bit DEFAULT ((0)) NOT NULL,
	IsCustomerVariable bit DEFAULT ((0)) NOT NULL,
	DataType varchar(50) NOT NULL,
	VariableLabel nvarchar(100),
	VariableLabelPopUp nvarchar(200),
	VariableNameSingular nvarchar(60),
	VariableNamePlural nvarchar(60),
	NumberIncludedLabel nvarchar(100),
	NumberIncludedLabelPopUp nvarchar(200),
	HourlySurchargeLabel nvarchar(100),
	MinNumberAllowedLabel nvarchar(100),
	MinNumberAllowedLabelPopUp nvarchar(200),
	MaxNumberAllowedLabel nvarchar(100),
	MaxNumberAllowedLabelPopUp nvarchar(200),
	CalculateWithVariableID int,
	Active bit DEFAULT ((1)) NOT NULL,
	CreatedDate datetime DEFAULT (getdate()) NOT NULL,
	UpdatedDate datetime DEFAULT (getdate()) NOT NULL,
	ModifiedBy varchar(25) DEFAULT ('sys') NOT NULL,
	MinMaxValuesList nvarchar(max),
	PRIMARY KEY (CountryID,LanguageID,PositionID,PricingTypeID,PricingVariableID)
);

CREATE TABLE dbo.PricingVariableValue (
	PricingVariableID int NOT NULL,
	ProviderPackageID int NOT NULL,
	UserID int NOT NULL,
	PricingEstimateID int NOT NULL,
	PricingEstimateRevision int NOT NULL,
	Value varchar(100) NOT NULL,
	ProviderNumberIncluded decimal(7,2),
	ProviderMinNumberAllowed decimal(7,2),
	ProviderMaxNumberAllowed decimal(7,2),
	CreatedDate datetime DEFAULT (getdate()) NOT NULL,
	UpdatedDate datetime DEFAULT (getdate()) NOT NULL,
	ModifiedBy varchar(25) DEFAULT ('sys') NOT NULL,
	Active bit DEFAULT ((1)) NOT NULL,
	PRIMARY KEY (PricingEstimateID,PricingEstimateRevision,PricingVariableID,ProviderPackageID,UserID)
);

CREATE TABLE dbo.providerpackage (
	ProviderPackageID int IDENTITY(1,1) NOT NULL,
	PricingTypeID int,
	ProviderUserID int NOT NULL,
	PositionID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	ProviderPackageName varchar(50) NOT NULL,
	ProviderPackageDescription varchar(1000),
	ProviderPackagePrice decimal(7,2),
	ProviderPackageServiceDuration int NOT NULL,
	FirstTimeClientsOnly bit DEFAULT ((0)) NOT NULL,
	NumberOfSessions int DEFAULT ((1)) NOT NULL,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	IsAddOn bit DEFAULT ((0)) NOT NULL,
	PriceRate decimal(7,2),
	PriceRateUnit nvarchar(30),
	IsPhone bit DEFAULT ((0)) NOT NULL,
	PRIMARY KEY (ProviderPackageID)
);

CREATE TABLE dbo.providerpackagedetail (
	ProviderPackageID int NOT NULL,
	ServiceAttributeID int NOT NULL,
	CreatedDate datetime DEFAULT ('sysdate') NOT NULL,
	UpdatedDate datetime DEFAULT ('sysdate') NOT NULL,
	ModifiedBy varchar(25) DEFAULT ('sys') NOT NULL,
	Active bit DEFAULT ((1)) NOT NULL,
	PRIMARY KEY (ProviderPackageID,ServiceAttributeID)
);

CREATE TABLE dbo.ProviderPaymentAccount (
	ProviderUserID int NOT NULL,
	MerchantAccountID nvarchar(100) NOT NULL,
	Status nvarchar(50) NOT NULL,
	Message nvarchar(400),
	bt_signature nvarchar(max),
	bt_payload nvarchar(max),
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	PRIMARY KEY (ProviderUserID)
);

CREATE TABLE dbo.providerpaymentpreference (
	ProviderUserID int NOT NULL,
	ProviderPaymentPreferenceTypeID int NOT NULL,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	Modifiedby varchar(25) NOT NULL,
	Verified bit DEFAULT ((0)) NOT NULL,
	AccountName varchar(100),
	ABANumber numeric(9),
	LastThreeAccountDigits varchar(64),
	PRIMARY KEY (ProviderUserID)
);

CREATE TABLE dbo.providerpaymentpreferencetype (
	ProviderPaymentPreferenceTypeID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	ProviderPaymentPreferenceTypeName varchar(50) NOT NULL,
	ProviderPaymentPreferenceTypeDescription varchar(300),
	DependsOnID int,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	PRIMARY KEY (CountryID,LanguageID,ProviderPaymentPreferenceTypeID)
);

CREATE TABLE dbo.providerservicephoto (
	ProviderServicePhotoID int IDENTITY(1,1) NOT NULL,
	UserID int NOT NULL,
	PositionID int NOT NULL,
	PhotoCaption varchar(50),
	PhotoAddress varchar(2073) NOT NULL,
	RankPosition int NOT NULL,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	IsPrimaryPhoto bit NOT NULL,
	PRIMARY KEY (ProviderServicePhotoID)
);

CREATE TABLE dbo.providertaxform (
	ProviderUserID int NOT NULL,
	FullName varchar(200) NOT NULL,
	BusinessName varchar(200),
	StreetApt varchar(100) NOT NULL,
	City varchar(100) NOT NULL,
	PostalCodeID int,
	StateProvinceID int NOT NULL,
	CountryID int NOT NULL,
	TaxEntityTypeID int NOT NULL,
	ExemptPayee bit NOT NULL,
	TINTypeID varchar(25) NOT NULL,
	Signature varchar(200) NOT NULL,
	UserIPAddress varchar(500) NOT NULL,
	DateTimeSubmitted datetime NOT NULL,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25),
	Active bit NOT NULL,
	LastThreeTINDigits varchar(64),
	PRIMARY KEY (ProviderUserID)
);

CREATE TABLE dbo.providertransaction (
	ProviderUserID int NOT NULL,
	PaymentPreferencyTypeID int NOT NULL,
	ProcessorTransactionID varchar(255),
	AccountTypeID int,
	CreatedDate datetime,
	UpdatedDate datetime,
	ModifiedBy varchar(50),
	ProviderTransactionID int NOT NULL,
	BookingID int NOT NULL,
	PaymentProcessorFees decimal(5),
	PRIMARY KEY (ProviderTransactionID)
);

CREATE TABLE dbo.ReferralSource (
	ReferralSourceID int NOT NULL,
	Name nvarchar(80) NOT NULL,
	PRIMARY KEY (ReferralSourceID)
);

CREATE TABLE dbo.rRule (
	rRuleID int IDENTITY(1,1) NOT NULL,
	vEventID int NOT NULL,
	class varchar(12) DEFAULT ('public') NOT NULL,
	created datetime DEFAULT (getutcdate()) NOT NULL,
	description nvarchar(max),
	dtStart datetime NOT NULL,
	dtEnd datetime,
	duration varchar(20),
	geoLat float(53),
	geoLng float(53),
	lastModified datetime DEFAULT (getutcdate()) NOT NULL,
	location nvarchar(max),
	organizerCN nvarchar(50),
	organizerMailTo nvarchar(100),
	seq int DEFAULT ((0)) NOT NULL,
	status varchar(9) DEFAULT ('confirmed') NOT NULL,
	summary nvarchar(75),
	transparent bit DEFAULT ((0)) NOT NULL,
	freq varchar(8) DEFAULT ('daily') NOT NULL,
	until datetime,
	"count" int,
	interval int DEFAULT ((1)) NOT NULL,
	bySecond varchar(170),
	byMinute varchar(170),
	byHour varchar(61),
	byDay varchar(35),
	byMonthDay varchar(200),
	byYearDay varchar(3078),
	byWeekNo varchar(353),
	byMonth varchar(29),
	wkSt char(2) DEFAULT ('mo'),
	PRIMARY KEY (rRuleID)
);

CREATE TABLE dbo.serviceaddress (
	AddressID int NOT NULL,
	UserID int NOT NULL,
	PositionID int NOT NULL,
	ServicesPerformedAtLocation bit DEFAULT ((0)) NOT NULL,
	TravelFromLocation bit DEFAULT ((0)) NOT NULL,
	ServiceRadiusFromLocation varchar(25),
	TransportType int DEFAULT ((1)),
	PreferredAddress bit DEFAULT ((0)) NOT NULL,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	PRIMARY KEY (AddressID,PositionID,UserID)
);

CREATE TABLE dbo.serviceattribute (
	ServiceAttributeID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	SourceID int DEFAULT (NULL),
	Name varchar(100),
	ServiceAttributeDescription varchar(2000),
	CreateDate datetime,
	UpdatedDate datetime,
	ModifiedBy varchar(45),
	Active bit,
	DisplayRank int DEFAULT ((1)) NOT NULL,
	PositionReference int,
	EnteredByUserID int,
	Approved bit,
	PRIMARY KEY (CountryID,LanguageID,ServiceAttributeID)
);

CREATE TABLE dbo.serviceattributecategory (
	ServiceAttributeCategoryID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	ServiceAttributeCategory varchar(200),
	CreateDate datetime,
	UpdatedDate datetime,
	ModifiedBy varchar(20),
	Active bit,
	SourceID int,
	PricingOptionCategory bit,
	ServiceAttributeCategoryDescription varchar(500),
	RequiredInput bit NOT NULL,
	SideBarCategory bit DEFAULT ((0)) NOT NULL,
	EligibleForPackages bit DEFAULT ((0)) NOT NULL,
	DisplayRank int DEFAULT ((1)) NOT NULL,
	PositionReference int,
	BookingPathSelection bit DEFAULT ((0)) NOT NULL,
	PRIMARY KEY (CountryID,LanguageID,ServiceAttributeCategoryID)
);

CREATE TABLE dbo.ServiceAttributeExperienceLevel (
	UserID int NOT NULL,
	PositionID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	ExperienceLevelID int NOT NULL,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	PRIMARY KEY (CountryID,LanguageID,PositionID,UserID)
);

CREATE TABLE dbo.ServiceAttributeLanguageLevel (
	UserID int NOT NULL,
	PositionID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	ServiceAttributeID int NOT NULL,
	LanguageLevelID int NOT NULL,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	PRIMARY KEY (CountryID,LanguageID,PositionID,ServiceAttributeID,UserID)
);

CREATE TABLE dbo.servicecategory (
	ServiceCategoryID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	Name varchar(45),
	Description varchar(350),
	CreatedDate datetime,
	UpdatedDate datetime,
	ModifiedBy varchar(2),
	Active bit,
	ImagePath varchar(200),
	headline varchar(250),
	PRIMARY KEY (CountryID,LanguageID,ServiceCategoryID)
);

CREATE TABLE dbo.servicecategoryposition (
	ServiceCategoryID int NOT NULL,
	PositionID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	Rank int DEFAULT ((1)) NOT NULL,
	CreateDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active int DEFAULT ((1)) NOT NULL,
	PRIMARY KEY (CountryID,LanguageID,PositionID,ServiceCategoryID)
);

CREATE TABLE dbo.servicecategorypositionattribute (
	PositionID int NOT NULL,
	ServiceAttributeCategoryID int NOT NULL,
	ServiceAttributeID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	CreateDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(20) NOT NULL,
	Active bit DEFAULT ((1)) NOT NULL,
	EnteredByUserID int,
	Approved bit,
	PRIMARY KEY (CountryID,LanguageID,PositionID,ServiceAttributeCategoryID,ServiceAttributeID)
);

CREATE TABLE dbo.serviceestimatevars (
	ServiceEstimateVarID int IDENTITY(1,1) NOT NULL,
	PositionID int NOT NULL,
	EstimateVarID int NOT NULL,
	PricingTypeID int NOT NULL,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(50) NOT NULL,
	PRIMARY KEY (EstimateVarID,PositionID,PricingTypeID)
);

CREATE TABLE dbo.ServiceProfessionalClient (
	ServiceProfessionalUserID int NOT NULL,
	ClientUserID int NOT NULL,
	NotesAboutClient ntext DEFAULT ('') NOT NULL,
	ReferralSourceID int NOT NULL,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	Active bit NOT NULL,
	PRIMARY KEY (ClientUserID,ServiceProfessionalUserID)
);

CREATE TABLE dbo.servicesubcategory (
	ServiceSubCategoryID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	Name varchar(45),
	Description varchar(250),
	CreatedDate datetime,
	UpdatedDate datetime,
	ModifiedBy varchar(2),
	Active bit,
	ServiceCategoryID int,
	Rank int,
	RankQuery varchar(200),
	PRIMARY KEY (CountryID,LanguageID,ServiceSubCategoryID)
);

CREATE TABLE dbo.stateprovince (
	StateProvinceID int NOT NULL,
	StateProvinceName varchar(100),
	StateProvinceCode varchar(25),
	CountryID int NOT NULL,
	RegionCode varchar(25),
	PostalCodePrefix varchar(25),
	PRIMARY KEY (StateProvinceID)
);

CREATE TABLE dbo.status (
	StatusID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	StatusName varchar(50),
	StatusDescription varchar(400),
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	PRIMARY KEY (CountryID,LanguageID,StatusID)
);

CREATE TABLE dbo.sysdiagrams (
	name nvarchar(128) NOT NULL,
	principal_id int NOT NULL,
	diagram_id int IDENTITY(1,1) NOT NULL,
	version int,
	definition varbinary(max),
	PRIMARY KEY (diagram_id)
);

CREATE TABLE dbo.taxentitytype (
	TaxEntityTypeID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	TaxEntityTypeName varchar(75),
	TaxEntityTypeDescription varchar(300),
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	PRIMARY KEY (CountryID,LanguageID,TaxEntityTypeID)
);

CREATE TABLE dbo.tintype (
	TINTypeID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	TINTypeAbbr nvarchar(10) NOT NULL,
	TINTypeName nvarchar(70) NOT NULL,
	TINTypeDescription nvarchar(200),
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	PRIMARY KEY (CountryID,LanguageID,TINTypeID)
);

CREATE TABLE dbo.transporttype (
	TransportTypeID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	TransportTypeName varchar(50) NOT NULL,
	TransportTypeDescription varchar(300),
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	PRIMARY KEY (CountryID,LanguageID,TransportTypeID)
);

CREATE TABLE dbo.UserAlert (
	UserID int NOT NULL,
	PositionID int NOT NULL,
	AlertID int NOT NULL,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	CompletedDate datetime,
	Active bit NOT NULL,
	AlertQuery varchar(1000),
	Dismissed bit DEFAULT ((0)) NOT NULL,
	PRIMARY KEY (AlertID,PositionID,UserID)
);

CREATE TABLE dbo.userbackgroundcheck (
	UserID int NOT NULL,
	BackgroundCheckID int NOT NULL,
	CreatedDate datetime NOT NULL,
	ModifiedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	StatusID int NOT NULL,
	Summary varchar(200),
	VerifiedBy varchar(25),
	LastVerifiedDate datetime,
	PRIMARY KEY (BackgroundCheckID,UserID)
);

CREATE TABLE dbo.usereducation (
	UserEducationID int IDENTITY(1,1) NOT NULL,
	UserID int NOT NULL,
	InstitutionID int NOT NULL,
	DegreeCertificate varchar(200) NOT NULL,
	FieldOfStudy varchar(200) NOT NULL,
	FromYearAttended numeric(4),
	ToYearAttended numeric(4),
	CreatedDate datetime NOT NULL,
	ModifiedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	VerifiedDate datetime,
	VerifiedBy varchar(25),
	Active bit NOT NULL,
	PRIMARY KEY (UserEducationID)
);

CREATE TABLE dbo.userlicenseverification (
	ProviderUserID int NOT NULL,
	PositionID int NOT NULL,
	LicenseCertificationID int NOT NULL,
	LicenseCertificationURL varchar(2073),
	LastName varchar(100) NOT NULL,
	FirstName varchar(100) NOT NULL,
	MiddleInitial varchar(1),
	SecondLastName varchar(100),
	BusinessName varchar(200),
	LicenseCertificationNumber varchar(100),
	City varchar(100) NOT NULL,
	CountyID int NOT NULL,
	StateProvinceID int NOT NULL,
	CountryID int NOT NULL,
	CreatedDate datetime NOT NULL,
	ModifiedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	StatusID int NOT NULL,
	LicenseStatus varchar(50),
	ExpirationDate datetime,
	IssueDate datetime,
	Actions varchar(200),
	Comments varchar(500),
	VerifiedBy varchar(25),
	LastVerifiedDate datetime,
	PRIMARY KEY (LicenseCertificationID,PositionID,ProviderUserID)
);

CREATE TABLE dbo.userprofile (
	UserId int IDENTITY(1,1) NOT NULL,
	Email nvarchar(254) NOT NULL,
	PRIMARY KEY (UserId)
);

CREATE TABLE dbo.userprofilepositions (
	UserID int NOT NULL,
	PositionID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	CreateDate datetime,
	UpdatedDate datetime,
	ModifiedBy varchar(3),
	Active bit,
	PositionIntro varchar(2000),
	StatusID int DEFAULT ((1)) NOT NULL,
	CancellationPolicyID int,
	additionalinfo1 nvarchar(500),
	additionalinfo2 nvarchar(500),
	additionalinfo3 nvarchar(500),
	InstantBooking bit DEFAULT ((0)) NOT NULL,
	PRIMARY KEY (CountryID,LanguageID,PositionID,UserID)
);

CREATE TABLE dbo.userprofileserviceattributes (
	UserID int NOT NULL,
	PositionID int NOT NULL,
	ServiceAttributeCategoryID int NOT NULL,
	ServiceAttributeID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	CreateDate datetime,
	UpdatedDate datetime,
	ModifiedBy varchar(3),
	Active bit,
	PRIMARY KEY (CountryID,LanguageID,PositionID,ServiceAttributeCategoryID,ServiceAttributeID,UserID)
);

CREATE TABLE dbo.UserReviews (
	BookingID int NOT NULL,
	CustomerUserID int NOT NULL,
	ProviderUserID int NOT NULL,
	PositionID int NOT NULL,
	PrivateReview nvarchar(1000),
	PublicReview nvarchar(500),
	Rating1 tinyint,
	Rating2 tinyint,
	Rating3 tinyint,
	Rating4 tinyint,
	Answer1 bit,
	Answer2 bit,
	Answer1Comment nvarchar(1000),
	Answer2Comment nvarchar(1000),
	ServiceHours decimal(18,5) DEFAULT ((0)),
	HelpfulReviewCount bigint DEFAULT ((0)),
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(50) NOT NULL,
	PRIMARY KEY (BookingID,CustomerUserID,PositionID,ProviderUserID)
);

CREATE TABLE dbo.UserReviewScores (
	UserID int NOT NULL,
	PositionID int NOT NULL,
	TotalRatings bigint,
	Rating1 decimal(18,2),
	Rating2 decimal(18,2),
	Rating3 decimal(18,2),
	Rating4 decimal(18,2),
	Answer1 bigint,
	Answer2 bigint,
	ServiceHours decimal(18,2),
	LastRatingDate datetime,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(50) NOT NULL,
	PRIMARY KEY (PositionID,UserID)
);

CREATE TABLE dbo.users (
	UserID int NOT NULL,
	FirstName varchar(50) NOT NULL,
	MiddleIn varchar(1) NOT NULL,
	LastName varchar(145) NOT NULL,
	SecondLastName varchar(145) NOT NULL,
	NickName varchar(50),
	PublicBio varchar(4000),
	GenderID int NOT NULL,
	PreferredLanguageID int,
	PreferredCountryID int,
	IsProvider bit NOT NULL,
	IsCustomer bit NOT NULL,
	IsMember bit DEFAULT ((0)) NOT NULL,
	IsAdmin bit DEFAULT ((0)) NOT NULL,
	IsCollaborator bit DEFAULT ((0)) NOT NULL,
	Photo varchar(150),
	MobilePhone varchar(20),
	AlternatePhone varchar(20),
	CanReceiveSms bit DEFAULT ((0)) NOT NULL,
	ProviderProfileURL varchar(2078),
	ProviderWebsiteURL varchar(2078),
	SMSBookingCommunication bit DEFAULT ((1)) NOT NULL,
	PhoneBookingCommunication bit DEFAULT ((1)) NOT NULL,
	LoconomicsMarketingCampaigns bit DEFAULT ((1)) NOT NULL,
	ProfileSEOPermission bit DEFAULT ((1)) NOT NULL,
	CreatedDate datetime,
	UpdatedDate datetime,
	ModifiedBy varchar(50),
	Active bit,
	LoconomicsCommunityCommunication bit DEFAULT ((1)) NOT NULL,
	IAuthZumigoVerification bit,
	IAuthZumigoLocation bit,
	LoconomicsDBMCampaigns bit DEFAULT ((1)) NOT NULL,
	AccountStatusID int DEFAULT ((1)) NOT NULL,
	CoBrandedPartnerPermissions bit DEFAULT ((1)) NOT NULL,
	MarketingSource varchar(2055),
	BookCode varchar(64),
	OnboardingStep varchar(60),
	BirthMonthDay int,
	BirthMonth int,
	BusinessName nvarchar(145),
	AlternativeEmail nvarchar(56),
	ReferredByUserID int,
	SignupDevice nvarchar(20),
	PRIMARY KEY (UserID)
);

CREATE TABLE dbo.usersignup (
	UserId int IDENTITY(1,1) NOT NULL,
	Email nvarchar(56) NOT NULL,
	FirstName varchar(25),
	Position varchar(25),
	UserType bit NOT NULL,
	CreatedDate datetime,
	PRIMARY KEY (UserId)
);

CREATE TABLE dbo.UserStats (
	UserID int NOT NULL,
	ResponseTimeMinutes decimal(18,2),
	LastLoginTime datetime,
	LastActivityTime datetime,
	PRIMARY KEY (UserID)
);

CREATE TABLE dbo.userverification (
	UserID int NOT NULL,
	VerificationID int NOT NULL,
	PositionID int DEFAULT ((0)) NOT NULL,
	DateVerified datetime NOT NULL,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	VerifiedBy varchar(25) NOT NULL,
	LastVerifiedDate datetime NOT NULL,
	Active bit NOT NULL,
	VerificationStatusID int NOT NULL,
	Comments varchar(2000),
	PRIMARY KEY (PositionID,UserID,VerificationID)
);

CREATE TABLE dbo.verification (
	VerificationID int NOT NULL,
	VerificationType varchar(100) NOT NULL,
	VerificationDescription varchar(1000) NOT NULL,
	VerificationProcess varchar(500),
	Icon varchar(15),
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	CreatedDate datetime NOT NULL,
	ModifiedDate datetime NOT NULL,
	ModifiedBy varchar(25),
	Active bit NOT NULL,
	VerificationCategoryID int NOT NULL,
	RankPosition int,
	SummaryGroup varchar(20),
	PRIMARY KEY (CountryID,LanguageID,VerificationID)
);

CREATE TABLE dbo.verificationcategory (
	VerificationCategoryID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	VerificationCategoryName varchar(100) NOT NULL,
	VerificationCategoryDescription varchar(1000),
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	RankPosition int,
	PRIMARY KEY (CountryID,LanguageID,VerificationCategoryID)
);

CREATE TABLE dbo.verificationstatus (
	VerificationStatusID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	VerificationStatusName varchar(50) NOT NULL,
	VerificationStatusDisplayDescription varchar(300),
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(25) NOT NULL,
	Active bit NOT NULL,
	PRIMARY KEY (CountryID,LanguageID,VerificationStatusID)
);

CREATE TABLE dbo.vEvent (
	vEventID int IDENTITY(1,1) NOT NULL,
	title nvarchar(200) NOT NULL,
	PRIMARY KEY (vEventID)
);

CREATE TABLE dbo.VOCElement (
	VOCElementID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	VOCElementName varchar(100),
	ScoreStartValue int,
	ScoreMidValue int,
	ScoreEndValue int,
	ScoreStartLabel varchar(25),
	ScoreMidLabel varchar(25),
	ScoreEndLabel varchar(25),
	CreateDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(3) NOT NULL,
	Active bit NOT NULL,
	PRIMARY KEY (CountryID,LanguageID,VOCElementID)
);

CREATE TABLE dbo.VOCExperienceCategory (
	VOCExperienceCategoryID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	VOCExperienceCategoryName varchar(50),
	VOCExperienceCategoryDescription varchar(200),
	CreateDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(3) NOT NULL,
	Active bit NOT NULL,
	PRIMARY KEY (CountryID,LanguageID,VOCExperienceCategoryID)
);

CREATE TABLE dbo.VOCFeedback (
	VOCFeedbackID int IDENTITY(1,1) NOT NULL,
	VOCElementID int NOT NULL,
	VOCExperienceCategoryID int NOT NULL,
	UserID int NOT NULL,
	Feedback text NOT NULL,
	VOCFlag1 varchar(50),
	VOCFlag2 varchar(50),
	VOCFlag3 varchar(50),
	VOCFlag4 varchar(50),
	UserDevice text,
	ZenDeskTicketNumber int,
	ProviderUserID int,
	ProviderPositionID int,
	CreatedDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(3) NOT NULL,
	PRIMARY KEY (VOCFeedbackID)
);

CREATE TABLE dbo.VOCFlag (
	VOCFlagID int NOT NULL,
	LanguageID int NOT NULL,
	CountryID int NOT NULL,
	VOCFlagName varchar(50) NOT NULL,
	VOCFlagNDescription varchar(500),
	CreateDate datetime NOT NULL,
	UpdatedDate datetime NOT NULL,
	ModifiedBy varchar(3) NOT NULL,
	Active bit NOT NULL,
	PRIMARY KEY (CountryID,LanguageID,VOCFlagID)
);

CREATE TABLE dbo.VOCScores (
	VOCScoresID int NOT NULL,
	UserID int NOT NULL,
	VOCElementID int NOT NULL,
	Score int NOT NULL,
	Date datetime NOT NULL,
	ProviderUserID int,
	ProviderPositionID int,
	UserDevice varchar(100),
	VOCExperienceCategoryID int NOT NULL,
	PRIMARY KEY (Date,Score,UserID,VOCElementID,VOCScoresID)
);

CREATE TABLE dbo.webpages_FacebookCredentials (
	UserId int NOT NULL,
	FacebookId bigint NOT NULL
);

CREATE TABLE dbo.webpages_Membership (
	UserId int NOT NULL,
	CreateDate datetime,
	ConfirmationToken nvarchar(128),
	IsConfirmed bit DEFAULT ((0)),
	LastPasswordFailureDate datetime,
	PasswordFailuresSinceLastSuccess int DEFAULT ((0)) NOT NULL,
	Password nvarchar(128) NOT NULL,
	PasswordChangedDate datetime,
	PasswordSalt nvarchar(128) NOT NULL,
	PasswordVerificationToken nvarchar(128),
	PasswordVerificationTokenExpirationDate datetime,
	PRIMARY KEY (UserId)
);

CREATE TABLE dbo.webpages_OAuthMembership (
	Provider nvarchar(30) NOT NULL,
	ProviderUserId nvarchar(100) NOT NULL,
	UserId int NOT NULL,
	PRIMARY KEY (Provider,ProviderUserId)
);

CREATE TABLE dbo.webpages_Roles (
	RoleId int IDENTITY(1,1) NOT NULL,
	RoleName nvarchar(256) NOT NULL,
	PRIMARY KEY (RoleId)
);

CREATE TABLE dbo.webpages_UsersInRoles (
	UserId int NOT NULL,
	RoleId int NOT NULL,
	PRIMARY KEY (RoleId,UserId)
);

ALTER TABLE dbo.booking
	ADD FOREIGN KEY (ParentBookingID) 
	REFERENCES booking (BookingID);

ALTER TABLE dbo.booking
	ADD FOREIGN KEY (CountryID) 
	REFERENCES positions (CountryID);

ALTER TABLE dbo.booking
	ADD FOREIGN KEY (JobTitleID) 
	REFERENCES positions (PositionID);

ALTER TABLE dbo.booking
	ADD FOREIGN KEY (LanguageID) 
	REFERENCES positions (LanguageID);

ALTER TABLE dbo.booking
	ADD FOREIGN KEY (BookingStatusID) 
	REFERENCES bookingStatus (BookingStatusID);

ALTER TABLE dbo.booking
	ADD FOREIGN KEY (BookingTypeID) 
	REFERENCES bookingType (BookingTypeID);

ALTER TABLE dbo.booking
	ADD FOREIGN KEY (CancellationPolicyID) 
	REFERENCES cancellationpolicy (CancellationPolicyID);

ALTER TABLE dbo.booking
	ADD FOREIGN KEY (CountryID) 
	REFERENCES positions (CountryID);

ALTER TABLE dbo.booking
	ADD FOREIGN KEY (LanguageID) 
	REFERENCES positions (LanguageID);

ALTER TABLE dbo.booking
	ADD FOREIGN KEY (ServiceAddressID) 
	REFERENCES address (AddressID);

ALTER TABLE dbo.booking
	ADD FOREIGN KEY (ServiceDateID) 
	REFERENCES CalendarEvents (Id);

ALTER TABLE dbo.booking
	ADD FOREIGN KEY (AlternativeDate1ID) 
	REFERENCES CalendarEvents (Id);

ALTER TABLE dbo.booking
	ADD FOREIGN KEY (AlternativeDate2ID) 
	REFERENCES CalendarEvents (Id);

ALTER TABLE dbo.booking
	ADD FOREIGN KEY (PricingSummaryID) 
	REFERENCES pricingSummary (PricingSummaryID);

ALTER TABLE dbo.booking
	ADD FOREIGN KEY (PricingSummaryRevision) 
	REFERENCES pricingSummary (PricingSummaryRevision);

ALTER TABLE dbo.booking
	ADD FOREIGN KEY (ClientUserID) 
	REFERENCES users (UserID);

ALTER TABLE dbo.booking
	ADD FOREIGN KEY (ServiceProfessionalUserID) 
	REFERENCES users (UserID);

ALTER TABLE dbo.booking
	ADD FOREIGN KEY (AwaitingResponseFromUserID) 
	REFERENCES users (UserID);



ALTER TABLE dbo.CalendarEventComments
	ADD FOREIGN KEY (IdEvent) 
	REFERENCES CalendarEvents (Id);



ALTER TABLE dbo.CalendarEventExceptionsPeriod
	ADD FOREIGN KEY (IdException) 
	REFERENCES CalendarEventExceptionsPeriodsList (Id);



ALTER TABLE dbo.CalendarEventExceptionsPeriodsList
	ADD FOREIGN KEY (IdEvent) 
	REFERENCES CalendarEvents (Id);



ALTER TABLE dbo.CalendarEventRecurrencesPeriod
	ADD FOREIGN KEY (IdRecurrence) 
	REFERENCES CalendarEventRecurrencesPeriodList (Id);



ALTER TABLE dbo.CalendarEventRecurrencesPeriodList
	ADD FOREIGN KEY (IdEvent) 
	REFERENCES CalendarEvents (Id);



ALTER TABLE dbo.CalendarEvents
	ADD FOREIGN KEY (EventType) 
	REFERENCES CalendarEventType (EventTypeId);

ALTER TABLE dbo.CalendarEvents
	ADD FOREIGN KEY (CalendarAvailabilityTypeID) 
	REFERENCES CalendarAvailabilityType (CalendarAvailabilityTypeID);



ALTER TABLE dbo.CalendarEventsAttendees
	ADD FOREIGN KEY (IdEvent) 
	REFERENCES CalendarEvents (Id);



ALTER TABLE dbo.CalendarEventsContacts
	ADD FOREIGN KEY (IdEvent) 
	REFERENCES CalendarEvents (Id);



ALTER TABLE dbo.CalendarReccurrence
	ADD FOREIGN KEY (EventID) 
	REFERENCES CalendarEvents (Id);

ALTER TABLE dbo.CalendarReccurrence
	ADD FOREIGN KEY (Frequency) 
	REFERENCES CalendarRecurrenceFrequencyTypes (ID);



ALTER TABLE dbo.CalendarReccurrenceFrequency
	ADD FOREIGN KEY (CalendarReccursiveID) 
	REFERENCES CalendarReccurrence (ID);



ALTER TABLE dbo.CalendarRecurrenceFrequencyTypes
	ADD FOREIGN KEY (ID) 
	REFERENCES CalendarRecurrenceFrequencyTypes (ID);



ALTER TABLE dbo.county
	ADD FOREIGN KEY (StateProvinceID) 
	REFERENCES stateprovince (StateProvinceID);



ALTER TABLE dbo.exDate
	ADD FOREIGN KEY (rRuleID) 
	REFERENCES rRule (rRuleID);



ALTER TABLE dbo.institution
	ADD FOREIGN KEY (StateProvinceID) 
	REFERENCES stateprovince (StateProvinceID);



ALTER TABLE dbo.licensecertification
	ADD FOREIGN KEY (StateProvinceID) 
	REFERENCES stateprovince (StateProvinceID);



ALTER TABLE dbo.Messages
	ADD FOREIGN KEY (MessageTypeID) 
	REFERENCES messagetype (MessageTypeID);

ALTER TABLE dbo.Messages
	ADD FOREIGN KEY (ThreadID) 
	REFERENCES MessagingThreads (ThreadID);



ALTER TABLE dbo.MessagingThreads
	ADD FOREIGN KEY (MessageThreadStatusID) 
	REFERENCES messagethreadstatus (MessageThreadStatusID);



ALTER TABLE dbo.positionpricingtype
	ADD FOREIGN KEY (CountryID) 
	REFERENCES pricingtype (CountryID);

ALTER TABLE dbo.positionpricingtype
	ADD FOREIGN KEY (LanguageID) 
	REFERENCES pricingtype (LanguageID);

ALTER TABLE dbo.positionpricingtype
	ADD FOREIGN KEY (PricingTypeID) 
	REFERENCES pricingtype (PricingTypeID);

ALTER TABLE dbo.positionpricingtype
	ADD FOREIGN KEY (ClientTypeID) 
	REFERENCES clienttype (CllientTypeID);

ALTER TABLE dbo.positionpricingtype
	ADD FOREIGN KEY (CountryID) 
	REFERENCES pricingtype (CountryID);

ALTER TABLE dbo.positionpricingtype
	ADD FOREIGN KEY (LanguageID) 
	REFERENCES pricingtype (LanguageID);

ALTER TABLE dbo.positionpricingtype
	ADD FOREIGN KEY (CountryID) 
	REFERENCES pricingtype (CountryID);

ALTER TABLE dbo.positionpricingtype
	ADD FOREIGN KEY (LanguageID) 
	REFERENCES pricingtype (LanguageID);

ALTER TABLE dbo.positionpricingtype
	ADD FOREIGN KEY (PositionID) 
	REFERENCES positions (PositionID);



ALTER TABLE dbo.postalcode
	ADD FOREIGN KEY (StateProvinceID) 
	REFERENCES stateprovince (StateProvinceID);



ALTER TABLE dbo.pricingSummary
	ADD FOREIGN KEY (PricingSummaryID) 
	REFERENCES pricingSummary (PricingSummaryID);

ALTER TABLE dbo.pricingSummary
	ADD FOREIGN KEY (PricingSummaryRevision) 
	REFERENCES pricingSummary (PricingSummaryRevision);



ALTER TABLE dbo.rRule
	ADD FOREIGN KEY (vEventID) 
	REFERENCES vEvent (vEventID);



ALTER TABLE dbo.serviceaddress
	ADD FOREIGN KEY (UserID) 
	REFERENCES users (UserID);



ALTER TABLE dbo.ServiceProfessionalClient
	ADD FOREIGN KEY (ServiceProfessionalUserID) 
	REFERENCES users (UserID);

ALTER TABLE dbo.ServiceProfessionalClient
	ADD FOREIGN KEY (ClientUserID) 
	REFERENCES users (UserID);

ALTER TABLE dbo.ServiceProfessionalClient
	ADD FOREIGN KEY (ReferralSourceID) 
	REFERENCES ReferralSource (ReferralSourceID);



ALTER TABLE dbo.servicesubcategory
	ADD FOREIGN KEY (CountryID) 
	REFERENCES servicecategory (CountryID);

ALTER TABLE dbo.servicesubcategory
	ADD FOREIGN KEY (LanguageID) 
	REFERENCES servicecategory (LanguageID);

ALTER TABLE dbo.servicesubcategory
	ADD FOREIGN KEY (ServiceCategoryID) 
	REFERENCES servicecategory (ServiceCategoryID);



ALTER TABLE dbo.userbackgroundcheck
	ADD FOREIGN KEY (UserID) 
	REFERENCES users (UserID);



ALTER TABLE dbo.usereducation
	ADD FOREIGN KEY (InstitutionID) 
	REFERENCES institution (InstitutionID);

ALTER TABLE dbo.usereducation
	ADD FOREIGN KEY (UserID) 
	REFERENCES users (UserID);



ALTER TABLE dbo.userlicenseverification
	ADD FOREIGN KEY (LicenseCertificationID) 
	REFERENCES licensecertification (LicenseCertificationID);

ALTER TABLE dbo.userlicenseverification
	ADD FOREIGN KEY (ProviderUserID) 
	REFERENCES users (UserID);



ALTER TABLE dbo.userprofilepositions
	ADD FOREIGN KEY (CountryID) 
	REFERENCES positions (CountryID);

ALTER TABLE dbo.userprofilepositions
	ADD FOREIGN KEY (LanguageID) 
	REFERENCES positions (LanguageID);

ALTER TABLE dbo.userprofilepositions
	ADD FOREIGN KEY (PositionID) 
	REFERENCES positions (PositionID);

ALTER TABLE dbo.userprofilepositions
	ADD FOREIGN KEY (UserID) 
	REFERENCES users (UserID);

ALTER TABLE dbo.userprofilepositions
	ADD FOREIGN KEY (StatusID) 
	REFERENCES accountstatus (AccountStatusID);



ALTER TABLE dbo.userprofileserviceattributes
	ADD FOREIGN KEY (CountryID) 
	REFERENCES userprofilepositions (CountryID);

ALTER TABLE dbo.userprofileserviceattributes
	ADD FOREIGN KEY (LanguageID) 
	REFERENCES userprofilepositions (LanguageID);

ALTER TABLE dbo.userprofileserviceattributes
	ADD FOREIGN KEY (PositionID) 
	REFERENCES userprofilepositions (PositionID);

ALTER TABLE dbo.userprofileserviceattributes
	ADD FOREIGN KEY (UserID) 
	REFERENCES userprofilepositions (UserID);



ALTER TABLE dbo.users
	ADD FOREIGN KEY (UserID) 
	REFERENCES users (UserID);



ALTER TABLE dbo.UserStats
	ADD FOREIGN KEY (UserID) 
	REFERENCES users (UserID);



ALTER TABLE dbo.webpages_UsersInRoles
	ADD FOREIGN KEY (RoleId) 
	REFERENCES webpages_Roles (RoleId);

ALTER TABLE dbo.webpages_UsersInRoles
	ADD FOREIGN KEY (UserId) 
	REFERENCES userprofile (UserId);



CREATE VIEW vwServiceCategoryPositionAttributes AS

	SELECT TOP 100 PERCENT
		d.PositionID
		,se.ServiceAttributeCategoryID
		,s.ServiceAttributeID
		,s.LanguageID
		,s.CountryID
		
		,d.Active As ServiceCategoryPositionAttributeActive
		,s.Active As ServiceAttributeActive
		,se.Active As ServiceAttributeCategoryActive
		
		,s.SourceID As ServiceAttributeSourceID
		,s.Name As ServiceAttributeName
		,s.ServiceAttributeDescription
		
		,s.DisplayRank As ServiceAttributeDisplayRank
		
		,se.ServiceAttributeCategory
		,se.ServiceAttributeCategoryDescription
		
		,se.SourceID As ServiceAttributeCategorySourceID
		,se.PricingOptionCategory
		,se.RequiredInput As ServiceAttributeCategoryRequiredInput
		,se.EligibleForPackages
		,se.SideBarCategory
		,se.DisplayRank As ServiceAttributeCategoryDisplayRank

	FROM servicecategorypositionattribute d
	  join serviceattribute s 
	  on d.ServiceAttributeID = s.ServiceAttributeID 
	  join serviceattributecategory se 
	  on d.ServiceAttributeCategoryID = se.ServiceAttributeCategoryID 
	  and d.LanguageID = se.LanguageID
	  and d.CountryID = se.CountryID
	  and se.LanguageID = s.LanguageID
	  and se.CountryID = s.CountryID

	ORDER BY s.DisplayRank ASC, s.Name ASC;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2013-02-27
-- Description:	Gets users records with some
-- common extra information and its contact
-- and location data, getting location from
-- its address list that is assigned as 'home'
-- location.
-- =============================================
CREATE VIEW vwUsersContactData AS

    SELECT
        -- Basic data
        a.UserID
        ,UP.Email
        ,a.CreatedDate As MemberSinceDate

        -- Name
        ,FirstName
        ,LastName
        ,SecondLastName
        ,MiddleIn
        ,(dbo.fx_concat(dbo.fx_concat(dbo.fx_concat(FirstName, dbo.fx_concatBothOrNothing(MiddleIn, '.', ''), ' '), LastName, ' '), SecondLastName, ' ')) As FullName
    
        -- DEPRECATED PHOTO
        ,Photo

        -- User Type
        ,coalesce(IsAdmin, cast(0 as bit)) As IsAdmin
        ,IsCustomer
        ,IsProvider
        ,AccountStatusID

        -- Only Providers:
        ,(CASE WHEN IsProvider=1 AND (
            SELECT count(*) FROM UserProfilePositions As UPS WHERE UPS.UserID = A.UserID AND UPS.Active=1
            ) > 0 THEN Cast(1 As bit)
            ELSE Cast(0 As bit)
        END) As IsActiveProvider

        ,ProviderWebsiteURL
        ,ProviderProfileURL

        -- Contact data
        ,MobilePhone
        ,AlternatePhone
    
        -- Address
        ,L.AddressLine1
        ,L.AddressLine2
        ,L.City
        ,L.StateProvinceID
        ,SP.StateProvinceName
        ,SP.StateProvinceCode
        ,L.CountryID
        ,PC.PostalCode
        ,L.PostalCodeID

        -- Personal data
        ,PublicBio
        ,A.GenderID
        ,GenderSingular
        ,GenderPlural
        ,SubjectPronoun
        ,ObjectPronoun
        ,PossesivePronoun
                                    
        -- Some preferences
        ,PreferredLanguageID
        ,PreferredCountryID
        ,IAuthZumigoVerification
        ,IAuthZumigoLocation

    FROM Users A
         INNER JOIN
        UserProfile As UP
          ON UP.UserID = A.UserID
         INNER JOIN
        Gender As G
          ON G.GenderID = A.GenderID
          	AND G.LanguageID = A.PreferredLanguageID  
          	AND G.CountryID = A.PreferredCountryID                                
         LEFT JOIN
        Address As L
          ON L.UserID = A.UserID
            AND L.AddressTypeID = 1 -- Only one address with type 1 (home) can exists
         LEFT JOIN
        StateProvince As SP
          ON SP.StateProvinceID = L.StateProvinceID
         LEFT JOIN
        PostalCode As PC
          ON PC.PostalCodeID = L.PostalCodeID
;

CREATE INDEX idx_clienttype ON dbo.clienttype (CllientTypeID,CountryID);

CREATE INDEX idx_Messages ON dbo.Messages (MessageTypeID);

CREATE INDEX idx_positions ON dbo.positions (PositionID);


	CREATE FUNCTION dbo.fn_diagramobjects() 
	RETURNS int
	WITH EXECUTE AS N'dbo'
	AS
	BEGIN
		declare @id_upgraddiagrams		int
		declare @id_sysdiagrams			int
		declare @id_helpdiagrams		int
		declare @id_helpdiagramdefinition	int
		declare @id_creatediagram	int
		declare @id_renamediagram	int
		declare @id_alterdiagram 	int 
		declare @id_dropdiagram		int
		declare @InstalledObjects	int

		select @InstalledObjects = 0

		select 	@id_upgraddiagrams = object_id(N'dbo.sp_upgraddiagrams'),
			@id_sysdiagrams = object_id(N'dbo.sysdiagrams'),
			@id_helpdiagrams = object_id(N'dbo.sp_helpdiagrams'),
			@id_helpdiagramdefinition = object_id(N'dbo.sp_helpdiagramdefinition'),
			@id_creatediagram = object_id(N'dbo.sp_creatediagram'),
			@id_renamediagram = object_id(N'dbo.sp_renamediagram'),
			@id_alterdiagram = object_id(N'dbo.sp_alterdiagram'), 
			@id_dropdiagram = object_id(N'dbo.sp_dropdiagram')

		if @id_upgraddiagrams is not null
			select @InstalledObjects = @InstalledObjects + 1
		if @id_sysdiagrams is not null
			select @InstalledObjects = @InstalledObjects + 2
		if @id_helpdiagrams is not null
			select @InstalledObjects = @InstalledObjects + 4
		if @id_helpdiagramdefinition is not null
			select @InstalledObjects = @InstalledObjects + 8
		if @id_creatediagram is not null
			select @InstalledObjects = @InstalledObjects + 16
		if @id_renamediagram is not null
			select @InstalledObjects = @InstalledObjects + 32
		if @id_alterdiagram  is not null
			select @InstalledObjects = @InstalledObjects + 64
		if @id_dropdiagram is not null
			select @InstalledObjects = @InstalledObjects + 128
		
		return @InstalledObjects 
	END
	;

/* Iago Lorenzo Salgueiro:
 * Concat two strings with a nexus
 * between if they are not null.
 * If some string is null or empty, only the
 * another will be retrived, without nexus
 */
CREATE function [dbo].[fx_concat] (
 @str1 varchar(8000),
 @str2 varchar(8000),
 @nexo varchar(8000) = ''
)
RETURNS varchar(8000)
AS
BEGIN
 DECLARE @ret varchar(8000)
 if @str1 is null OR @str1 like ''
  SET @ret = @str2
 else if @str2 is null OR @str2 like ''
  SET @ret = @str1
 else
  SET @ret = @str1 + @nexo + @str2

 if @ret is null
  SET @ret = ''

 return @ret

END;

/* Iago Lorenzo Salgueiro:
 * Concat two strings with a nexus
 * between if they are not null.
 * If some string is null or empty,
 * empty string is returned
 */
CREATE function [dbo].[fx_concatBothOrNothing] (
 @str1 varchar(8000),
 @str2 varchar(8000),
 @nexo varchar(8000) = ''
)
RETURNS varchar(8000)
AS
BEGIN
 DECLARE @ret varchar(8000)
 if @str1 is null OR @str1 like '' OR @str2 is null OR @str2 like ''
  SET @ret = ''
 else
  SET @ret = @str1 + @nexo + @str2

 return @ret

END;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Returns the @value if is not 
-- null, not empty and not a white spaces string
-- In that cases, the @default value is returned
-- Default can be null, empty, whitespaces
-- really or whatever you want.
-- =============================================
CREATE FUNCTION [dbo].[fx_IfNW]
(
	@value nvarchar(4000),
	@default nvarchar(4000)
)
RETURNS nvarchar(4000)
AS
BEGIN

	DECLARE @ret nvarchar(4000)

	IF @value is null OR @value like ''
		OR RTRIM(LTRIM(@value)) like ''
		SET @ret = @default
	ELSE
		SET @ret = @value

	RETURN @ret

END
;


CREATE FUNCTION [dbo].[fxCheckAlertAffectsUser] (
	@UserID int,
	@AlertID int
) RETURNS Bit
AS BEGIN
	DECLARE @IsProvider bit, @IsCustomer bit
	DECLARE @AlertTypeID int
	SELECT @IsProvider = IsProvider FROM Users WHERE UserID = @UserID
	SELECT @IsCustomer = IsCustomer FROM Users WHERE UserID = @UserID
	
	DECLARE @Checked bit
	SET @Checked = Cast (0 As bit)
	
	IF @IsProvider = 1 AND @AlertID IN (SELECT AlertID FROM Alert WHERE ProviderAlert = 1)
		SET @Checked = Cast (1 As bit)
	IF @IsCustomer = 1 AND @AlertID IN (SELECT AlertID FROM Alert WHERE CustomerAlert = 1)
		SET @Checked = Cast (1 As bit)
		
	RETURN @Checked
END
;

CREATE FUNCTION dbo.GetPositionString ( @UserID INT,@LangaugeID INT, @CountryID INT, @PositionCnt INT )

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
END;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2015-09-15
-- Description:	Checks if the payment account
-- to collect payments on the marketplace
-- bookings for a given userID is active.
-- =============================================
CREATE FUNCTION isMarketplacePaymentAccountActive
(
	@userID int
)
RETURNS bit
AS
BEGIN
	-- Declare the return variable here
	DECLARE @ret bit

	SET @ret = CASE WHEN EXISTS (
		SELECT	ProviderUserID
		FROM	ProviderPaymentAccount
		WHERE	ProviderUserID = @UserID
				 AND
				-- Braintree given status must be 'active' or 'pending'
                -- Allow for 'pending' is a small risk we take on 2013/12/11 https://github.com/dani0198/Loconomics/issues/408#issuecomment-30338668
				[Status] IN ('active', 'pending')
	) THEN CAST(1 as bit) ELSE CAST(0 as bit) END

	-- Return the result of the function
	RETURN @ret

END
;

-- =============================================
-- Author:		<Author,,Name>
-- Create date: <Create Date,,>
-- Description:	<Description,,>
-- =============================================
CREATE PROCEDURE dbo.CheckUserEmail
	-- Add the parameters for the stored procedure here
	@Email nvarchar(56)
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    SELECT Email FROM UserProfile WHERE LOWER(Email) = LOWER(@Email)
    
    
    
    
    
END
;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 16/04/2012
-- Description:	Create a Loconomics User as
-- only Customer profile and minimum information
-- (from the Register page or Facebook Login).
-- =============================================
CREATE PROCEDURE [dbo].[CreateCustomer]
	-- Add the parameters for the stored procedure here
	
		@UserID int,
		@Firstname varchar(45),
        @Lastname varchar(145),
		@Lang int,
		@CountryId int,
        @GenderID int = -1,
		@PublicBio varchar(500) = null,
		@Phone varchar(20) = null
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    INSERT INTO dbo.users (
		UserID,
		FirstName,
		LastName,
		MiddleIn,
		SecondLastName,
		GenderID,
		PreferredLanguageID,
		PreferredCountryID,
		PublicBio,
		IsProvider,
		IsCustomer,
		MobilePhone,
		CreatedDate,
		UpdatedDate,
		ModifiedBy,
		Active
	) VALUES (
		@UserID,
		@Firstname,
		@Lastname,
		'',
		'',
		coalesce(@GenderID, -1),
		@Lang,
		@CountryId,
		@PublicBio,
		0,
		1,
		@Phone,
		GETDATE(),
		GETDATE(),
		'SYS',
		1
	)
	
	-- Check alerts for the user to get its state updated
	EXEC TestAllUserAlerts @UserID
END
;


CREATE PROCEDURE [dbo].[CreateProviderFromUser] (
	@UserID int,
	@Firstname varchar(45),
    @Lastname varchar(145),
    @PostalCodeID int,
    @StateProvinceID int,
    @LangID int,
    @CountryID int,
    @emailcontact bit,
    @BookCode varchar(64)
) AS BEGIN
	
	
	SET NOCOUNT ON;
	UPDATE Users SET
		FirstName = coalesce(@FirstName, FirstName),
		LastName = coalesce(@LastName, LastName),
		PreferredLanguageID = coalesce(@LangID, PreferredLanguageID),
		PreferredCountryID = coalesce(@CountryID, PreferredCountryID),
		BookCode = @BookCode,
		IsProvider = 1,
		
		
		
		
		
		IsCustomer = (CASE WHEN (
			SELECT	count(*)
			FROM	BookingRequest
			WHERE	BookingRequest.CustomerUserID = @UserID
		) = 0 THEN Cast(0 As bit) ELSE Cast(1 As bit) END),
		UpdatedDate = getdate(),
		ModifiedBy = 'sys',
		Active = 1
	WHERE	UserID = @UserID
	
	
	EXEC SetHomeAddress @UserID, '', '', '', @StateProvinceID, @PostalCodeID, @CountryID, @LangID
	
	
	EXEC TestAllUserAlerts @UserID
END
;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-12-28
-- Description:	Allow fully remove a Booking 
-- Request and related records created for it
-- based on our general rules for booking 
-- invalidation and removing all.
-- This MUST NOT be used normally, only because
-- errors on system, corrupt bookings or testing
-- IMPORTANT: Procedure cannot Refund or Void
-- the Braintree transaction, the booking
-- TransactionID is returned to do it manually,
-- or use the app method LcData.Booking.InvalidateBookingRequest
-- previous deletion to ensure is done auto.
-- =============================================
CREATE PROCEDURE DeleteBookingRequest
	@BookingRequestID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @invalidOk int
	DECLARE @tranID varchar(250)
	DECLARE @returnMessage varchar(1000)
	
	-- Invalidate the booking request with the general procedure, with a temporary
	-- 'timed out' status, this ensure all related records not need are removed
	-- and all remains clean.
	EXEC @invalidOk = dbo.InvalidateBookingRequest @BookingRequestID, 3

	IF @invalidOk = 0 BEGIN
		-- Get TransactionID to be returned later
		SELECT	@tranID = coalesce(PaymentTransactionID, '__THERE IS NO TRANSACTION__')
		FROM	bookingrequest
		WHERE	BookingRequestID = @BookingRequestID

		-- Remove the request
		DELETE FROM bookingrequest WHERE BookingRequestID = @BookingRequestID
		
		SET @returnMessage = 'Braintree cannot be Refunded or Void from here, do it manually for the next TransactionID if is not a Test: ' + @tranID
	END ELSE
		SET @returnMessage = 'Not deleted, could not be Invalidated becuase error number: ' + Cast(coalesce(@invalidOk, -1) as varchar)

	SELECT @returnMessage As [Message]
	PRINT @returnMessage
END
;

/* CAUTION!
 * Delete all data from an user
 * account
 * TODO: need be update with all
 * the tables (calendar, pricing, etc.)
 */
-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 17/04/2012
-- Description:	Delete all data from an user
-- account
-- TODO: need be update with all
-- the tables (calendar, pricing, etc.)
-- =============================================
CREATE PROCEDURE [dbo].[DeleteUser]
	(
	@UserId int
	)
AS
	SET NOCOUNT ON

delete
FROM			UserAlert
WHERE userid = @UserID

delete
FROM            userlicenseverification
where provideruserid =  @UserId

delete
from	userstats
where userid = @userid

delete
from userbackgroundcheck
where userid = @userid

delete
from	serviceaddress
where addressid IN (
	select addressid
	from [address]
	where userid = @userid
)

delete
from	address
where userid = @userid

delete
from			booking
where clientuserid = @userid or serviceprofessionaluserid = @userid

delete
from			ServiceProfessionalClient
where clientuserid = @userid or serviceprofessionaluserid = @userid

delete
from			[messages]
where threadid IN (
	select threadid
	from messagingthreads
	where customeruserid = @userid or provideruserid = @userid
)

delete
FROM            messagingthreads
where provideruserid =  @UserId OR customeruserid = @UserID

delete
FROM            providerpaymentpreference
where provideruserid =  @UserId

delete
FROM            usereducation
where userid =  @UserId

delete
FROM            userreviews
where provideruserid =  @UserId OR customeruserId = @UserId

delete
FROM            providertaxform
where provideruserid =  @UserId

delete
FROM            userverification
where userid =  @UserId

delete
FROM            userprofileserviceattributes
where userid =  @UserId

delete
FROM            userprofilepositions
where userid =  @UserId

delete
FROM            userprofile
where userid =  @UserId

delete
FROM            users
where userid = @UserId

delete
FROM            webpages_usersinroles
where userid =  @UserId

delete
FROM            webpages_oauthmembership
where userid =  @UserId

delete
FROM            webpages_membership
where userid = @UserId

delete
FROM            webpages_facebookcredentials
where userid = @UserId
;

CREATE PROCEDURE DeleteUserPosition (
	@UserID int,
	@PositionID int
) AS BEGIN

delete from [ServiceAttributeLanguageLevel]
where userid = @UserID AND PositionID = @PositionID

delete from ServiceAttributeExperienceLevel
where userid = @UserID AND PositionID = @PositionID

delete from userprofileserviceattributes
where userid = @UserID AND PositionID = @PositionID

delete from userprofilepositions
where userid = @UserID AND PositionID = @PositionID

END;


CREATE PROCEDURE DelUserVerification
	@UserID int,
	@VerificationID int,
    @PositionID int = 0
AS
BEGIN
	DELETE FROM userverification
	WHERE UserID = @UserID
		AND VerificationID = @VerificationID
        AND PositionID = @PositionID
END
;

-- =============================================
-- Author:		<Author,,Name>
-- Create date: <Create Date,,>
-- Description:	<Description,,>
-- =============================================
CREATE PROCEDURE [dbo].[GetPosition]
	-- Add the parameters for the stored procedure here
	
	@PositionID int,
	@LanguageID int = 1,
	@CountryID int = 1

-- exec getuserprofile 2,14

AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    -- Insert statements for procedure here
			SELECT 
				PositionSingular,
				PositionDescription
			FROM dbo.positions b
			WHERE b.PositionID = @PositionID
			and b.LanguageID = @LanguageID
			and b.CountryID = @CountryID

END


;

-- =============================================
-- Author:		<Author,,Name>
-- Create date: <Create Date,,>
-- Description:	<Description,,>
-- =============================================
CREATE PROCEDURE [dbo].[GetPositions]
	-- Add the parameters for the stored procedure here
	@SearchTerm varchar(150),
	@LanguageID int = 1,
	@CountryID int = 1

--exec dbo.GetPositions '%Cleaner%',1,1
	
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    -- Insert statements for procedure here
	SELECT DISTINCT PositionSingular, PositionID, PositionDescription
	FROM positions 
	WHERE PositionSingular LIKE @SearchTerm 
		AND LanguageID = @LanguageID 
		AND CountryID = @CountryID
		AND Active = 1
	ORDER BY PositionSingular
END
;

CREATE PROCEDURE [dbo].[GetSearchResults]
@LanguageID int, @CountryID int, @SearchTerm varchar(300), @SubCategory varchar(300)
 WITH EXEC AS CALLER
AS

--EXEC dbo.GetSearchResults 1,1,'%',''

IF @SubCategory <> ''
BEGIN
	DECLARE @ServiceCategoryID AS INT

	SELECT @ServiceCategoryID = ServiceCategoryID 
	FROM servicecategory 
	WHERE Name = @SubCategory 
		AND LanguageID = @LanguageID 
		AND CountryID = @CountryID

	SELECT 
		d.UserID
		,d.FirstName
		,d.LastName
		,a.PositionID
		,c.PositionSingular
		,a.UpdatedDate
		,Positions=STUFF((SELECT ', ' + PositionSingular FROM Positions As P0 INNER JOIN UserProfilePositions As UP0 ON P0.PositionID = UP0.PositionID WHERE UP0.UserID = D.UserID AND P0.LanguageID = @LanguageID AND P0.CountryID = @CountryID FOR XML PATH('')) , 1 , 1 , '' )
		,S.Name as ServiceName 
	FROM dbo.users d 
	JOIN dbo.userprofilepositions a 
		ON d.UserID = a.UserID 
	JOIN  positions c 
		ON a.PositionID = c.PositionID
		AND a.LanguageID = c.LanguageID
		AND a.CountryID = c.CountryID
	JOIN dbo.servicecategoryposition SCP
		ON C.PositionID = SCP.PositionID
		AND a.LanguageID = SCP.LanguageID
		AND a.CountryID = SCP.CountryID
	JOIN dbo.servicecategory S
		ON SCP.ServiceCategoryID = S.ServiceCategoryID
		AND a.LanguageID = S.LanguageID
		AND a.CountryID = S.CountryID
	WHERE S.ServiceCategoryID = @ServiceCategoryID
		AND a.LanguageID = @LanguageID and a.CountryID = @CountryID
		AND d.Active = 1
		AND a.Active = 1
		AND a.StatusID = 1
		AND c.Active = 1
		AND s.Active = 1
		AND scp.Active = 1
		AND (
			@SearchTerm like ''
			 OR
			c.PositionSingular like @SearchTerm
			 OR
			c.PositionPlural like @SearchTerm
			 OR
			c.PositionDescription like @SearchTerm
			 OR
			c.Aliases like @SearchTerm
			 OR
			c.GovPosition like @SearchTerm
			 OR
			c.GovPositionDescription like @SearchTerm
		)
END

ELSE --IF @SearchTerm <> '%'
BEGIN
	SELECT 
		d.UserID
		,d.FirstName
		,d.LastName
		,a.PositionID
		,c.PositionSingular
		,a.UpdatedDate
		,Positions=STUFF((SELECT ', ' + PositionSingular FROM Positions As P0 INNER JOIN UserProfilePositions As UP0 ON P0.PositionID = UP0.PositionID WHERE UP0.UserID = D.UserID AND P0.LanguageID = @LanguageID AND P0.CountryID = @CountryID FOR XML PATH('')) , 1 , 1 , '' )
		--,rs.Rating1
		--,rs.Rating2
		--,rs.Rating3
		--,rs.Rating4 
	FROM dbo.users d 
	JOIN dbo.userprofilepositions a 
		ON d.UserID = a.UserID 
	JOIN  positions c 
		ON a.PositionID = c.PositionID 
		AND a.LanguageID = c.LanguageID
		AND a.CountryID = c.CountryID
	--LEFT JOIN dbo.UserReviewScores rs ON (d.UserID = rs.UserID)
	WHERE
		a.LanguageID = @LanguageID
		AND a.CountryID = @CountryID
		AND d.Active = 1
		AND a.Active = 1
		AND c.Active = 1
		AND (
			c.PositionSingular like @SearchTerm
			 OR
			c.PositionPlural like @SearchTerm
			 OR
			c.PositionDescription like @SearchTerm
			 OR
			c.Aliases like @SearchTerm
			 OR
			c.GovPosition like @SearchTerm
			 OR
			c.GovPositionDescription like @SearchTerm
			 OR
			a.PositionIntro like @SearchTerm
			 OR
			EXISTS (
				SELECT *
				FROM	UserProfileServiceAttributes As UA
						 INNER JOIN
						ServiceAttribute As SA
						  ON UA.ServiceAttributeID = SA.ServiceAttributeID
							AND UA.Active = 1
							AND SA.Active = 1
							AND SA.LanguageID = UA.LanguageID
							AND SA.CountryID = UA.CountryID
				WHERE
						UA.UserID = a.UserID
						AND UA.PositionID = a.PositionID
						AND UA.LanguageID = @LanguageID
						AND UA.CountryID = @CountryID
						AND (
						 SA.Name like @SearchTerm
						  OR
						 SA.ServiceAttributeDescription like @SearchTerm
						)
			)
		)
END;

-- =============================================
-- Author:		<Author,,Name>
-- Create date: <Create Date,,>
-- Description:	<Description,,>
-- =============================================
CREATE PROCEDURE [dbo].[GetServiceAttributeCategories]
	-- Add the parameters for the stored procedure here

	@PositionID int,
	@LanguageID int = 1,
	@CountryID int = 1,
	@OnlyBookingPathSelection bit = 0

-- exec GetServiceAttributeCategories 14,1,1

AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    -- Insert statements for procedure here
	   SELECT DISTINCT
	   a.DisplayRank,
	   a.ServiceAttributeCategoryID,
	   a.ServiceAttributeCategory as ServiceCat,
	   a.ServiceAttributeCategoryDescription,
	   a.RequiredInput,
	   a.SideBarCategory
	   FROM serviceattributecategory a
	   join servicecategorypositionattribute c
	   on a.ServiceAttributeCategoryID = c.ServiceAttributeCategoryID
	   and a.LanguageID = c.LanguageID
	   and a.CountryID = c.CountryID
	   WHERE  c.PositionID = @PositionID
	   and c.LanguageID  = @LanguageID
	   and c.CountryID = @CountryID
	   and (a.PricingOptionCategory is null OR a.PricingOptionCategory = 1)
	   -- only actived
	   and a.Active = 1
	   and c.Active = 1
	   -- booking path selection
	   and (@OnlyBookingPathSelection = 0 OR BookingPathSelection = 1)
	   ORDER BY a.DisplayRank ASC, a.ServiceAttributeCategory ASC
	   
	


END
;

-- =============================================
-- Author:		<Author,,Name>
-- Create date: <Create Date,,>
-- Description:	<Description,,>
-- =============================================
CREATE PROCEDURE [dbo].[GetServiceAttributes]
	-- Add the parameters for the stored procedure here

	@PositionID int,
	-- CategoryID can be Zero (0) to retrieve all attributes without regarding the category
	@ServiceAttributeCategoryID int,
	@LanguageID int = 1,
	@CountryID int = 1,
	@UserID int = 0,
	@OnlyUserChecked bit = 0

-- exec GetServiceAttributes 14,2,1,1

AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    -- Insert statements for procedure here
		  SELECT 
		  se.ServiceAttributeCategoryID, 
		  se.ServiceAttributeCategory as ServiceCat,
		  s.ServiceAttributeDescription,
		  s.ServiceAttributeID, 
		  s.Name as ServiceAttribute,
		  
		  -- iagosrl: added UserChecked to know if is an attribute
		  -- assigned to the @UserID
		  (case when @UserID <= 0 OR us.UserID is null then cast(0 as bit)
				else cast(1 as bit)
		  end) as UserChecked
		  ,coalesce(se.EligibleForPackages, cast(0 as bit)) As EligibleForPackages
		  
		  from servicecategorypositionattribute d
		  join serviceattribute s 
		  on d.ServiceAttributeID = s.ServiceAttributeID 
		  join serviceattributecategory se 
		  on d.ServiceAttributeCategoryID = se.ServiceAttributeCategoryID 
		  and d.LanguageID = se.LanguageID
		  and d.CountryID = se.CountryID
		  and se.LanguageID = s.LanguageID
		  and se.CountryID = s.CountryID
		  
		  -- iagosrl: I added param @UserID to optionally (left join) get
		  --  attributes selected by the user, not filtering else adding a
		  --  new result field 'UserChecked' as true/false
		  left join userprofileserviceattributes as us
		  on d.ServiceAttributeID = us.ServiceAttributeID
		  and d.ServiceAttributeCategoryID = us.ServiceAttributeCategoryID
		  and d.PositionID = us.PositionID
		  and d.LanguageID = us.LanguageID
		  and d.CountryID = us.CountryID
		  and us.Active = 1
		  and us.UserID = @UserID
		  
		  WHERE  d.PositionID = @PositionID  
		  -- iagosrl: 2012-07-20, added the possibility of value Zero of CategoryID parameter to retrieve position attributes from all position-mapped categories
		  and (@ServiceAttributeCategoryID = 0 OR d.ServiceAttributeCategoryID = @ServiceAttributeCategoryID)
		  and d.LanguageID  = @LanguageID
		  and d.CountryID = @CountryID
		  -- only actived
		  and d.Active = 1
		  and se.Active = 1
		  and s.Active = 1
		  and (@OnlyUserChecked = 0 OR us.UserID > 0)
		  ORDER BY s.DisplayRank ASC, s.Name ASC

END
;

CREATE PROC [dbo].[GetUserCalendarProviderAttributes]

@UserID int


as

SELECT AdvanceTime,MinTime,MaxTime,BetweenTime,UseCalendarProgram,CalendarType,CalendarURL, PrivateCalendarToken, IncrementsSizeInMinutes
FROM CalendarProviderAttributes
WHERE UserID = @UserID

;






CREATE PROC dbo.GetUserDetails

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
on a.userid = b.userid  where a.UserID = @UserID;

-- =============================================
-- Author:		<Author,,Name>
-- Create date: <Create Date,,>
-- Description:	<Description,,>
-- =============================================
CREATE PROCEDURE dbo.GetUserProfile
	-- Add the parameters for the stored procedure here
	@UserID int,
	@PositionID int,
	@LanguageID int = 1,
	@CountryID int = 1

-- exec getuserprofile 2,14

AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    -- Insert statements for procedure here
			SELECT 
			FirstName + ' ' + LastName as ProviderName,
			PostalCode,
			Photo,
			PreferredLanguageID,
			PreferredCountryID,
			ADD_Details 
			FROM users a 
			JOIN dbo.userprofilepositionadditional b 
			ON a.userid = b.userid  
			WHERE a.UserID = @UserID
			and b.PositionID = @PositionID
			and b.LanguageID = @LanguageID
			and b.CountryID = @CountryID

END


;


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
;

CREATE PROC [dbo].[InsertUserProfilePositions]

@UserID int,
@PositionID int,
@LanguageID int,
@CountryID int,
@CancellationPolicyID int,
@Intro varchar(400) = '',
@InstantBooking bit = 0

AS

DECLARE @ResultMessage varchar(50)

BEGIN TRY

	INSERT INTO userprofilepositions (
		UserID, PositionID, LanguageID, CountryID, CreateDate, UpdatedDate, ModifiedBy, Active, StatusID, PositionIntro, CancellationPolicyID, InstantBooking
	) VALUES(
		@UserID,@PositionID,@LanguageID,@CountryID, GETDATE(), GETDATE(), 'sys', 1, 2, @Intro, @CancellationPolicyID, @InstantBooking
	)
	
	-- Check alerts for the position to get its state updated
	EXEC TestAllUserAlerts @UserID, @PositionID

	SELECT  'Success' as Result

END TRY

BEGIN CATCH

 SET @ResultMessage =  ERROR_MESSAGE();

IF @ResultMessage like 'Violation of PRIMARY KEY%'
 
BEGIN

	-- SELECT 'You already have this position loaded' as Result

	IF EXISTS (SELECT * FROM UserProfilePositions WHERE
		UserID = @UserID AND PositionID = @PositionID
		AND LanguageID = @LanguageID AND CountryID = @CountryID
		AND Active = 0) BEGIN
		
		SELECT 'Position could not be added' As Result
		
	END ELSE BEGIN
	
		-- Enable this position and continue, no error
		UPDATE UserProfilePositions
		SET StatusID = 2
			,UpdatedDate = GETDATE()
			,ModifiedBy = 'sys'
			,PositionIntro = @Intro
			,CancellationPolicyID = @CancellationPolicyID
			,InstantBooking = @InstantBooking
		WHERE 
			UserID = @UserID AND PositionID = @PositionID
			AND LanguageID = @LanguageID AND CountryID = @CountryID
			
		-- Check alerts for the position to get its state updated
		EXEC TestAllUserAlerts @UserID, @PositionID

		SELECT  'Success' as Result
	END
END

ELSE
BEGIN

	SELECT 'Sorry, it appears we have an error: ' + @ResultMessage as Result
	
END

END CATCH
 
 
;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-12-28
-- Description:	Changes the state of a Booking
-- Request and clean related no need records
-- in a safety way, to don't allow orphans
-- records.
-- Based on the code initially created on 
-- LcData.Booking.cs.
-- Be careful with the passed StatusID, is not
-- checked to be one of the valid 'invalid
-- request' statuses.
-- =============================================
CREATE PROCEDURE InvalidateBookingRequest
	@BookingRequestID int
	,@BookingRequestStatusID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AddressID int

    BEGIN TRY
        BEGIN TRAN

        -- Get Service Address ID to be (maybe) removed later
        SELECT  @AddressID = AddressID
        FROM    BookingRequest
        WHERE   BookingRequestID = @BookingRequestID

        -- Removing CalendarEvents:
        DELETE FROM CalendarEvents
        WHERE ID IN (
            SELECT TOP 1 PreferredDateID FROM BookingRequest
            WHERE BookingRequestID = @BookingRequestID
            UNION
            SELECT TOP 1 AlternativeDate1ID FROM BookingRequest
            WHERE BookingRequestID = @BookingRequestID
            UNION
            SELECT TOP 1 AlternativeDate2ID FROM BookingRequest
            WHERE BookingRequestID = @BookingRequestID
        )

        /*
         * Updating Booking Request status, and removing references to the 
         * user selected dates.
         */
        UPDATE  BookingRequest
        SET     BookingRequestStatusID = @BookingRequestStatusID,
                PreferredDateID = null,
                AlternativeDate1ID = null,
                AlternativeDate2ID = null,
                AddressID = null,
                UpdatedDate = getdate()
        WHERE   BookingRequestID = @BookingRequestID

        -- Removing Service Address, if is not an user saved location (it has not AddressName)
        DELETE FROM ServiceAddress
        WHERE AddressID = @AddressID
              AND (SELECT count(*) FROM Address As A WHERE A.AddressID = @AddressID AND AddressName is null) = 1
        DELETE FROM Address
        WHERE AddressID = @AddressID
               AND
              AddressName is null

        COMMIT TRAN

        -- We return sucessful operation with Error=0
        SELECT 0 As Error
		RETURN 0
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRAN
        -- We return error number and message
        DECLARE @error int
        SET @error = ERROR_NUMBER()
        SELECT @error As Error, ERROR_MESSAGE() As ErrorMessage
        RETURN @error
    END CATCH
END
;






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
order by 2 asc;






CREATE PROC [dbo].[SearchCategories]

@LanguageID int = 1,
@CountryID int  = 1,
@ServiceCategoryID int = 1
as

--exec [dbo].[SearchCategories]

select  
ServiceSubCategoryID,
Name,
Rank as ServiceRank
from dbo.servicesubcategory
where LanguageID = @LanguageID and CountryID = @CountryID
and ServiceCategoryID = @ServiceCategoryID
and rank <=5



--b.positionid,  
--a.PositionSingular  as position  
--from positions a join servicecategoryposition  b   
--on a.positionid = b.positionid  
--join servicesubcategory c  on b.ServiceSubCategoryID = c.ServiceSubCategoryID    
--where a.LanguageID = @LanguageID and a.CountryID = @CountryID

;

CREATE PROC [dbo].[SearchCategoriesPositions]

@LanguageID int = 1,
@CountryID int  = 1,
@ServiceCategoryID int = 1,
@ServiceSubCategoryID int = 1
as

--exec [dbo].[SearchCategoriesPositions] 1,1

-- Need a rank attribute for each user position for preferred provider

SELECT  
c.ServiceSubCategoryID,
c.Name,
c.Rank as ServiceRank,
b.positionid,  
a.PositionSingular  as position,
tpur.PrivateReview,
tpur.PublicReview, 
tpur.Rating1,
tpur.Rating2,
tpur.Rating3,
MIN(up.UserID),
COUNT(DISTINCT BookingID) AS ReviewCount,
0 as VerificationsCount,
0 as LicensesCount

FROM  positions a 

LEFT JOIN servicecategoryposition  b   
  ON a.positionid = b.positionid  

LEFT JOIN servicesubcategory c  
  ON b.ServiceSubCategoryID = c.ServiceSubCategoryID  

LEFT JOIN dbo.userprofilepositions up
  ON a.positionid = up.PositionID
  AND a.LanguageID = up.LanguageID
  AND a.CountryID = up.CountryID

LEFT JOIN UserReviews ur
  ON a.PositionID = ur.PositionID
  AND up.UserID = ur.ProviderUserID

LEFT JOIN (SELECT TOP 1 ProviderUserID,
                        PositionID,
                        PrivateReview,
                        PublicReview ,
                        Rating1,
                        Rating2,
                        Rating3
           FROM dbo.UserReviews ORDER BY CreatedDate) tpur
           
on ur.PositionID = tpur.PositionID 
and ur.ProviderUserID = tpur.ProviderUserID

WHERE a.LanguageID = @LanguageID and a.CountryID = @CountryID
and c.ServiceCategoryID = @ServiceCategoryID
and c.ServiceSubCategoryID = @ServiceSubCategoryID
and c.rank <=5
GROUP BY c.ServiceSubCategoryID,
c.Name,
c.Rank,
b.positionid,  
a.PositionSingular,
tpur.PrivateReview,
tpur.PublicReview, 
tpur.Rating1,
tpur.Rating2,
tpur.Rating3
;

-- =============================================
-- Author:		<Author,,Name>
-- Create date: <Create Date,,>
-- Description:	<Description,,>
-- =============================================
CREATE PROCEDURE [dbo].[SearchPositions]
	-- Add the parameters for the stored procedure here
	@SearchTerm varchar(150),
	@LanguageID int = 1,
	@CountryID int = 1

--exec dbo.GetPositions '%Cleaner%',1,1
	
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    -- Insert statements for procedure here
	SELECT DISTINCT 
		c.PositionSingular, c.PositionID, c.PositionDescription
	FROM positions c
	WHERE  
		c.LanguageID = @LanguageID 
		AND c.CountryID = @CountryID
		AND c.Active = 1
		AND (c.Approved = 1 Or c.Approved is null) -- Avoid not approved, allowing pending (null) and approved (1)
		AND dbo.fx_IfNW(c.PositionSingular, null) is not null
		AND (
			c.PositionSingular like @SearchTerm
			 OR
			c.PositionPlural like @SearchTerm
			 OR
			c.PositionDescription like @SearchTerm
			 OR
			c.Aliases like @SearchTerm
			 OR
			c.GovPosition like @SearchTerm
			 OR
			c.GovPositionDescription like @SearchTerm
			 OR
			EXISTS (
				SELECT *
				FROM	ServiceCategoryPositionAttribute As SP
						 INNER JOIN
						ServiceAttribute As SA
						  ON SP.ServiceAttributeID = SA.ServiceAttributeID
							AND SP.Active = 1
							AND SA.Active = 1
							AND SA.LanguageID = SP.LanguageID
							AND SA.CountryID = SP.CountryID
				WHERE
						SP.PositionID = c.PositionID
						AND SA.LanguageID = @LanguageID
						AND SA.CountryID = @CountryID
						AND (
						 SA.Name like @SearchTerm
						  OR
						 SA.ServiceAttributeDescription like @SearchTerm
						)
			)
		)
		
	ORDER BY PositionSingular
END
;


-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2013-01-03
-- Description:	Get the list of positions 
-- inside the CategoryID given, for categorized
-- search results page
-- =============================================
CREATE PROCEDURE [dbo].[SearchPositionsByCategory]
	@LanguageID int
	,@CountryID int
	,@Category nvarchar(400)
	,@City nvarchar(400)
AS
BEGIN
	
	
	SET NOCOUNT ON;
	
	DECLARE @ServiceCategoryID AS INT
	SELECT @ServiceCategoryID = ServiceCategoryID 
	FROM servicecategory 
	WHERE Name = @Category
		AND LanguageID = @LanguageID 
		AND CountryID = @CountryID

    SELECT	P.PositionID
			,P.PositionPlural
			,P.PositionSingular
			,P.PositionDescription
			,P.PositionSearchDescription
			
			
			
			,coalesce((SELECT
				avg( (coalesce(UR2.Rating1, 0) + coalesce(UR2.Rating2, 0) + coalesce(UR2.Rating3, 0)) / 3) As AVR
			  FROM UserReviews As UR2
				INNER JOIN
				  UserProfilePositions As UP2
				  ON UP2.PositionID = UR2.PositionID
				    AND UR2.ProviderUserID = UP2.UserID
					AND UP2.LanguageID = @LanguageID
					AND UP2.CountryID = @CountryID
					AND UP2.Active = 1
					AND UP2.StatusID = 1
			  WHERE UR2.PositionID = P.PositionID
			), 0) As AverageRating
			
			
			,sum(ur.TotalRatings) As TotalRatings
			,avg(US.ResponseTimeMinutes) As AverageResponseTimeMinutes
			,avg(PHR.HourlyRate) As AverageHourlyRate
			,count(UP.UserID) As ProvidersCount
			
	FROM	Positions As P
			 INNER JOIN
			ServiceCategoryPosition As SCP
			  ON P.PositionID = SCP.PositionID
				AND P.LanguageID = SCP.LanguageID
				AND P.CountryID = SCP.CountryID
				
			 LEFT JOIN
			UserProfilePositions As UP
			  ON UP.PositionID = P.PositionID
			    AND UP.LanguageID = P.LanguageID
			    AND UP.CountryID = P.CountryID
			    AND UP.Active = 1
			    AND UP.StatusID = 1
			 LEFT JOIN
			UserReviewScores AS UR
			  ON UR.UserID = UP.UserID
				AND UR.PositionID = UP.PositionID
			 LEFT JOIN
			UserStats As US
			  ON US.UserID = UP.UserID
			 LEFT JOIN
			(SELECT	ProviderPackage.ProviderUserID As UserID
					,ProviderPackage.PositionID
					,min(PriceRate) As HourlyRate
					,LanguageID
					,CountryID
			 FROM	ProviderPackage
			 WHERE	ProviderPackage.Active = 1
					AND ProviderPackage.PriceRateUnit like 'HOUR' 
					AND ProviderPackage.PriceRate > 0
			 GROUP BY	ProviderPackage.ProviderUserID, ProviderPackage.PositionID
						,LanguageID, CountryID
			) As PHR
			  ON PHR.UserID = UP.UserID
			    AND PHR.PositionID = UP.PositionID
				AND PHR.LanguageID = P.LanguageID
				AND PHR.CountryID = P.CountryID
	WHERE
			SCP.ServiceCategoryID = @ServiceCategoryID
			 AND
			SCP.Active = 1
			 AND
			P.Active = 1
			 AND
			P.LanguageID = @LanguageID
			 AND
			P.CountryID = @CountryID
	GROUP BY P.PositionID, P.PositionPlural, P.PositionSingular, P.PositionDescription, P.PositionSearchDescription, P.DisplayRank
	ORDER BY ProvidersCount DESC, P.DisplayRank, P.PositionPlural
END;

CREATE PROCEDURE [dbo].[SearchProvidersByPositionSingular]
@LanguageID int, @CountryID int, @PositionSingular varchar(300)
 WITH EXEC AS CALLER
AS

--EXEC dbo.GetSearchResults 1,1,'Cleaner'

	SELECT 
		d.UserID
		,d.FirstName
		,d.LastName
		,a.PositionID
		,c.PositionSingular
		,a.UpdatedDate
		,Positions=STUFF((SELECT ', ' + PositionSingular FROM Positions As P0 INNER JOIN UserProfilePositions As UP0 ON P0.PositionID = UP0.PositionID WHERE UP0.UserID = D.UserID AND P0.LanguageID = @LanguageID AND P0.CountryID = @CountryID FOR XML PATH('')) , 1 , 1 , '' )
		--,rs.Rating1
		--,rs.Rating2
		--,rs.Rating3
		--,rs.Rating4 
	FROM dbo.users d 
	JOIN dbo.userprofilepositions a 
		ON d.UserID = a.UserID 
	JOIN  positions c 
		ON a.PositionID = c.PositionID 
		AND a.LanguageID = c.LanguageID
		AND a.CountryID = c.CountryID
	--LEFT JOIN dbo.UserReviewScores rs ON (d.UserID = rs.UserID)
	WHERE
		a.LanguageID = @LanguageID
		AND a.CountryID = @CountryID
		AND d.Active = 1
		AND a.Active = 1
		AND a.StatusID = 1
		AND c.Active = 1
		AND c.PositionSingular like @PositionSingular;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro	
-- Create date: 2013-01-07
-- Description:	Get a short list of providers
-- in the specific position for the search page
-- results. List is limited to the top most
-- rated providers.
-- Minimum information is returned, not full
-- user information.
-- =============================================
CREATE PROCEDURE SearchTopProvidersByPosition
	@LanguageID int,
	@CountryID int,
	@PositionID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	SELECT TOP 8 UserID
		,FirstName
		--, Rating -- returning Rating for testing only
	FROM (

		SELECT	UP.UserID
				,U.FirstName
				,((coalesce(Rating1, 0) + coalesce(Rating2, 0) + coalesce(Rating3, 0)) / 3) As Rating
		FROM	Users As U
				 INNER JOIN
				UserProfilePositions As UP
				  ON UP.UserID = U.UserID
				 LEFT JOIN
				UserReviewScores AS UR
				  ON UR.UserID = UP.UserID
					AND UR.PositionID = UP.PositionID
		WHERE
				U.Active = 1
				 AND
				UP.PositionID = @PositionID
				 AND
				UP.Active = 1
				 AND
				UP.StatusID = 1
				 AND
				UP.LanguageID = @LanguageID
				 AND
				UP.CountryID = @CountryID
	) As T
	-- The top best rated providers:
	ORDER BY Rating DESC 

END
;

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

END;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2013-04-08
-- Description:	Sets the data for the user
-- special 'Home' address, updating the
-- address or inserting a new record if
-- not exists
-- =============================================
CREATE PROCEDURE SetHomeAddress
	@UserID int,
	@AddressLine1 varchar(100),
	@AddressLine2 varchar(100),
	@City varchar(100),
	@StateProvinceID int,
	@PostalCodeID int,
	@CountryID int,
	@LanguageID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    UPDATE  Address WITH (serializable)
    SET     AddressLine1 = @AddressLine1
            ,AddressLine2 = @AddressLine2
            ,City = @City
            ,StateProvinceID = @StateProvinceID
            ,PostalCodeID = @PostalCodeID
            ,CountryID = @CountryID

            ,Active = 1
            ,UpdatedDate = getdate()
            ,ModifiedBy = 'sys'
    WHERE   UserId = @UserID
                AND
            AddressTypeID = 1 -- Ever Type: Home

    IF @@rowcount = 0
    BEGIN
        DECLARE @AddressName nvarchar(50)
        SELECT @AddressName = AddressType
        FROM AddressType
        WHERE AddressTypeID = 1 -- Home
                AND LanguageID = @LanguageID
                AND CountryID = @CountryID

        INSERT INTO Address (UserID, AddressTypeID, AddressName,
            AddressLine1, AddressLine2, City, StateProvinceID, PostalCodeID, CountryID,
            Active, CreatedDate, UpdatedDate, ModifiedBy)
        VALUES (@UserID, 1 /* Type: Home */, @AddressName, 
            @AddressLine1, @AddressLine2, @City, @StateProvinceID, @PostalCodeID, @CountryID, 
            1, getdate(), getdate(), 'sys')
    END
END
;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Allow active or disactive
--  (remove) an alert for an user and position
--  (PositionID=0 for alerts not related with
--  a position), with current Date-Time.
--  
-- =============================================
CREATE PROCEDURE [dbo].[SetUserAlert]
	@UserID int
	,@PositionID int
	,@AlertID int
	,@Active bit
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    IF @Active = 1 BEGIN
		UPDATE UserAlert WITH (Serializable) SET
			Active = 1,
			UpdatedDate = getdate(),
			ModifiedBy = 'sys'
		WHERE
			UserID = @UserID
			 AND
			PositionID = @PositionID
			 AND
			AlertID = @AlertID
			
		IF @@RowCount = 0
			INSERT INTO UserAlert (
				UserID, PositionID, AlertID, CreatedDate, UpdatedDate,
				ModifiedBy, Active
			) VALUES (
				@UserID, @PositionID, @AlertID, getdate(), getdate(),
				'sys', 1
			)

    END ELSE BEGIN
		DELETE FROM UserAlert
		WHERE UserID = @UserID AND PositionID = @PositionID
			AND AlertID = @AlertID
    END
END
;


CREATE PROCEDURE [dbo].[SetUserVerification]
	@UserID int
	,@VerificationID int
	,@VerifiedDate datetime
	,@VerificationStatusID int
	,@PositionID int = 0
AS
BEGIN
    UPDATE UserVerification WITH (serializable) SET
        UpdatedDate = getdate(),
        VerifiedBy = 'sys',
        LastVerifiedDate = @VerifiedDate,
        Active = 1,
        VerificationStatusID = @VerificationStatusID,
        PositionID = @PositionID
    WHERE
        UserID = @UserID
         AND
        VerificationID = @VerificationID
    IF @@rowcount = 0 BEGIN
        INSERT INTO UserVerification (
            UserID, VerificationID, DateVerified, CreatedDate, 
            UpdatedDate, VerifiedBy, LastVerifiedDate, Active, VerificationStatusID
        ) VALUES (
            @UserID, @VerificationID, @VerifiedDate, getdate(), getdate(), 'sys', getdate(), 1, @VerificationStatusID
        )
    END
END
;


	CREATE PROCEDURE dbo.sp_alterdiagram
	(
		@diagramname 	sysname,
		@owner_id	int	= null,
		@version 	int,
		@definition 	varbinary(max)
	)
	WITH EXECUTE AS 'dbo'
	AS
	BEGIN
		set nocount on
	
		declare @theId 			int
		declare @retval 		int
		declare @IsDbo 			int
		
		declare @UIDFound 		int
		declare @DiagId			int
		declare @ShouldChangeUID	int
	
		if(@diagramname is null)
		begin
			RAISERROR ('Invalid ARG', 16, 1)
			return -1
		end
	
		execute as caller;
		select @theId = DATABASE_PRINCIPAL_ID();	 
		select @IsDbo = IS_MEMBER(N'db_owner'); 
		if(@owner_id is null)
			select @owner_id = @theId;
		revert;
	
		select @ShouldChangeUID = 0
		select @DiagId = diagram_id, @UIDFound = principal_id from dbo.sysdiagrams where principal_id = @owner_id and name = @diagramname 
		
		if(@DiagId IS NULL or (@IsDbo = 0 and @theId <> @UIDFound))
		begin
			RAISERROR ('Diagram does not exist or you do not have permission.', 16, 1);
			return -3
		end
	
		if(@IsDbo <> 0)
		begin
			if(@UIDFound is null or USER_NAME(@UIDFound) is null) -- invalid principal_id
			begin
				select @ShouldChangeUID = 1 ;
			end
		end

		-- update dds data			
		update dbo.sysdiagrams set definition = @definition where diagram_id = @DiagId ;

		-- change owner
		if(@ShouldChangeUID = 1)
			update dbo.sysdiagrams set principal_id = @theId where diagram_id = @DiagId ;

		-- update dds version
		if(@version is not null)
			update dbo.sysdiagrams set version = @version where diagram_id = @DiagId ;

		return 0
	END
	;


	CREATE PROCEDURE dbo.sp_creatediagram
	(
		@diagramname 	sysname,
		@owner_id		int	= null, 	
		@version 		int,
		@definition 	varbinary(max)
	)
	WITH EXECUTE AS 'dbo'
	AS
	BEGIN
		set nocount on
	
		declare @theId int
		declare @retval int
		declare @IsDbo	int
		declare @userName sysname
		if(@version is null or @diagramname is null)
		begin
			RAISERROR (N'E_INVALIDARG', 16, 1);
			return -1
		end
	
		execute as caller;
		select @theId = DATABASE_PRINCIPAL_ID(); 
		select @IsDbo = IS_MEMBER(N'db_owner');
		revert; 
		
		if @owner_id is null
		begin
			select @owner_id = @theId;
		end
		else
		begin
			if @theId <> @owner_id
			begin
				if @IsDbo = 0
				begin
					RAISERROR (N'E_INVALIDARG', 16, 1);
					return -1
				end
				select @theId = @owner_id
			end
		end
		-- next 2 line only for test, will be removed after define name unique
		if EXISTS(select diagram_id from dbo.sysdiagrams where principal_id = @theId and name = @diagramname)
		begin
			RAISERROR ('The name is already used.', 16, 1);
			return -2
		end
	
		insert into dbo.sysdiagrams(name, principal_id , version, definition)
				VALUES(@diagramname, @theId, @version, @definition) ;
		
		select @retval = @@IDENTITY 
		return @retval
	END
	;


	CREATE PROCEDURE dbo.sp_dropdiagram
	(
		@diagramname 	sysname,
		@owner_id	int	= null
	)
	WITH EXECUTE AS 'dbo'
	AS
	BEGIN
		set nocount on
		declare @theId 			int
		declare @IsDbo 			int
		
		declare @UIDFound 		int
		declare @DiagId			int
	
		if(@diagramname is null)
		begin
			RAISERROR ('Invalid value', 16, 1);
			return -1
		end
	
		EXECUTE AS CALLER;
		select @theId = DATABASE_PRINCIPAL_ID();
		select @IsDbo = IS_MEMBER(N'db_owner'); 
		if(@owner_id is null)
			select @owner_id = @theId;
		REVERT; 
		
		select @DiagId = diagram_id, @UIDFound = principal_id from dbo.sysdiagrams where principal_id = @owner_id and name = @diagramname 
		if(@DiagId IS NULL or (@IsDbo = 0 and @UIDFound <> @theId))
		begin
			RAISERROR ('Diagram does not exist or you do not have permission.', 16, 1)
			return -3
		end
	
		delete from dbo.sysdiagrams where diagram_id = @DiagId;
	
		return 0;
	END
	;


	CREATE PROCEDURE dbo.sp_helpdiagramdefinition
	(
		@diagramname 	sysname,
		@owner_id	int	= null 		
	)
	WITH EXECUTE AS N'dbo'
	AS
	BEGIN
		set nocount on

		declare @theId 		int
		declare @IsDbo 		int
		declare @DiagId		int
		declare @UIDFound	int
	
		if(@diagramname is null)
		begin
			RAISERROR (N'E_INVALIDARG', 16, 1);
			return -1
		end
	
		execute as caller;
		select @theId = DATABASE_PRINCIPAL_ID();
		select @IsDbo = IS_MEMBER(N'db_owner');
		if(@owner_id is null)
			select @owner_id = @theId;
		revert; 
	
		select @DiagId = diagram_id, @UIDFound = principal_id from dbo.sysdiagrams where principal_id = @owner_id and name = @diagramname;
		if(@DiagId IS NULL or (@IsDbo = 0 and @UIDFound <> @theId ))
		begin
			RAISERROR ('Diagram does not exist or you do not have permission.', 16, 1);
			return -3
		end

		select version, definition FROM dbo.sysdiagrams where diagram_id = @DiagId ; 
		return 0
	END
	;


	CREATE PROCEDURE dbo.sp_helpdiagrams
	(
		@diagramname sysname = NULL,
		@owner_id int = NULL
	)
	WITH EXECUTE AS N'dbo'
	AS
	BEGIN
		DECLARE @user sysname
		DECLARE @dboLogin bit
		EXECUTE AS CALLER;
			SET @user = USER_NAME();
			SET @dboLogin = CONVERT(bit,IS_MEMBER('db_owner'));
		REVERT;
		SELECT
			[Database] = DB_NAME(),
			[Name] = name,
			[ID] = diagram_id,
			[Owner] = USER_NAME(principal_id),
			[OwnerID] = principal_id
		FROM
			sysdiagrams
		WHERE
			(@dboLogin = 1 OR USER_NAME(principal_id) = @user) AND
			(@diagramname IS NULL OR name = @diagramname) AND
			(@owner_id IS NULL OR principal_id = @owner_id)
		ORDER BY
			4, 5, 1
	END
	;


	CREATE PROCEDURE dbo.sp_renamediagram
	(
		@diagramname 		sysname,
		@owner_id		int	= null,
		@new_diagramname	sysname
	
	)
	WITH EXECUTE AS 'dbo'
	AS
	BEGIN
		set nocount on
		declare @theId 			int
		declare @IsDbo 			int
		
		declare @UIDFound 		int
		declare @DiagId			int
		declare @DiagIdTarg		int
		declare @u_name			sysname
		if((@diagramname is null) or (@new_diagramname is null))
		begin
			RAISERROR ('Invalid value', 16, 1);
			return -1
		end
	
		EXECUTE AS CALLER;
		select @theId = DATABASE_PRINCIPAL_ID();
		select @IsDbo = IS_MEMBER(N'db_owner'); 
		if(@owner_id is null)
			select @owner_id = @theId;
		REVERT;
	
		select @u_name = USER_NAME(@owner_id)
	
		select @DiagId = diagram_id, @UIDFound = principal_id from dbo.sysdiagrams where principal_id = @owner_id and name = @diagramname 
		if(@DiagId IS NULL or (@IsDbo = 0 and @UIDFound <> @theId))
		begin
			RAISERROR ('Diagram does not exist or you do not have permission.', 16, 1)
			return -3
		end
	
		-- if((@u_name is not null) and (@new_diagramname = @diagramname))	-- nothing will change
		--	return 0;
	
		if(@u_name is null)
			select @DiagIdTarg = diagram_id from dbo.sysdiagrams where principal_id = @theId and name = @new_diagramname
		else
			select @DiagIdTarg = diagram_id from dbo.sysdiagrams where principal_id = @owner_id and name = @new_diagramname
	
		if((@DiagIdTarg is not null) and  @DiagId <> @DiagIdTarg)
		begin
			RAISERROR ('The name is already used.', 16, 1);
			return -2
		end		
	
		if(@u_name is null)
			update dbo.sysdiagrams set [name] = @new_diagramname, principal_id = @theId where diagram_id = @DiagId
		else
			update dbo.sysdiagrams set [name] = @new_diagramname where diagram_id = @DiagId
		return 0
	END
	;


	CREATE PROCEDURE dbo.sp_upgraddiagrams
	AS
	BEGIN
		IF OBJECT_ID(N'dbo.sysdiagrams') IS NOT NULL
			return 0;
	
		CREATE TABLE dbo.sysdiagrams
		(
			name sysname NOT NULL,
			principal_id int NOT NULL,	-- we may change it to varbinary(85)
			diagram_id int PRIMARY KEY IDENTITY,
			version int,
	
			definition varbinary(max)
			CONSTRAINT UK_principal_name UNIQUE
			(
				principal_id,
				name
			)
		);


		/* Add this if we need to have some form of extended properties for diagrams */
		/*
		IF OBJECT_ID(N'dbo.sysdiagram_properties') IS NULL
		BEGIN
			CREATE TABLE dbo.sysdiagram_properties
			(
				diagram_id int,
				name sysname,
				value varbinary(max) NOT NULL
			)
		END
		*/

		IF OBJECT_ID(N'dbo.dtproperties') IS NOT NULL
		begin
			insert into dbo.sysdiagrams
			(
				[name],
				[principal_id],
				[version],
				[definition]
			)
			select	 
				convert(sysname, dgnm.[uvalue]),
				DATABASE_PRINCIPAL_ID(N'dbo'),			-- will change to the sid of sa
				0,							-- zero for old format, dgdef.[version],
				dgdef.[lvalue]
			from dbo.[dtproperties] dgnm
				inner join dbo.[dtproperties] dggd on dggd.[property] = 'DtgSchemaGUID' and dggd.[objectid] = dgnm.[objectid]	
				inner join dbo.[dtproperties] dgdef on dgdef.[property] = 'DtgSchemaDATA' and dgdef.[objectid] = dgnm.[objectid]
				
			where dgnm.[property] = 'DtgSchemaNAME' and dggd.[uvalue] like N'_EA3E6268-D998-11CE-9454-00AA00A3F36E_' 
			return 2;
		end
		return 1;
	END
	;


CREATE PROCEDURE [dbo].[TestAlertAvailability]
	@UserID int
AS
BEGIN
	
	
	SET NOCOUNT ON;
	DECLARE @AlertID int
	SET @AlertID = 2
    
    
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		EXISTS (SELECT UserID FROM [CalendarProviderAttributes]
		WHERE UserID = @UserID)
		
		
		
		
		AND EXISTS (SELECT UserID FROM [CalendarEvents]
		WHERE UserID = @UserID AND EventType = 2)
	BEGIN
		
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 0
	END ELSE BEGIN
		
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 1
	END
	
	
	EXEC dbo.TestProfileActivation @UserID, 0
END
;


CREATE PROCEDURE [dbo].[TestAlertBackgroundCheck]
	@UserID int
AS
BEGIN
	
	
	SET NOCOUNT ON;
	DECLARE @AlertID int
	SET @AlertID = 0
	
	DECLARE @OptionalAlertID int
	SET @OptionalAlertID = 12
	DECLARE @RequiredAlertID int
	SET @RequiredAlertID = 18
	DECLARE @IsRequired bit
    
    
    DECLARE @cur CURSOR
    DECLARE @PositionID int
    DECLARE @HigherBackgroundCheckID int
    
	SET @cur = CURSOR FOR 
		SELECT DISTINCT
		 PositionID
		FROM
		 UserProfilePositions
		WHERE
	     UserID = @UserID
	     
	OPEN @cur
	FETCH NEXT FROM @cur INTO @PositionID
	WHILE @@FETCH_STATUS = 0 BEGIN
		
		
		DECLARE @i int
		SET @i = 0
		WHILE @i < 2 BEGIN
			
			IF @i = 0 BEGIN
				
				SET @AlertID = @OptionalAlertID
				SET @IsRequired = 0
			END ELSE IF @i = 1 BEGIN
				
				SET @AlertID = @RequiredAlertID
				SET @IsRequired = 1
			END ELSE
				BREAK
			
			
			SET @HigherBackgroundCheckID = null
			
			
			SELECT	@HigherBackgroundCheckID = (CASE
						WHEN @IsRequired = 1
						 THEN MAX(PB.BackgroundCheckID)
						WHEN @IsRequired = 0
						 THEN MIN(PB.BackgroundCheckID)
					END)
			FROM	PositionBackgroundCheck As PB
			WHERE	PB.PositionID = @PositionID
				AND PB.[Required] = @IsRequired AND PB.Active = 1
				AND PB.CountryID = (SELECT TOP 1 CountryID FROM vwUsersContactData WHERE UserID = @UserID)
				AND PB.StateProvinceID = (SELECT TOP 1 StateProvinceID FROM vwUsersContactData WHERE UserID = @UserID)	
			
			IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
				
				@HigherBackgroundCheckID is null
				 OR
				
				
				EXISTS (
					SELECT	UserID
					FROM	UserBackgroundCheck
					WHERE	UserID = @UserID
						
						AND StatusID IN (1, 2, 3)
						AND (
							
							
							@IsRequired = 0
							OR
							
							
							BackgroundCheckID >= @HigherBackgroundCheckID
						)
			) BEGIN
				
				EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 0
			END ELSE BEGIN
				
				EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 1
			END
		
			
			SET @i = @i + 1
		END
		
		
		FETCH NEXT FROM @cur INTO @PositionID
	END
	CLOSE @cur
	DEALLOCATE @cur
	
	
	EXEC dbo.TestProfileActivation @UserID
	
			
END
;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'basicinfoverification' are satisfied, 
-- updating user points and enabling or 
-- disabling it profile.
-- =============================================
CREATE PROCEDURE [dbo].[TestAlertBasicInfoVerification]
	@UserID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 10
    
    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		3 = ( -- 3 Verifications being checked (1, 2, 4)
			SELECT	count(*)
			FROM	UserVerification As UV
			WHERE	UV.UserID = @UserID
					 AND
					UV.VerificationID IN (1, 2, 4)
					 AND
					UV.Active = 1
					 AND
					UV.VerificationStatusID = 1 -- 1:confirmed
	) BEGIN
		-- PASSED: disable alert
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 0
	END ELSE BEGIN
		-- NOT PASSED: active alert
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 1
	END
	
	-- Test if user profile must be actived or not
	EXEC dbo.TestProfileActivation @UserID
END
;


CREATE PROCEDURE [dbo].[TestAlertEducation]
	@UserID int
AS
BEGIN
	
	
	SET NOCOUNT ON;
	DECLARE @AlertID int
	SET @AlertID = 20
    
    
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		EXISTS (SELECT UserID FROM UserEducation
				WHERE UserID = @UserID
					AND Active = 1
					
					
	) BEGIN
		
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 0
	END ELSE BEGIN
		
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 1
	END
	
	
	EXEC dbo.TestProfileActivation @UserID
END
;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'location' are satisfied, 
-- updating user points and enabling or 
-- disabling it profile.
-- =============================================
CREATE PROCEDURE [dbo].[TestAlertLocation]
	@UserID int
	,@PositionID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 16
    
    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		-- Check that user has that position (this is a position related alert). If it has not (=0), alert will off because doesn't affect:
		(SELECT count(*) FROM userprofilepositions WHERE UserID=@UserID AND PositionID=@PositionID) = 0 OR
		EXISTS (SELECT AddressID FROM ServiceAddress
	WHERE UserID = @UserID
		AND PositionID = @PositionID
		AND ( -- Must have almost one address to perfor work Or from it travel
			ServicesPerformedAtLocation = 1
			 OR
			TravelFromLocation = 1
		)
		AND Active = 1
	) BEGIN
		-- PASSED: disable alert
		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 0
	END ELSE BEGIN
		-- NOT PASSED: active alert
		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 1
	END
	
	-- Test if user profile must be actived or not
	EXEC dbo.TestProfileActivation @UserID, @PositionID
END
;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'payment' are satisfied, 
-- updating user points and enabling or 
-- disabling it profile.
-- =============================================
CREATE PROCEDURE [dbo].[TestAlertPayment]
	@UserID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 5
	
    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		
		/* Marketplace Way */
		dbo.isMarketplacePaymentAccountActive(@UserID) = Cast(1 as bit)
	BEGIN
		-- PASSED: disable alert
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 0
	END ELSE BEGIN
		-- NOT PASSED: active alert
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 1
	END
	
	-- Test if user profile must be actived or not
	EXEC dbo.TestProfileActivation @UserID
END;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Modified date: 2012-08-17
-- Description:	Test if the conditions for the
-- alert type 'personalinfo' are satisfied, 
-- updating user points and enabling or 
-- disabling it profile.
-- =============================================
CREATE PROCEDURE [dbo].[TestAlertPersonalInfo]
	@UserID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 3
    
    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
	  (
		EXISTS (
			SELECT UserID
			FROM Users
			WHERE 
				UserID = @UserID
				AND dbo.fx_IfNW(FirstName, null) is not null
				AND dbo.fx_IfNW(LastName, null) is not null
				AND (
				 dbo.fx_IfNW(MobilePhone, null) is not null
				  OR
				 dbo.fx_IfNW(AlternatePhone, null) is not null
				)
				-- GenderID now in TestAlertPublicBio, to match new forms
				--AND GenderID > 0
		)
		 AND
		EXISTS (
			SELECT	AddressID
			FROM	[Address]
			WHERE
				UserID = @UserID AND AddressTypeID = 1
				AND dbo.fx_IfNW(AddressLine1, null) is not null
				AND dbo.fx_IfNW(City, null) is not null
				AND dbo.fx_IfNW(StateProvinceID, null) is not null
				AND dbo.fx_IfNW(CountryID, null) is not null
				AND dbo.fx_IfNW(PostalCodeID, null) is not null
		)
	) BEGIN
		-- PASSED: disable alert
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 0
	END ELSE BEGIN
		-- NOT PASSED: active alert
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 1
	END
	
	-- Test if user profile must be actived or not
	EXEC dbo.TestProfileActivation @UserID
END
;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'photo' are satisfied, 
-- updating user points and enabling or 
-- disabling it profile.
-- =============================================
CREATE PROCEDURE [dbo].[TestAlertPhoto]
	@UserID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 4
    
    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		EXISTS (SELECT UserID FROM Users
	WHERE UserID = @UserID
		AND dbo.fx_IfNW(Photo, null) is not null
	) BEGIN
		-- PASSED: disable alert
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 0
	END ELSE BEGIN
		-- NOT PASSED: active alert
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 1
	END
	
	-- Test if user profile must be actived or not
	EXEC dbo.TestProfileActivation @UserID
END
;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'positionservices' are satisfied, 
-- updating user points and enabling or 
-- disabling it profile.
-- =============================================
CREATE PROCEDURE [dbo].[TestAlertPositionServices]
	@UserID int,
	@PositionID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 8
	
	DECLARE @CATS TABLE (CatID int)
	
	INSERT INTO @CATS (CatID)
	SELECT DISTINCT A.ServiceAttributeCategoryID
	FROM ServiceAttributeCategory As A
		  INNER JOIN
		 ServiceCategoryPositionAttribute As B
		   ON A.ServiceAttributeCategoryID = B.ServiceAttributeCategoryID
			AND B.PositionID = @PositionID
	WHERE A.RequiredInput = 1
		AND A.Active = 1
		AND B.Active = 1
    
    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		-- Check that user has that position (this is a position related alert). If it has not (=0), alert will off because doesn't affect:
		(SELECT count(*) FROM userprofilepositions WHERE UserID=@UserID AND PositionID=@PositionID) = 0 OR
		-- Check all required data
		-- Must have almost one service attribute selected 
		-- per required category for the position
		@PositionID = 0
		OR (SELECT count(*) FROM (SELECT A.ServiceAttributeCategoryID
		FROM userprofileserviceattributes As A
		 INNER JOIN
		ServiceCategoryPositionAttribute As B
		  ON A.ServiceAttributeCategoryID = B.ServiceAttributeCategoryID
		   AND A.ServiceAttributeID = B.ServiceAttributeID
		  -- We only check the 'RequiredInput' Categories
		   AND B.ServiceAttributeCategoryID IN (SELECT CatID FROM @CATS)
		WHERE A.UserID = @UserID AND A.PositionID = @PositionID
			AND A.Active = 1 AND B.Active = 1
		GROUP BY A.ServiceAttributeCategoryID
	) As Z) = (SELECT count(*) FROM @CATS)
	BEGIN
		--PRINT 'you''re cool!'
		-- PASSED: disable alert
		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 0
	END ELSE BEGIN
		--PRINT 'buuuhhhh!'
		-- NOT PASSED: active alert
		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 1
	END
	
	-- Test if user profile must be actived or not
	EXEC dbo.TestProfileActivation @UserID, @PositionID
END


;


-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'pricingdetails' are satisfied, 
-- updating user points and enabling or 
-- disabling it profile.
-- =============================================
CREATE PROCEDURE [dbo].[TestAlertPricingDetails]
	@UserID int,
	@PositionID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 1
    
    -- First ever check if this type of alert affects this type of user
    IF	dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		-- Check that user has that position (this is a position related alert). If it has not (=0), alert will off because doesn't affect:
		(SELECT count(*) FROM userprofilepositions WHERE UserID=@UserID AND PositionID=@PositionID) = 0 OR
		
		-- Check that there are almost one pricing package defined
		EXISTS (SELECT * FROM ProviderPackage
			WHERE ProviderUserID = @UserID
				AND PositionID = @PositionID
				AND Active = 1
		)
	
		BEGIN
		-- PASSED: disable alert
		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 0
	END ELSE BEGIN
		-- NOT PASSED: active alert
		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 1
	END
	
	-- Test if user profile must be actived or not
	EXEC dbo.TestProfileActivation @UserID, @PositionID
END

;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Modified date: 2013-04-11
-- Description:	Test if the conditions for the
-- alert type 'professionallicense' are satisfied, 
-- updating user points and enabling or 
-- disabling it profile.
-- There are 2 alerts for this test:
--  13: professionallicense  (optional)
--  19: required-professionallicense  (required)
-- Because lookup positionlicense tables can
-- be required or not, any required one is 
-- related to the aler 19 and others to the
-- alert 13.
-- FROM DATE 2013-04-11:
-- Alerts will be off when almost a request
-- was done from provider, passing the test
-- request with state 'verified:2' and too
-- 'pending:1' and 'contact us:3; but not 
-- 'rejected/unable to verified:4'.
-- =============================================
CREATE PROCEDURE [dbo].[TestAlertProfessionalLicense]
	@UserID int
	,@PositionID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 0
	
	DECLARE @OptionalAlertID int
	SET @OptionalAlertID = 13
	DECLARE @RequiredAlertID int
	SET @RequiredAlertID = 19
	DECLARE @IsRequired bit
	
	/* Go to a 2-steps loop, first for Optional and second for Required alert.
		allowing only tweak to vars preserving unduplicated the important code
	 */
	DECLARE @i int
	SET @i = 0
	WHILE @i < 2 BEGIN
		-- Setting up loop vars
		IF @i = 0 BEGIN
			-- Setting up vars for Optional
			SET @AlertID = @OptionalAlertID
			SET @IsRequired = 0
		END ELSE IF @i = 1 BEGIN
			-- Setting up vars for Required
			SET @AlertID = @RequiredAlertID
			SET @IsRequired = 1
		END ELSE
			BREAK
    
		/***
			RUN TEST CODE
		 ***/
		-- First ever check if this type of alert affects this type of user
		IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
			-- Check that user has that position (this is a position related alert). If it has not (=0), alert will off because doesn't affect:
			(SELECT count(*) FROM userprofilepositions WHERE UserID=@UserID AND PositionID=@PositionID) = 0 OR
			-- Check if the user has all the required licenses (can be 0 if 0 are required)
			(
				SELECT	count(*)
				FROM	PositionLicense As PL
						 INNER JOIN
                        [Address] As L
                          ON L.UserID = @UserID
                            AND L.AddressTypeID = 1 -- Only one address with type 1 (home) can exists
                            AND PL.StateProvinceID = L.StateProvinceID
                            AND PL.CountryID = L.CountryID
				WHERE
					PL.[Required] = @IsRequired
					 AND
					PL.PositionID = @PositionID
			) = 0  -- There is no (required) licenses for the position, off alert
			OR
			(
				-- With next subquery, we get all the number of valid license requests
				-- for the user and position
				SELECT	count(*)
				FROM	UserLicenseVerification As UL
						 INNER JOIN
                        [Address] As L
                          ON L.UserID = @UserID
                            AND L.AddressTypeID = 1 -- Only one address with type 1 (home) can exists
                            AND UL.StateProvinceID = L.StateProvinceID
                            AND UL.CountryID = L.CountryID
						 INNER JOIN
						PositionLicense As PL
						  ON PL.LicenseCertificationID = UL.LicenseCertificationID
							AND UL.PositionID = PL.PositionID
							AND UL.ProviderUserID = @UserID
							AND UL.StateProvinceID = PL.StateProvinceID
							AND UL.CountryID = PL.CountryID
						 AND
						-- Valid requests to off alert, depending on Status:
						UL.StatusID IN (1, 2, 3)
				WHERE
					PL.[Required] = @IsRequired
					 AND
					PL.PositionID = @PositionID
			) > 0 -- User has almost one license of the required list of licenses (changed on 2013-03-26 issue #203)
		BEGIN
			-- PASSED: disable alert
			EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 0
		END ELSE BEGIN
			-- NOT PASSED: active alert
			EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 1
		END

		-- Next loop:
		SET @i = @i + 1
	END
	
	-- Test if user profile must be actived or not
	EXEC dbo.TestProfileActivation @UserID, @PositionID
	
	
		/* Old code: In-loop-inside-if check based on UserVerification, that information is not indicative of the required license, OLD CODE:
		 EXISTS (
			SELECT	UserID
			FROM	UserVerification As UV
			WHERE	UV.UserID = @UserID
					 AND
					UV.VerificationID = 13 -- Professional license
					 AND
					UV.Active = 1
					 AND
					UV.VerificationStatusID = 1 -- 1:confirmed
		 )
		*/
END
;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'publicbio' are satisfied, 
-- updating user points and enabling or 
-- disabling it profile.
-- =============================================
CREATE PROCEDURE [dbo].[TestAlertPublicBio]
	@UserID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 9
    
    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		EXISTS (
			SELECT UserID
			FROM Users
			WHERE UserID = @UserID
				AND dbo.fx_IfNW(PublicBio, null) is not null
				--AND GenderID > 0
	) BEGIN
		-- PASSED: disable alert
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 0
	END ELSE BEGIN
		-- NOT PASSED: active alert
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 1
	END
	
	-- Test if user profile must be actived or not
	EXEC dbo.TestProfileActivation @UserID
END;


CREATE PROCEDURE [dbo].[TestAlertReferenceRequests]
	@UserID int
	,@PositionID int
AS
BEGIN
	
	
	SET NOCOUNT ON;
	DECLARE @AlertID int
	SET @AlertID = 14
    
    
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		
		(SELECT count(*) FROM userprofilepositions WHERE UserID=@UserID AND PositionID=@PositionID) = 0 OR
		EXISTS (
			SELECT	UserID
			FROM	UserVerification As UV
			WHERE	UV.UserID = @UserID
					 AND
					UV.VerificationID = 12 
				    
					 AND
					UV.Active = 1
					 AND
					
					
					
					
					UV.VerificationStatusID IN (1, 2)
					 AND
					(
					 
					 UV.PositionID = @PositionID
					  OR
					 
					 UV.PositionID = 0
					)
					
	) BEGIN
		
		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 0
	END ELSE BEGIN
		
		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 1
	END
	
	
	EXEC dbo.TestProfileActivation @UserID, @PositionID
END
;


CREATE PROCEDURE [dbo].[TestAlertShowcaseWork]
	@UserID int
	,@PositionID int
AS
BEGIN
	
	
	SET NOCOUNT ON;
	DECLARE @AlertID int
	SET @AlertID = 17
    
    
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		
		(SELECT count(*) FROM userprofilepositions WHERE UserID=@UserID AND PositionID=@PositionID) = 0 OR
		EXISTS (SELECT ProviderServicePhotoID FROM ProviderServicePhoto
	WHERE UserID = @UserID
		AND PositionID = @PositionID
		
		AND dbo.fx_IfNW(PhotoAddress, null) is not null
		AND IsPrimaryPhoto = 1
		AND Active = 1
	) BEGIN
		
		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 0
	END ELSE BEGIN
		
		EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, 1
	END
	
	
	EXEC dbo.TestProfileActivation @UserID, @PositionID
END
;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'socialmediaverification' are satisfied, 
-- updating user points and enabling or 
-- disabling it profile.
-- =============================================
CREATE PROCEDURE [dbo].[TestAlertSocialMediaVerification]
	@UserID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 11
    
    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		EXISTS (
			SELECT	UserID
			FROM	UserVerification As UV
					 INNER JOIN
					Verification As V
					  ON UV.VerificationID = V.VerificationID
			WHERE	UV.UserID = @UserID
					 AND
					V.VerificationCategoryID = 3
					 AND
					UV.Active = 1
					 AND
					V.Active = 1
					 AND
					UV.VerificationStatusID = 1 -- 1:confirmed
	) BEGIN
		-- PASSED: disable alert
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 0
	END ELSE BEGIN
		-- NOT PASSED: active alert
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 1
	END
	
	-- Test if user profile must be actived or not
	EXEC dbo.TestProfileActivation @UserID
END
;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Test if the conditions for the
-- alert type 'taxdocs' are satisfied, 
-- updating user points and enabling or 
-- disabling it profile.
-- =============================================
CREATE PROCEDURE [dbo].[TestAlertTaxDocs]
	@UserID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 6
    
    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		EXISTS (SELECT ProviderUserID FROM ProviderTaxForm
	WHERE ProviderUserID = @UserID
		AND dbo.fx_IfNW(FullName, null) is not null
		AND dbo.fx_IfNW(StreetApt, null) is not null
		AND dbo.fx_IfNW(City, null) is not null
		AND dbo.fx_IfNW(PostalCodeID, null) is not null
		AND dbo.fx_IfNW(StateProvinceID, null) is not null
		AND dbo.fx_IfNW(CountryID, null) is not null
		AND dbo.fx_IfNW([Signature], null) is not null
		AND dbo.fx_IfNW(TINTypeID, null) is not null
		AND dbo.fx_IfNW(DateTimeSubmitted, null) is not null
		AND dbo.fx_IfNW(LastThreeTINDigits, null) is not null
		AND (
		 TaxEntityTypeID = 1
		  OR
		 dbo.fx_IfNW(BusinessName, null) is not null
		)
		AND Active = 1
	) BEGIN
		-- PASSED: disable alert
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 0
	END ELSE BEGIN
		-- NOT PASSED: active alert
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 1
	END
	
	-- Test if user profile must be actived or not
	EXEC dbo.TestProfileActivation @UserID
END
;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-07-17
-- Description:	Test if the conditions for the
-- alert type 'verifyemail' are satisfied, 
-- updating user points and enabling or 
-- disabling it profile.
-- =============================================
CREATE PROCEDURE [dbo].[TestAlertVerifyEmail]
	@UserID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @AlertID int
	SET @AlertID = 15
    
    -- First ever check if this type of alert affects this type of user
    IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 0 OR
		EXISTS (SELECT UserID FROM webpages_Membership
	WHERE UserID = @UserID
		AND ConfirmationToken is null
		AND IsConfirmed = 1
	) BEGIN
		-- PASSED: disable alert
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 0
	END ELSE BEGIN
		-- NOT PASSED: active alert
		EXEC dbo.SetUserAlert @UserID, 0, @AlertID, 1
	END
	
	-- Test if user profile must be actived or not
	EXEC dbo.TestProfileActivation @UserID
END
;


-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Execute all user alert tests and
-- the profile activation at the end.
-- =============================================
CREATE PROCEDURE [dbo].[TestAllUserAlerts] 
	@UserID int
	,@PositionID int = 0
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    EXEC TestAlertPersonalInfo				@UserID
    EXEC TestAlertPhoto						@UserID
    EXEC TestAlertPayment					@UserID
	--EXEC TestAlertTaxDocs					@UserID
	EXEC TestAlertAvailability				@UserID
	EXEC TestAlertSocialMediaVerification	@UserID
	EXEC TestAlertBackgroundCheck			@UserID
	EXEC TestAlertBasicInfoVerification		@UserID	
	EXEC TestAlertVerifyEmail				@UserID
	EXEC TestAlertPublicBio					@UserID
	EXEC TestAlertEducation					@UserID

	-- All positions alerts:
    IF @PositionID = 0 BEGIN
		DECLARE @cur CURSOR
		SET @cur = CURSOR FOR 
			SELECT DISTINCT
			 PositionID
			FROM
			 UserProfilePositions
			WHERE
		     UserID = @UserID
		     AND PositionID <> 0
			 
		OPEN @cur
		FETCH NEXT FROM @cur INTO @PositionID
		WHILE @@FETCH_STATUS = 0 BEGIN
			-- Same batch of test than when a positionid is provider by parameter:
			EXEC TestAlertPricingDetails		@UserID, @PositionID
			EXEC TestAlertPositionServices		@UserID, @PositionID
			EXEC TestAlertReferenceRequests		@UserID, @PositionID
			EXEC TestAlertProfessionalLicense	@UserID, @PositionID
			EXEC TestAlertLocation				@UserID, @PositionID
			EXEC TestAlertShowcaseWork			@UserID, @PositionID
			
			FETCH NEXT FROM @cur INTO @PositionID
		END
		CLOSE @cur
		DEALLOCATE @cur

    END ELSE BEGIN
		EXEC TestAlertPricingDetails		@UserID, @PositionID
		EXEC TestAlertPositionServices		@UserID, @PositionID
		EXEC TestAlertReferenceRequests		@UserID, @PositionID
		EXEC TestAlertProfessionalLicense	@UserID, @PositionID
		EXEC TestAlertLocation				@UserID, @PositionID
		EXEC TestAlertShowcaseWork			@UserID, @PositionID
    END
    
    EXEC TestProfileActivation @UserID, @PositionID
END
;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description: Execute the TestAllUserAlerts
-- per ALL users on the database and all its
-- positions
-- CAREFUL: database performance can be affected
-- by this, use as an utility on testing or
-- special maintenance / update that can require
-- it.
-- =============================================
CREATE PROCEDURE [dbo].[TestAllUsersAlerts]
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DECLARE @UserID int
    DECLARE @cur CURSOR
    
	SET @cur = CURSOR FOR 
		SELECT UserID
		FROM Users
		WHERE Active = 1
		 
	OPEN @cur
	FETCH NEXT FROM @cur INTO @UserID
	WHILE @@FETCH_STATUS = 0 BEGIN
		-- Execute this same proc but for a concrete positionID
		EXEC TestAllUserAlerts @UserID
		
		FETCH NEXT FROM @cur INTO @UserID
	END
	CLOSE @cur
	DEALLOCATE @cur

END

 ;

CREATE PROCEDURE [dbo].[TestProfileActivation]
	@UserID int,
	@PositionID int = 0
AS
BEGIN
	
	
	SET NOCOUNT ON;
    DECLARE @cur CURSOR
    
    IF @PositionID = 0 BEGIN
		SET @cur = CURSOR FOR 
			SELECT DISTINCT
			 PositionID
			FROM
			 UserProfilePositions
			WHERE
		     UserID = @UserID
		     AND PositionID <> 0
			 
		OPEN @cur
		FETCH NEXT FROM @cur INTO @PositionID
		WHILE @@FETCH_STATUS = 0 BEGIN
			
			EXEC TestProfileActivation @UserID, @PositionID
			
			FETCH NEXT FROM @cur INTO @PositionID
		END
		CLOSE @cur
		DEALLOCATE @cur
    END ELSE BEGIN
		
		
		
		IF (SELECT TOP 1 StatusID FROM UserProfilePositions
			WHERE UserID = @UserID AND PositionID = @PositionID)
			IN (1, 2) -- Its a state for automatic activation
		BEGIN	
			
			UPDATE UserProfilePositions SET
				StatusID = 
				CASE WHEN (SELECT count(*)
					FROM UserAlert As UA
						 INNER JOIN
						Alert As A
						  ON UA.AlertID = A.AlertID
					WHERE UA.UserID = @UserID
							AND
						  
						  
						  (UA.PositionID = 0 OR UA.PositionID = @PositionID)
							AND
						  A.Required = 1
							AND
						  UA.Active = 1
				) = 0 THEN 1 
				ELSE 2 
				END,
				
				UpdatedDate = GETDATE(),
				ModifiedBy = 'sys'
			WHERE	
				UserID = @UserID AND PositionID = @PositionID
		END
	END
END
;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-08-17
-- Description:	Restore a user account removed
-- throught the page /Account/$Delete/.
-- Of course, only restore from a 'weak delete'
-- =============================================
CREATE PROCEDURE UnDeleteUser
	@UserID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    UPDATE userprofile SET Email = substring(Email, len('DELETED:') + 2, len(Email) - len('DELETED: '))
    WHERE UserID = @UserID
    
    UPDATE users SET Active = 1, AccountStatusID = 1
    WHERE UserID = @UserID
END
;


CREATE PROCEDURE ut_AutocheckReviewVerifications
AS BEGIN
	DECLARE @cur CURSOR
	DECLARE @UserID int, @PositionID int, @RevDate datetime
	
	
	
	
	SET @cur = CURSOR FOR
		SELECT	UserID, PositionID
		FROM	userprofilepositions
		WHERE	Active = 1
	OPEN @cur
	FETCH NEXT FROM @cur INTO @UserID, @PositionID
	WHILE @@FETCH_STATUS = 0 BEGIN
		
		SET @RevDate = null
		SELECT TOP 1 @RevDate = CreatedDate
		FROM UserReviews
		WHERE ProviderUserID = @UserID
			AND BookingID = 0
			AND PositionID = @PositionID
		IF @RevDate is not null
			
			EXEC SetUserVerification @UserID, 12, @RevDate, 1, @PositionID
		ELSE BEGIN
			
			SET @RevDate = null
			SELECT TOP 1 @RevDate = CreatedDate
			FROM UserVerification
			WHERE	UserID = @UserID
					AND VerificationID = 12
					AND (PositionID = 0 OR PositionID = @PositionID)
			IF @RevDate is not null
				
				
				
				EXEC SetUserVerification @UserID, 12, @RevDate, 2, @PositionID
		END
		
		SET @RevDate = null
		SELECT TOP 1 @RevDate = CreatedDate
		FROM UserReviews
		WHERE ProviderUserID = @UserID
			AND BookingID > 0
			AND PositionID = @PositionID
		IF @RevDate is not null
			EXEC SetUserVerification @UserID, 11, @RevDate, 1, @PositionID
		ELSE
			EXEC DelUserVerification @UserID, 11, @PositionID
		FETCH NEXT FROM @cur INTO @UserID, @PositionID
	END
	CLOSE @cur
	DEALLOCATE @cur
    
	
	
	SET @cur = CURSOR FOR
		SELECT	UserID
		FROM	Users
		WHERE	Active = 1 AND IsProvider = 1
	
	OPEN @cur
	FETCH NEXT FROM @cur INTO @UserID
	WHILE @@FETCH_STATUS = 0 BEGIN
		
		
		EXEC DelUserVerification @UserID, 11, 0
		
		
		EXEC DelUserVerification @UserID, 12, 0
		FETCH NEXT FROM @cur INTO @UserID
	END
	CLOSE @cur
	DEALLOCATE @cur
END
;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-08-18
-- Description:	Allow FORCE enable or disable all
-- the alerts affecting the user given for
-- the position given (or common profile if
-- zero), WITHOUT perform the alert 
-- tests/conditions (what can means data
-- corruption in some cases, waiting that some
-- things are complete because the alert is off
-- and they are not).
-- 
-- NOTE: Utility procedure, not to use
-- from the program, else as sysadmin, tester
-- or developer.
-- 
-- =============================================
CREATE PROCEDURE [dbo].[ut_ModifyUserAlertsState] 
	@UserID int
	,@PositionID int = 0
	,@StateActive bit = 1 -- 0 to disable all alerts
	,@TestProfileActivation bit = 0
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	
	DECLARE @AlertID int
	DECLARE @PositionSpecific bit
    DECLARE @cur CURSOR
    
	SET @cur = CURSOR FOR 
		SELECT AlertID, PositionSpecific
		FROM Alert
		
	OPEN @cur
	FETCH NEXT FROM @cur INTO @AlertID, @PositionSpecific
	WHILE @@FETCH_STATUS = 0 BEGIN
	
		IF dbo.fxCheckAlertAffectsUser(@UserID, @AlertID) = 1 BEGIN
			IF @PositionSpecific = 1 BEGIN
				IF @PositionID > 0
					EXEC dbo.SetUserAlert @UserID, @PositionID, @AlertID, @StateActive
			END ELSE
				EXEC dbo.SetUserAlert @UserID, 0, @AlertID, @StateActive
		END

		FETCH NEXT FROM @cur INTO @AlertID, @PositionSpecific
	END
	CLOSE @cur
	DEALLOCATE @cur
    
    IF @TestProfileActivation = 1
		EXEC TestProfileActivation @UserID, @PositionID
END
;


CREATE PROC dbo.IsUserAProvider

@UserID int

As

select 

count(*) As answer
from users a 
where
	a.UserID = @UserID
	 AND
	a.IsProvider = 1;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2014-02-18
-- Description:	Set field SentByUserId based on
-- the MessageTypeID
-- =============================================
CREATE TRIGGER AutoSetMessageSentByUserId
   ON  dbo.Messages
   AFTER INSERT
AS 
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	UPDATE Messages SET
		SentByUserId = CASE 
		WHEN MessageTypeID IN (1, 2, 4, 5, 6, 9, 12, 14, 16, 18) THEN T.CustomerUserID
		WHEN MessageTypeID IN (3, 7, 10, 13, 15, 17) THEN T.ProviderUserID
		WHEN MessageTypeID IN (8, 19) THEN 0 -- the system
		END
	FROM MessagingThreads AS T
	WHERE T.ThreadID = Messages.ThreadID
	AND SentByUserId is null
END
;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Execute all user tests on insert
--  to active all the alerts
-- =============================================
CREATE TRIGGER trigInitialProviderPositionAlertTest
   ON  UserProfilePositions
   AFTER INSERT
AS 
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	
	DECLARE @UserID int, @PositionID int
	
	SELECT @UserID = UserID, @PositionID = PositionID FROM INSERTED

    EXEC TestAllUserAlerts @UserID, @PositionID

END
;

-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description:	Execute all user tests on insert
--  to active all the alerts
-- =============================================
CREATE TRIGGER trigInitialUserAlertTest
   ON  dbo.users
   AFTER INSERT
AS 
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	
	DECLARE @UserID int
	
	SELECT @UserID = UserID FROM INSERTED

    EXEC TestAllUserAlerts @UserID

END
;

