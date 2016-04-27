ALTER TABLE UserLicenseCertifications
ADD FOREIGN KEY (ProviderUserID) 
REFERENCES users(UserID)