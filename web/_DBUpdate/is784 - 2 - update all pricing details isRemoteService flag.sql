UPDATE pricingSummaryDetail SET IsRemoteService = CAST(1 as bit) WHERE ServiceProfessionalServiceID IN (
	SELECT providerPackageID
	FROM providerpackage
	WHERE IsPhone = 1
)
