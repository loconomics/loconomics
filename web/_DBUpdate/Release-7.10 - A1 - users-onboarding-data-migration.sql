-- servicesOverview is being removed from onboarding sequence
UPDATE users
SET OnboardingStep = 'serviceProfessionalService'
WHERE OnboardingStep = 'servicesOverview';
