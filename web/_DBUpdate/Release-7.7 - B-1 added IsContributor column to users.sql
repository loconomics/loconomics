ALTER TABLE users ADD IsContributor bit CONSTRAINT users_IsContributor_default DEFAULT Cast(0 as bit)
