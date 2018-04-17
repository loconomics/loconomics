-- New onboarding steps are too different and we changed contactInfo to beggining forcing us to move
-- anyone with onboarding started (not welcome, not null) to that step or we risk to lost some step
UPDATE users SET OnboardingStep = 'publicContactInfo'
WHERE OnboardingStep is not null AND OnboardingStep not like 'welcome'
