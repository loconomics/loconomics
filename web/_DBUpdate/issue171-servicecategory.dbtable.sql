
EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'DELETE FROM servicecategory 
INSERT INTO [servicecategory]
   ([ServiceCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[Name]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[ImagePath])
VALUES
   ('1'
   ,'1'
   ,'1'
   ,'Home'
   ,'Need some help around the house? Painters, housekeepers, handymen and more await you and your home. You’ll be able to select the perfect service provider that suits your exact needs and budget. Reviews from customers like yourself will help you along.'
   ,'7/3/2011 12:00:00 AM'
   ,'7/3/2011 12:00:00 AM'
   ,'dj'
   ,'True'
   ,NULL)
INSERT INTO [servicecategory]
   ([ServiceCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[Name]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[ImagePath])
VALUES
   ('1'
   ,'2'
   ,'2'
   ,'Hogar'
   ,'¿Necesitas algo de ayuda en casa? Pintores, limpiadores, manitas y muchos más están listos para echarte una mano.'
   ,'7/3/2011 12:00:00 AM'
   ,'7/3/2011 12:00:00 AM'
   ,'dj'
   ,'True'
   ,NULL)
INSERT INTO [servicecategory]
   ([ServiceCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[Name]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[ImagePath])
VALUES
   ('2'
   ,'1'
   ,'1'
   ,'Personal'
   ,'You need a massage. Personal trainers, music teachers, and a number of therapists are here and ready to help you become the person you deserve to be.'
   ,'7/13/2011 12:00:00 AM'
   ,'7/13/2011 12:00:00 AM'
   ,'jd'
   ,'True'
   ,NULL)
INSERT INTO [servicecategory]
   ([ServiceCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[Name]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[ImagePath])
VALUES
   ('2'
   ,'2'
   ,'2'
   ,'Personal'
   ,'¿Quieres un entrenador personal? ¿O aprender a tocar ese instrumento musical al que le tienes ganas? Hay muchos profesionales que te pueden ayudar en tu desarrollo personal. O quizá lo que necesites sea simplemente un masaje.'
   ,'7/13/2011 12:00:00 AM'
   ,'7/13/2011 12:00:00 AM'
   ,'jd'
   ,'True'
   ,NULL)
INSERT INTO [servicecategory]
   ([ServiceCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[Name]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[ImagePath])
VALUES
   ('3'
   ,'1'
   ,'1'
   ,'Child'
   ,'Children are people, too. Help your child learn a language, play an instrument, or give you a night out on the town.'
   ,'7/13/2011 12:00:00 AM'
   ,'7/13/2011 12:00:00 AM'
   ,'jd'
   ,'True'
   ,NULL)
INSERT INTO [servicecategory]
   ([ServiceCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[Name]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[ImagePath])
VALUES
   ('3'
   ,'2'
   ,'2'
   ,'Niños'
   ,'Los niños también necesitan servicios. Ayúdales a aprender un idioma, tocar un instrumento, o encuentra a alguien que los cuide si decides darte una noche libre.'
   ,'7/13/2011 12:00:00 AM'
   ,'7/13/2011 12:00:00 AM'
   ,'jd'
   ,'True'
   ,NULL)
INSERT INTO [servicecategory]
   ([ServiceCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[Name]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[ImagePath])
VALUES
   ('4'
   ,'1'
   ,'1'
   ,'Senior'
   ,'Do you or a family member need a little extra help around the house? Browse through service providers wanting to help make life easier.'
   ,'7/13/2011 12:00:00 AM'
   ,'7/13/2011 12:00:00 AM'
   ,'jd'
   ,'True'
   ,NULL)
INSERT INTO [servicecategory]
   ([ServiceCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[Name]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[ImagePath])
VALUES
   ('4'
   ,'2'
   ,'2'
   ,'Mayores'
   ,'Necesitas o tienes algún familiar que necesite algo de ayuda? Busca profesionales dispuestos a hacer la vida de los mayores más fácil.'
   ,'7/13/2011 12:00:00 AM'
   ,'7/13/2011 12:00:00 AM'
   ,'jd'
   ,'True'
   ,NULL)
INSERT INTO [servicecategory]
   ([ServiceCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[Name]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[ImagePath])
VALUES
   ('5'
   ,'1'
   ,'1'
   ,'Pet'
   ,'Throw your dog a bone.  Better yet, treat your pet to grooming services, walkers, sitters, and more.'
   ,'7/13/2011 12:00:00 AM'
   ,'7/13/2011 12:00:00 AM'
   ,'jd'
   ,'True'
   ,NULL)
INSERT INTO [servicecategory]
   ([ServiceCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[Name]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[ImagePath])
VALUES
   ('5'
   ,'2'
   ,'2'
   ,'Mascotas'
   ,'Una revisión del veterinario, un buen corte de pelo, una limpieza completa o simplemente alguien que cuide de tu mascota o la pasee mientras tú no estás.'
   ,'7/13/2011 12:00:00 AM'
   ,'7/13/2011 12:00:00 AM'
   ,'jd'
   ,'True'
   ,NULL)
INSERT INTO [servicecategory]
   ([ServiceCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[Name]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[ImagePath])
VALUES
   ('6'
   ,'1'
   ,'1'
   ,'Celebration'
   ,'Make your next celebration a real blowout with help from some very talented professionals. Photographers, DJs, musicians and more.'
   ,'7/13/2011 12:00:00 AM'
   ,'7/13/2011 12:00:00 AM'
   ,'jd'
   ,'True'
   ,NULL)
INSERT INTO [servicecategory]
   ([ServiceCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[Name]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[ImagePath])
VALUES
   ('6'
   ,'2'
   ,'2'
   ,'Celebración'
   ,'Haz de tu próximo evento un éxito total con la ayuda de gente con talento. Fotógrafos, DJ´s, músicos y muchos más.'
   ,'7/13/2011 12:00:00 AM'
   ,'7/13/2011 12:00:00 AM'
   ,'jd'
   ,'True'
   ,NULL)
INSERT INTO [servicecategory]
   ([ServiceCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[Name]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[ImagePath])
VALUES
   ('7'
   ,'1'
   ,'1'
   ,'Transport'
   ,'There are mechanics, bicycle repairers, and car detailers all wanting to help you get where you need to go.'
   ,'7/13/2011 12:00:00 AM'
   ,'7/13/2011 12:00:00 AM'
   ,'jd'
   ,'True'
   ,NULL)
INSERT INTO [servicecategory]
   ([ServiceCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[Name]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[ImagePath])
VALUES
   ('7'
   ,'2'
   ,'2'
   ,'Transporte'
   ,'Hay mecánicos de coche, moto o bici, y también expertos en mudanzas. Todo para ayudarte a que tú y tus cosas lleguéis a vuestro destino.'
   ,'7/13/2011 12:00:00 AM'
   ,'7/13/2011 12:00:00 AM'
   ,'jd'
   ,'True'
   ,NULL)
INSERT INTO [servicecategory]
   ([ServiceCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[Name]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[ImagePath])
VALUES
   ('8'
   ,'1'
   ,'1'
   ,'Office'
   ,'Tax season have you nervous? Need a cleaner for your office?  Get some help for your business to make this year more successful than the rest.'
   ,'7/14/2011 12:00:00 AM'
   ,'7/14/2011 12:00:00 AM'
   ,'jd'
   ,'True'
   ,NULL)
INSERT INTO [servicecategory]
   ([ServiceCategoryID]
   ,[LanguageID]
   ,[CountryID]
   ,[Name]
   ,[Description]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[Active]
   ,[ImagePath])
VALUES
   ('8'
   ,'2'
   ,'2'
   ,'Empresas'
   ,'¿Necesitas una colaboración extra en la empresa? contrata asesores fiscales, legales y muchos otros profesionales que te ayuden a que este año sea más exitoso que los anteriores.'
   ,'7/14/2011 12:00:00 AM'
   ,'7/14/2011 12:00:00 AM'
   ,'jd'
   ,'True'
   ,NULL)
ALTER TABLE servicecategory WITH CHECK CHECK CONSTRAINT all 
 ALTER TABLE servicecategory ENABLE TRIGGER all 
 GO 

EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'