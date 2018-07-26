ALTER TABLE dbo.pricingSummaryDetail ADD
	IsRemoteService bit NOT NULL CONSTRAINT DF_pricingSummaryDetail_IsRemoteService DEFAULT 0
