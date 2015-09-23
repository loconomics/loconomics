-- Set on pricing detail new fields values from current services data
update pricingSummaryDetail set
serviceName = (SELECT TOP 1 providerPackageName FROM providerpackage WHERE providerpackage.ProviderPackageID = pricingSummaryDetail.ServiceProfessionalServiceID ),
serviceDescription = (SELECT TOP 1 providerPackageDescription FROM providerpackage WHERE providerpackage.ProviderPackageID = pricingSummaryDetail.ServiceProfessionalServiceID ),
numberOfSessions = (SELECT TOP 1 numberOfSessions FROM providerpackage WHERE providerpackage.ProviderPackageID = pricingSummaryDetail.ServiceProfessionalServiceID )
where serviceName is null

GO

-- Update corrupted records, that link to non existent services
update pricingSummaryDetail set
serviceName = 'Unknow service'
where serviceName is null

GO

-- Update corrupted, testing, records, with an impossible numberOfSessions
update pricingSummaryDetail set
numberOfSessions = 1
where numberOfSessions is null or numberOfSessions < 1
