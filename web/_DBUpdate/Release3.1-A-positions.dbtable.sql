
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER  all'
DELETE FROM positions 
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('-1'
   ,'1'
   ,'1'
   ,'Default values'
   ,NULL
   ,NULL
   ,'Default values for positions related data records (as positionRatings table)'
   ,'10/13/2012 12:00:00 AM'
   ,'10/13/2012 12:00:00 AM'
   ,'il'
   ,''
   ,''
   ,''
   ,'False'
   ,NULL
   ,NULL
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('0'
   ,'1'
   ,'1'
   ,'No position - is customer'
   ,''
   ,''
   ,'Special ID to refer records related to the user as customer'
   ,'10/13/2012 12:00:00 AM'
   ,'10/13/2012 12:00:00 AM'
   ,'il'
   ,''
   ,''
   ,''
   ,'False'
   ,NULL
   ,NULL
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('1'
   ,'1'
   ,'1'
   ,'Administrative Assistant'
   ,'Administrative Assistants'
   ,''
   ,'Perform duties too varied and diverse to be classified in any specific office clerical occupation, requiring knowledge of office systems and procedures.  Clerical duties may be assigned in accordance with the office procedures of individual establishments and may include a combination of answering telephones, bookkeeping, typing or word processing, stenography, office machine operation, and filing.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'43-9061'
   ,'Office Clerks, General'
   ,'Perform duties too varied and diverse to be classified in any specific office clerical occupation, requiring knowledge of office systems and procedures.  Clerical duties may be assigned in accordance with the office procedures of individual establishments and may include a combination of answering telephones, bookkeeping, typing or word processing, stenography, office machine operation, and filing.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('1'
   ,'2'
   ,'2'
   ,'Auxiliar Administrativo/a'
   ,'Auxiliares Administrativos/as'
   ,''
   ,'Desempeñan funciones que requieren conocimientos de los sistemas y procedimientos de tareas de oficina de tipo tan variado y diverso que no pueden ser clasificados dentro de una ocupaci¢n de tareas de oficina espec¡fica. Las tareas de oficina pueden asignarse de acuerdo a los procedimientos de oficina de establecimientos individuales y pueden comprender una combinaci¢n de funciones, como por ejemplo, atender el tel‚fono, ocuparse de los registros, escribir a m quina u operar un programa de procesamiento de texto, tomar notas estenogr ficas, operar m quinas de oficina y archivar.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('2'
   ,'1'
   ,'1'
   ,'Carpet Cleaner'
   ,'Carpet Cleaners'
   ,''
   ,'Pretty straightforward -- you, a carpet cleaning expert, employ steam, stain removal, and any other tricks of the trade to produce plush, clean, comfy carpets.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'37-2011'
   ,'Janitors and Cleaners'
   ,'Keep buildings in clean and orderly condition.  Perform heavy cleaning duties, such as cleaning floors, shampooing rugs, washing walls and glass, and removing rubbish.  Duties may include tending furnace and boiler, performing routine maintenance activities, notifying management of need for repairs, and cleaning snow or debris from sidewalk.'
   ,'True'
   ,'2'
   ,'Hire a cleaning expert to tackle your carpets with steam, spot removal, and their general know-how and get your groundcover plush, clean, and comfy once more.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('2'
   ,'2'
   ,'2'
   ,'Limpiador/a de Alfombras'
   ,'Limpiadores/as de Alfombras'
   ,''
   ,'Mantienen las condiciones de limpieza y orden de los edificios. Desempe§an trabajos pesados de limpieza, como por ejemplo limpieza de suelos, lavado de alfombras, limpieza de paredes y vidrios, y retiro de residuos. Sus tareas pueden incluir la atenci¢n del sistema de calefacci¢n y de la caldera de agua caliente, realizar actividades de mantenimiento de rutina, notificar al personal de administraci¢n las necesidades de reparaciones, y despejar o limpiar la nieve de las aceras.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('3'
   ,'1'
   ,'1'
   ,'Pool Cleaner'
   ,'Pool Cleaners'
   ,''
   ,'Clean pools and keep them sparkling, pristine, and ready for play.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/31/2011 12:00:00 AM'
   ,'jd'
   ,'37-2011'
   ,'Janitors and Cleaners'
   ,'Keep buildings in clean and orderly condition.  Perform heavy cleaning duties, such as cleaning floors, shampooing rugs, washing walls and glass, and removing rubbish.  Duties may include tending furnace and boiler, performing routine maintenance activities, notifying management of need for repairs, and cleaning snow or debris from sidewalk.'
   ,'True'
   ,'2'
   ,'Get your pool pristine, free of debris and algae, and ready for play. '
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('3'
   ,'2'
   ,'2'
   ,'Limpia Piscinas'
   ,'Limpia Piscinas'
   ,''
   ,'Mantienen las condiciones de limpieza y orden de los edificios. Desempe§an trabajos pesados de limpieza, como por ejemplo limpieza de suelos, lavado de alfombras, limpieza de paredes y vidrios, y retiro de residuos. Sus tareas pueden incluir la atenci¢n del sistema de calefacci¢n y de la caldera de agua caliente, realizar actividades de mantenimiento de rutina, notificar al personal de administraci¢n las necesidades de reparaciones, y despejar o limpiar la nieve de las aceras.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('4'
   ,'1'
   ,'1'
   ,'Pressure Washer'
   ,'Pressure Washers'
   ,''
   ,'Tackle any and every surface with your trusty pressure washer, stripping dirt away like no one''s business.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'37-2011'
   ,'Janitors and Cleaners'
   ,'Keep buildings in clean and orderly condition.  Perform heavy cleaning duties, such as cleaning floors, shampooing rugs, washing walls and glass, and removing rubbish.  Duties may include tending furnace and boiler, performing routine maintenance activities, notifying management of need for repairs, and cleaning snow or debris from sidewalk.'
   ,'True'
   ,'3'
   ,'Remember what your sidewalk looked like before a horde of gum-snapping teenagers left their ABC all over it? Find a pressure washer to get everything in sparkly, tip-top shape again, eliminating dirt, debris, and ABC with a flick of the wrist.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('4'
   ,'2'
   ,'2'
   ,'Limpiador/a a PresiÛn'
   ,'Limpiadores/as a PresiÛn'
   ,''
   ,'Mantienen las condiciones de limpieza y orden de los edificios. Desempe§an trabajos pesados de limpieza, como por ejemplo limpieza de suelos, lavado de alfombras, limpieza de paredes y vidrios, y retiro de residuos. Sus tareas pueden incluir la atenci¢n del sistema de calefacci¢n y de la caldera de agua caliente, realizar actividades de mantenimiento de rutina, notificar al personal de administraci¢n las necesidades de reparaciones, y despejar o limpiar la nieve de las aceras.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('5'
   ,'1'
   ,'1'
   ,'Window Cleaner'
   ,'Window Cleaners'
   ,''
   ,'Spray and scrub windows until they shine like diamonds. Bring your expertise to ensure great, streak-free views throughout the land.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/31/2011 12:00:00 AM'
   ,'jd'
   ,'37-2011'
   ,'Janitors and Cleaners'
   ,'Keep buildings in clean and orderly condition.  Perform heavy cleaning duties, such as cleaning floors, shampooing rugs, washing walls and glass, and removing rubbish.  Duties may include tending furnace and boiler, performing routine maintenance activities, notifying management of need for repairs, and cleaning snow or debris from sidewalk.'
   ,'True'
   ,'2'
   ,'Not sure if that''s a tree you see or just some weird dark smudge? Time to call an expert in window cleaning to spray, scrub, squeegee, and give you back your great view. '
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('5'
   ,'2'
   ,'2'
   ,'Limpia Ventanas'
   ,'Limpia Ventanas'
   ,''
   ,'Mantienen las condiciones de limpieza y orden de los edificios. Desempe§an trabajos pesados de limpieza, como por ejemplo limpieza de suelos, lavado de alfombras, limpieza de paredes y vidrios, y retiro de residuos. Sus tareas pueden incluir la atenci¢n del sistema de calefacci¢n y de la caldera de agua caliente, realizar actividades de mantenimiento de rutina, notificar al personal de administraci¢n las necesidades de reparaciones, y despejar o limpiar la nieve de las aceras.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('6'
   ,'1'
   ,'1'
   ,'Snow Remover'
   ,'Snow Removers'
   ,''
   ,'Keep driveways, sidewalks, and parking areas usable in snowy conditions.  '
   ,'7/12/2011 12:00:00 AM'
   ,'10/31/2011 12:00:00 AM'
   ,'jd'
   ,'37-2011'
   ,'Janitors and Cleaners'
   ,'Keep buildings in clean and orderly condition.  Perform heavy cleaning duties, such as cleaning floors, shampooing rugs, washing walls and glass, and removing rubbish.  Duties may include tending furnace and boiler, performing routine maintenance activities, notifying management of need for repairs, and cleaning snow or debris from sidewalk.'
   ,'False'
   ,'3'
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('6'
   ,'2'
   ,'2'
   ,'Quitanieves'
   ,'Quitanieves'
   ,''
   ,'Mantienen las condiciones de limpieza y orden de los edificios. Desempe§an trabajos pesados de limpieza, como por ejemplo limpieza de suelos, lavado de alfombras, limpieza de paredes y vidrios, y retiro de residuos. Sus tareas pueden incluir la atenci¢n del sistema de calefacci¢n y de la caldera de agua caliente, realizar actividades de mantenimiento de rutina, notificar al personal de administraci¢n las necesidades de reparaciones, y despejar o limpiar la nieve de las aceras.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('7'
   ,'1'
   ,'1'
   ,'Janitor'
   ,'Janitors'
   ,''
   ,'Keep buildings in clean and orderly condition.  Perform heavy cleaning duties, such as cleaning floors, shampooing rugs, washing walls and glass, and removing rubbish.  Duties may include tending furnace and boiler, performing routine maintenance activities, notifying management of need for repairs, and cleaning snow or debris from sidewalk.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'37-2011'
   ,'Janitors and Cleaners'
   ,'Keep buildings in clean and orderly condition.  Perform heavy cleaning duties, such as cleaning floors, shampooing rugs, washing walls and glass, and removing rubbish.  Duties may include tending furnace and boiler, performing routine maintenance activities, notifying management of need for repairs, and cleaning snow or debris from sidewalk.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('7'
   ,'2'
   ,'2'
   ,'Conserje'
   ,'Conserjes'
   ,''
   ,'Mantienen las condiciones de limpieza y orden de los edificios. Desempe§an trabajos pesados de limpieza, como por ejemplo limpieza de suelos, lavado de alfombras, limpieza de paredes y vidrios, y retiro de residuos. Sus tareas pueden incluir la atenci¢n del sistema de calefacci¢n y de la caldera de agua caliente, realizar actividades de mantenimiento de rutina, notificar al personal de administraci¢n las necesidades de reparaciones, y despejar o limpiar la nieve de las aceras.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('8'
   ,'1'
   ,'1'
   ,'Mover'
   ,'Movers'
   ,''
   ,'Heave, ho! Transport all sorts of stuff, including boxes and heavy objects, out of buildings and into the next place.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/31/2011 12:00:00 AM'
   ,'jd'
   ,'53-7062'
   ,'Laborers and Freight, Stock, and Material Movers, Hand'
   ,'Manually move freight, stock, or other materials or perform other general labor.  Includes all manual laborers not elsewhere classified.  Excludes “Material Moving Workers" (53-7011 through 53-7199) who use power equipment.  Excludes “Construction Laborers" (47-2061) and "Helpers, Construction Trades  (47-3011 through 47-3019).'
   ,'True'
   ,'2'
   ,'Moving? Ugh. Take the pain out of the ordeal by hiring a professional mover to gather up all your boxes, heavy furniture, and weirdly-shaped lamps and get ''em out of the house.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('8'
   ,'2'
   ,'2'
   ,'Transportista'
   ,'Transportistas'
   ,''
   ,'Trasladan manualmente carga, mercader°a u otros materiales o realizan otras labores generales. Incluye a todos los operarios manuales que no est n clasificados en otro lugar. Excluye a los ?Trabajadores Relacionados con el Traslado de Materiales? (desde c¢digo 53-7011 hasta c¢digo 53-7199) que utilizan equipo motorizado. Excluye a los ?Obreros de la Construcci¢n? (47-2061) y a los ?Ayudantes de Oficios de la Construcci¢n? (desde c¢digo 47-3011 hasta c¢digo 47-3019).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('9'
   ,'1'
   ,'1'
   ,'Day Laborer'
   ,'Day Laborers'
   ,''
   ,'Perform general manual labor not requiring specific expertise.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'53-7062'
   ,'Laborers and Freight, Stock, and Material Movers, Hand'
   ,'Manually move freight, stock, or other materials or perform other general labor.  Includes all manual laborers not elsewhere classified.  Excludes “Material Moving Workers" (53-7011 through 53-7199) who use power equipment.  Excludes “Construction Laborers" (47-2061) and "Helpers, Construction Trades  (47-3011 through 47-3019).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('9'
   ,'2'
   ,'2'
   ,'Jornalero/a'
   ,'Jornaleros/as'
   ,''
   ,'Trasladan manualmente carga, mercader°a u otros materiales o realizan otras labores generales. Incluye a todos los operarios manuales que no est n clasificados en otro lugar. Excluye a los ?Trabajadores Relacionados con el Traslado de Materiales? (desde c¢digo 53-7011 hasta c¢digo 53-7199) que utilizan equipo motorizado. Excluye a los ?Obreros de la Construcci¢n? (47-2061) y a los ?Ayudantes de Oficios de la Construcci¢n? (desde c¢digo 47-3011 hasta c¢digo 47-3019).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('10'
   ,'1'
   ,'1'
   ,'Piano Mover'
   ,'Piano Movers'
   ,''
   ,'We are in awe of you. What a task, manually moving pianos with an eye towards preventing an damage to the instrument. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'53-7062'
   ,'Laborers and Freight, Stock, and Material Movers, Hand'
   ,'Manually move freight, stock, or other materials or perform other general labor.  Includes all manual laborers not elsewhere classified.  Excludes “Material Moving Workers" (53-7011 through 53-7199) who use power equipment.  Excludes “Construction Laborers" (47-2061) and "Helpers, Construction Trades  (47-3011 through 47-3019).'
   ,'True'
   ,'2'
   ,'Ease that baby grand out with an expert trained in intrumental maneuvering, preventing damage, and moving it with care and ease.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('10'
   ,'2'
   ,'2'
   ,'Transportista de Pianos'
   ,'Transportistas de Pianos'
   ,''
   ,'Trasladan manualmente carga, mercader°a u otros materiales o realizan otras labores generales. Incluye a todos los operarios manuales que no est n clasificados en otro lugar. Excluye a los ?Trabajadores Relacionados con el Traslado de Materiales? (desde c¢digo 53-7011 hasta c¢digo 53-7199) que utilizan equipo motorizado. Excluye a los ?Obreros de la Construcci¢n? (47-2061) y a los ?Ayudantes de Oficios de la Construcci¢n? (desde c¢digo 47-3011 hasta c¢digo 47-3019).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('11'
   ,'1'
   ,'1'
   ,'Fine Art Mover'
   ,'Fine Art Movers'
   ,''
   ,'Using your enviable expertise, help customers move their valuable artwork without damage or amateur mistakes.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'53-7062'
   ,'Laborers and Freight, Stock, and Material Movers, Hand'
   ,'Manually move freight, stock, or other materials or perform other general labor.  Includes all manual laborers not elsewhere classified.  Excludes “Material Moving Workers" (53-7011 through 53-7199) who use power equipment.  Excludes “Construction Laborers" (47-2061) and "Helpers, Construction Trades  (47-3011 through 47-3019).'
   ,'True'
   ,'2'
   ,'Van Gogh or ancient family tree, move your valuable artwork carefully with the help of a trained expert.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('11'
   ,'2'
   ,'2'
   ,'Transportista de Arte'
   ,'Transportistas de Arte'
   ,''
   ,'Trasladan manualmente carga, mercader°a u otros materiales o realizan otras labores generales. Incluye a todos los operarios manuales que no est n clasificados en otro lugar. Excluye a los ?Trabajadores Relacionados con el Traslado de Materiales? (desde c¢digo 53-7011 hasta c¢digo 53-7199) que utilizan equipo motorizado. Excluye a los ?Obreros de la Construcci¢n? (47-2061) y a los ?Ayudantes de Oficios de la Construcci¢n? (desde c¢digo 47-3011 hasta c¢digo 47-3019).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('12'
   ,'1'
   ,'1'
   ,'Bookkeeper'
   ,'Bookkeepers'
   ,''
   ,'Compute, classify, and record numerical data to keep financial records complete.  Perform any combination of routine calculating, posting, and verifying duties to obtain primary financial data for use in maintaining accounting records.  May also check the accuracy of figures, calculations, and postings pertaining to business transactions recorded by other workers.  Excludes ?Payroll and Timekeeping Clerks? (43-3051).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'43-3031'
   ,'Bookkeeping, Accounting, and Auditing Clerks'
   ,'Compute, classify, and record numerical data to keep financial records complete.  Perform any combination of routine calculating, posting, and verifying duties to obtain primary financial data for use in maintaining accounting records.  May also check the accuracy of figures, calculations, and postings pertaining to business transactions recorded by other workers.  Excludes ?Payroll and Timekeeping Clerks? (43-3051).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('12'
   ,'2'
   ,'2'
   ,'Contable'
   ,'Contables'
   ,''
   ,'Calculan, clasifican y registran datos num‚ricos con el fin de mantener registros financieros completos. Llevan a cabo diversas tareas rutinarias de c lculo, registro y verificaci¢n con el fin de obtener datos financieros primarios que son necesarios para el mantenimiento de registros de contabilidad. Tambi‚n pueden verificar la exactitud de las cifras, c lculos y registros pertinentes a las transacciones comerciales registradas por otros trabajadores. Excluye a los ?Oficinistas de N¢mina y de Registro de Horas Trabajadas? (43-3051).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('13'
   ,'1'
   ,'1'
   ,'Heavy Truck Driver'
   ,'Heavy Truck Drivers'
   ,''
   ,'Drive a tractor-trailer combination or a truck with a capacity of at least 26,000 pounds Gross Vehicle Weight (GVW).  May be required to unload truck.  Requires commercial drivers'' license.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'53-3032'
   ,'Heavy and Tractor-Trailer Truck Drivers'
   ,'Drive a tractor-trailer combination or a truck with a capacity of at least 26,000 pounds Gross Vehicle Weight (GVW).  May be required to unload truck.  Requires commercial drivers'' license.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('13'
   ,'2'
   ,'2'
   ,'Camionero/a'
   ,'Camioneros/as'
   ,''
   ,'Conducen una combinaci¢n de tractocami¢n o un cami¢n con una capacidad igual o superior a 26,000 libras de Peso Bruto de Vehiculo. Se les puede requerir que realicen tareas de carga y descarga. Deben poseer licencia de conducir comercial.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('14'
   ,'1'
   ,'1'
   ,'Housekeeper'
   ,'Housekeepers'
   ,'Cleaner, Cleaning Lady, Maid'
   ,'Get everything in tip-top shape with all sorts of light cleaning duties, from vacuuming to dusting to changing bed linens.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/31/2011 12:00:00 AM'
   ,'jd'
   ,'37-2012'
   ,'Maids and Housekeeping Cleaners'
   ,'Perform any combination of light cleaning duties to maintain private households or commercial establishments, such as hotels and hospitals, in a clean and orderly manner.  Duties may include making beds, replenishing linens, cleaning rooms and halls, and vacuuming.'
   ,'True'
   ,'1'
   ,'Get a little extra help returning your household to tip-top shape. Hire a housekeeper for various light cleaning duties, everything from vacuuming to changing bed linens to dusting to polishing the nooks and crannies of your home until it gleams.'
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('14'
   ,'2'
   ,'2'
   ,'Limpiador/a'
   ,'Limpiadores/as'
   ,'Cleaner'
   ,'Realizan una combinaci¢n de tareas livianas de limpieza para mantener las condiciones de limpieza y orden en casas privadas o establecimientos comerciales, como por ejemplo hoteles y hospitales. Sus tareas pueden incluir tender camas, cambiar s banas y toallas, limpiar habitaciones y  reas comunes y pasar la aspiradora.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('15'
   ,'1'
   ,'1'
   ,'Full-time Housekeeper'
   ,'Full-time Housekeepers'
   ,''
   ,'Perform any combination of light cleaning duties to maintain private households or commercial establishments, such as hotels and hospitals, in a clean and orderly manner.  Duties may include making beds, replenishing linens, cleaning rooms and halls, and vacuuming.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'37-2012'
   ,'Maids and Housekeeping Cleaners'
   ,'Perform any combination of light cleaning duties to maintain private households or commercial establishments, such as hotels and hospitals, in a clean and orderly manner.  Duties may include making beds, replenishing linens, cleaning rooms and halls, and vacuuming.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('15'
   ,'2'
   ,'2'
   ,'Empleado/a del Hogar '
   ,'Empleados/as del Hogar '
   ,''
   ,'Realizan una combinaci¢n de tareas livianas de limpieza para mantener las condiciones de limpieza y orden en casas privadas o establecimientos comerciales, como por ejemplo hoteles y hospitales. Sus tareas pueden incluir tender camas, cambiar s banas y toallas, limpiar habitaciones y  reas comunes y pasar la aspiradora.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('16'
   ,'1'
   ,'1'
   ,'Babysitter'
   ,'Babysitters'
   ,'Sitter'
   ,'Give kids and their parents an extra hand, helping with dressing, feeding, bathing, and pb & j''s. Help out at homes or schools, businesses, or childcare insitutions.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'39-9011'
   ,'Childcare Workers'
   ,'Attend to children at schools, businesses, private households, and childcare institutions.  Perform a variety of tasks, such as dressing, feeding, bathing, and overseeing play.  Excludes "Preschool Teachers, Except Special Education" (25-2011) and "Teacher Assistants" (25-9041).'
   ,'True'
   ,'1'
   ,'Take a breather from little Jimmy or even a night out on the town by hiring a babysitter to take over PB & J duty, dressing, bathing, and/or playtime.'
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('16'
   ,'2'
   ,'2'
   ,'Canguro'
   ,'Canguros'
   ,''
   ,'Atienden ni§os en escuelas, negocios, residencias privadas e instituciones de cuidado de ni§os. Realizan diversas tareas, como por ejemplo vestir, alimentar, ba§ar y supervisar los juegos de los ni§os. Excluye a los ?Maestros de Nivel Preescolar, Excepto de Educaci¢n Especial? (25-2011) y a los ?Maestros Ayudantes? (25-9041).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('17'
   ,'1'
   ,'1'
   ,'Nanny'
   ,'Nannies'
   ,''
   ,'Give kids and their parents an extra hand, helping with dressing, feeding, bathing, and pb & j''s. Help out at homes or schools, businesses, or childcare insitutions.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2016 12:00:00 AM'
   ,'fg'
   ,'39-9011'
   ,'Childcare Workers'
   ,'Attend to children at schools, businesses, private households, and childcare institutions.  Perform a variety of tasks, such as dressing, feeding, bathing, and overseeing play.  Excludes "Preschool Teachers, Except Special Education" (25-2011) and "Teacher Assistants" (25-9041).'
   ,'True'
   ,'2'
   ,'Find the perfect nanny to help out with little Jimmy. Duties might include PB & J manufacturing, dressing, bathing, and playtime.'
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('17'
   ,'2'
   ,'2'
   ,'NiÒero/a'
   ,'NiÒeros/as'
   ,''
   ,'Atienden ni§os en escuelas, negocios, residencias privadas e instituciones de cuidado de ni§os. Realizan diversas tareas, como por ejemplo vestir, alimentar, ba§ar y supervisar los juegos de los ni§os. Excluye a los ?Maestros de Nivel Preescolar, Excepto de Educaci¢n Especial? (25-2011) y a los ?Maestros Ayudantes? (25-9041).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2019 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('18'
   ,'1'
   ,'1'
   ,'Daycare Provider'
   ,'Daycare Providers'
   ,'Babysitter, Sitter'
   ,'Give kids and their parents an extra hand, helping with dressing, feeding, bathing, and pb & j''s. Help out at homes or schools, businesses, or childcare insitutions.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2020 12:00:00 AM'
   ,'fg'
   ,'39-9011'
   ,'Childcare Workers'
   ,'Attend to children at schools, businesses, private households, and childcare institutions.  Perform a variety of tasks, such as dressing, feeding, bathing, and overseeing play.  Excludes "Preschool Teachers, Except Special Education" (25-2011) and "Teacher Assistants" (25-9041).'
   ,'True'
   ,'2'
   ,'Find the perfect daycare provider to help little Sammie on his journey as a great kiddo. Duties might include PB & J manufacturing and kumbaya. '
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('18'
   ,'2'
   ,'2'
   ,'Cuidador/ra'
   ,'Cuidadores/as'
   ,''
   ,'Atienden ni§os en escuelas, negocios, residencias privadas e instituciones de cuidado de ni§os. Realizan diversas tareas, como por ejemplo vestir, alimentar, ba§ar y supervisar los juegos de los ni§os. Excluye a los ?Maestros de Nivel Preescolar, Excepto de Educaci¢n Especial? (25-2011) y a los ?Maestros Ayudantes? (25-9041).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2023 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('19'
   ,'1'
   ,'1'
   ,'Accountant'
   ,'Accountants'
   ,''
   ,'Bring your financial know-how to help customers'' make sense of their financial records and prepare official statements. If needed, advise and help install systems recording financial data.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'13-2011'
   ,'Accountants and Auditors'
   ,'Examine, analyze, and interpret accounting records to prepare financial statements, give advice, or audit and evaluate statements prepared by others.  Install or advise on systems of recording costs or other financial and budgetary data.  Excludes ?Tax Examiners and Collectors, and Revenue Agents? (13-2081).'
   ,'True'
   ,'3'
   ,'Get a real-deal financial magician to help you make sense of your finances and prepare official statements, install helpful financial tools, or advise you on otherwise complicated protocol.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('19'
   ,'2'
   ,'2'
   ,'Contable'
   ,'Contables'
   ,''
   ,'Examinan, analizan e interpretan registros de contabilidad para preparar estados financieros, proveen asesoramiento o auditan y eval£an estados financieros preparados por otras personas. Instalan o asesoran sobre sistemas de registro de costos u otros datos financieros y presupuestarios. Excluye a los ?Examinadores y Cobradores de Impuestos y Agentes de Rentas P£blicas? (13-2081).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2025 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('20'
   ,'1'
   ,'1'
   ,'Carpenter'
   ,'Carpenters'
   ,''
   ,'An expert in all things joist, frame, floor, or cabinet-related? Tell us more. Bring your craftsmanship and know-how to customers needing help wth construction projects and plans. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2031'
   ,'Carpenters'
   ,'Construct, erect, install, or repair structures and fixtures made of wood, such as concrete forms; building frameworks, including partitions, joists, studding, and rafters; and wood stairways, window and door frames, and hardwood floors.  May also install cabinets, siding, drywall and batt or roll insulation. Includes brattice builders who build doors or brattices (ventilation walls or partitions) in underground passageways'
   ,'True'
   ,'3'
   ,'Finally get those joists in order (we only kind of know what that means)! Hire an expert craftsman, who knows way more than we do, to help plan and install your wood-based dreams. Choose among practiced cabinet-makers, joyful joisters, and savvy sanders.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('20'
   ,'2'
   ,'2'
   ,'Carpintero'
   ,'Carpinteros'
   ,''
   ,'Construyen, erigen, instalan o reparan estructuras y accesorios hechos con madera, como por ejemplo moldes para concreto, armazones para construcci¢n, incluyendo divisiones, viguetas, tabiques y vigas; y escaleras de madera, marcos de puertas y ventanas y pisos de madera. Tambi‚n pueden instalar gabinetes, colocar revestimientos, paneles de yeso y materiales aislantes en rollo o listones. Incluye a los constructores de puertas o tabiques de ventilaci¢n (paredes o divisiones de ventilaci¢n) instalados en pasadizos subterr neos.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2025 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('21'
   ,'1'
   ,'1'
   ,'Construction Laborer'
   ,'Construction Laborers'
   ,''
   ,'Perform tasks involving physical labor at construction sites.  May operate hand and power tools of all types: air hammers, earth tampers, cement mixers, small mechanical hoists, surveying and measuring equipment, and a variety of other equipment and instruments.  May clean and prepare sites, dig trenches, set braces to support the sides of excavations, erect scaffolding, and clean up rubble, debris and other waste materials.  May assist other craft workers.  Construction laborers who primarily assist a particular craft worker are classified under "Helpers, Construction Trades" (47-3010).  Excludes “Hazardous Materials Removal Workers” (47-4041).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2061'
   ,'Construction Laborers'
   ,'Perform tasks involving physical labor at construction sites.  May operate hand and power tools of all types: air hammers, earth tampers, cement mixers, small mechanical hoists, surveying and measuring equipment, and a variety of other equipment and instruments.  May clean and prepare sites, dig trenches, set braces to support the sides of excavations, erect scaffolding, and clean up rubble, debris and other waste materials.  May assist other craft workers.  Construction laborers who primarily assist a particular craft worker are classified under "Helpers, Construction Trades" (47-3010).  Excludes “Hazardous Materials Removal Workers” (47-4041).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('21'
   ,'2'
   ,'2'
   ,'PeÛn de ConstrucciÛn'
   ,'Peones de ConstrucciÛn'
   ,''
   ,'Trabajan en obras de construcci¢n desempe§ando tareas que requieren trabajo f°sico. Pueden operar herramientas manuales o de motor de todo tipo: martillos neum ticos, aplanadoras, mezcladoras de cemento, peque§os aparatos mec nicos de izamiento, equipos de agrimensura y medici¢n y una variedad de otros equipos e instrumentos. Pueden limpiar y preparar terrenos de construcci¢n, cavar zanjas, colocar refuerzos en las paredes laterales de las excavaciones, construir andamios y limpiar escombros, restos y otros materiales de desecho. Pueden ayudar a trabajadores en otros oficios de la construcci¢n. Los obreros de la construcci¢n que asisten a un trabajador de un oficio en particular est n clasificados en la ocupaci¢n ?Ayudantes, Oficios de Construcci¢n? (47-3010). Excluye a los ?Trabajadores de Remoci¢n de Materiales Peligrosos? (47-4041).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2025 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('22'
   ,'1'
   ,'1'
   ,'Gardener'
   ,'Garderners'
   ,''
   ,'Manicuring ain''t always fingernail-related. Help landscape and maintain gardens and grounds,
 doing everything from sod-laying to pruning to watering and mowing.  Using hand or power tools or variosu other equipment,
 transform all that you see into a verdant oasis!'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'37-3011'
   ,'Landscaping and Groundskeeping Workers'
   ,'Landscape or maintain grounds of property using hand or power tools or equipment.  Workers typically perform a variety of tasks, which may include any combination of the following: sod laying, mowing, trimming, planting, watering, fertilizing, digging, raking, sprinkler installation, and installation of mortarless segmental concrete masonry wall units.  Excludes "Farmworkers and Laborers, Crop, Nursery, and Greenhouse" (45-2092).'
   ,'True'
   ,'1'
   ,'Get your garden or grounds in tip-top shape with experts in pruning, mowing, watering, sod-laying, all that good stuff guaranteed to get you out and about enjoying your yard. '
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('22'
   ,'2'
   ,'2'
   ,'Jardinero'
   ,'Jardineros'
   ,''
   ,'Realizan tareas de jardiner¡a y de mantenimiento de  reas verdes de una propiedad utilizando herramientas o equipos manuales o activados con fuerza motriz. Generalmente, estos trabajadores desempe¤an una variedad de tareas que puede incluir una combinaci¢n de las siguientes actividades: plantar c‚sped, cortar el c‚sped, podar, plantar, regar, fertilizar, cavar, rastrillar, instalar regadores e instalar segmentos de muros de concreto sin unirlos con mezcla o cemento. Excluye a los ?Trabajadores y Jornaleros Agr¡colas, de Cultivos, de Viveros y de Invernaderos? (45-2092).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2025 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('23'
   ,'1'
   ,'1'
   ,'Lawncare Specialist'
   ,'Lawncare Specialists'
   ,'Lawncare, Mower, Yard worker, Lawn worker, Yardcare'
   ,'Help lawn-owners in need of a desperate makeover or just general upkeep. Duties include sod laying,
 mowing,
 trimming,
 planting,
 watering,
 fertilizing,
 digging,
 raking,
 and sprinkler installation. '
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2026 12:00:00 AM'
   ,'fg'
   ,'37-3011'
   ,'Landscaping and Groundskeeping Workers'
   ,'Landscape or maintain grounds of property using hand or power tools or equipment.  Workers typically perform a variety of tasks, which may include any combination of the following: sod laying, mowing, trimming, planting, watering, fertilizing, digging, raking, sprinkler installation, and installation of mortarless segmental concrete masonry wall units.  Excludes "Farmworkers and Laborers, Crop, Nursery, and Greenhouse" (45-2092).'
   ,'True'
   ,'1'
   ,'Finally get your lawn a much-needed manicure, or maybe just finally get yourself a lawn in the first place. Hire a specialist to install sod, sprinklers, and the like, trim all the green stuff, and fertilize, rake, or dig.'
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('23'
   ,'2'
   ,'2'
   ,'Jardinero'
   ,'Jardineros'
   ,''
   ,'Realizan tareas de jardiner¡a y de mantenimiento de  reas verdes de una propiedad utilizando herramientas o equipos manuales o activados con fuerza motriz. Generalmente, estos trabajadores desempe¤an una variedad de tareas que puede incluir una combinaci¢n de las siguientes actividades: plantar c‚sped, cortar el c‚sped, podar, plantar, regar, fertilizar, cavar, rastrillar, instalar regadores e instalar segmentos de muros de concreto sin unirlos con mezcla o cemento. Excluye a los ?Trabajadores y Jornaleros Agr¡colas, de Cultivos, de Viveros y de Invernaderos? (45-2092).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/25/2029 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('24'
   ,'1'
   ,'1'
   ,'Receptionist'
   ,'Receptionists'
   ,''
   ,'Answer inquiries and provide information to the general public, customers, visitors, and other interested parties regarding activities conducted at establishment and location of departments, offices, and employees within the organization.  Excludes "Switchboard Operators, Including Answering Service" (43-2011).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'43-4171'
   ,'Receptionists and Information Clerks'
   ,'Answer inquiries and provide information to the general public, customers, visitors, and other interested parties regarding activities conducted at establishment and location of departments, offices, and employees within the organization.  Excludes "Switchboard Operators, Including Answering Service" (43-2011).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('24'
   ,'2'
   ,'2'
   ,'Recepcionista'
   ,'Recepcionistas'
   ,''
   ,'Responden preguntas y suministran informaci¢n al p£blico en general, clientes, visitantes y otras personas interesadas en lo que se refiere a las actividades llevadas a cabo en el establecimiento y a la ubicaci¢n de los departamentos, oficinas y empleados dentro de la organizaci¢n. Excluye a los ?Operadores de Sistema Telef¢nico Central, Incluye Servicio de Contestaci¢n de Llamadas? (43-2011).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('25'
   ,'1'
   ,'1'
   ,'Security Guard'
   ,'Security Guards'
   ,''
   ,'Guard, patrol, or monitor premises to prevent theft, violence, or infractions of rules.  May operate x-ray and metal detector equipment.  Excludes ?Transportation Security Screeners? (33-9093).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'33-9032'
   ,'Security Guards'
   ,'Guard, patrol, or monitor premises to prevent theft, violence, or infractions of rules.  May operate x-ray and metal detector equipment.  Excludes ?Transportation Security Screeners? (33-9093).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('25'
   ,'2'
   ,'2'
   ,'Guardia de Seguridad'
   ,'Guardias de Seguridad'
   ,''
   ,'Vigilan, patrullan o monitorean un establecimiento para prevenir robos, situaciones de violencia o infracciones a las reglas. Pueden operar equipo de rayos X y detectores de metales. Excluye a los ?Agentes de la Seguridad en el Transporte? (33-9093).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('26'
   ,'1'
   ,'1'
   ,'Light Truck Driver'
   ,'Light Truck Drivers'
   ,''
   ,'Drive a light vehicle, such as a truck or van, with a capacity of less than 26,000 pounds Gross Vehicle Weight (GVW), primarily to deliver or pick up merchandise or to deliver packages.  May load and unload vehicle.  Excludes ?Couriers and Messengers"" (43-5021) and ?Driver/Sales Workers? (53-3031).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'53-3033'
   ,'Light Truck or Delivery Services Drivers'
   ,'Drive a light vehicle, such as a truck or van, with a capacity of less than 26,000 pounds Gross Vehicle Weight (GVW), primarily to deliver or pick up merchandise or to deliver packages.  May load and unload vehicle.  Excludes ?Couriers and Messengers"" (43-5021) and ?Driver/Sales Workers? (53-3031).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('26'
   ,'2'
   ,'2'
   ,''
   ,''
   ,''
   ,'Conducen un veh°culo liviano, como por ejemplo un cami¢n o furgoneta, con una capacidad de menos de 26,000 libras de Peso Bruto de Veh°culo, con el objetivo de entregar o recoger mercader°a o de entregar paquetes. Pueden cargar y descargar el veh°culo. Excluye a los ?Mensajeros y Repartidores? (43-5021) y a los ?Conductores/Vendedores? (53-3031).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('27'
   ,'1'
   ,'1'
   ,'Home Health Aide'
   ,'Home Health Aides'
   ,''
   ,'Provide routine individualized healthcare, everything from changing bandages and dressing wounds to applying topical medications. Your patients will include the elderly, convalescents, and persons with disabilities, and you will be working either in their home or a care facility.  As a trusted helper, you monitor or report changes in health status, and might be relied upon for help bathing, dressing, and grooming.  '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'31-1011'
   ,'Home Health Aides'
   ,'Provide routine individualized healthcare such as changing bandages and dressing wounds, and applying topical medications to the elderly, convalescents, or persons with disabilities at the patient?s home or in a care facility.  Monitor or report changes in health status.  May also provide personal care such as bathing, dressing, and grooming of patient.'
   ,'True'
   ,'1'
   ,'Find a trusted helper to provide routine, individualized help either in-home or at a care facility. You can trust them to help with everything from dressing wounds to administering medication, and with other careful personal tasks like bathing, dressing, and grooming.'
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('27'
   ,'2'
   ,'2'
   ,'Enfermero/a'
   ,'Enfermeros/as'
   ,''
   ,'Proveen cuidados de salud de rutina e individualizados tales como cambiar vendajes y colocar ap¢sitos o vendas y aplicar medicamentos de administraci¢n t¢pica a personas de edad avanzada, convalecientes o con discapacidades en el hogar del paciente o en un centro de atenci¢n. Monitorean o reportan los cambios que se presentan en el estado de salud de los pacientes. Tambi‚n pueden prestar servicios de cuidados personales como por ejemplo ba¤ar, vestir o acicalar un paciente.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('28'
   ,'1'
   ,'1'
   ,'Personal Care Aide'
   ,'Personal Care Aides'
   ,''
   ,'As a thoughtful expert in personal care, assist the elderly, convalescents, or persons with disabilities with daily living activities at the person''s home or in a care facility.  You might help keep house (making beds, doing laundry, washing dishes) and preparing meals, or you might provide assistance at non-residential care facilities where you would be relied upon to advise individuals and their families regarding nutrition, hygiene, and household activities.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'39-9021'
   ,'Personal Care Aides'
   ,'Assist the elderly, convalescents, or persons with disabilities with daily living activities at the person''s home or in a care facility.  Duties performed at a place of residence may include keeping house (making beds, doing laundry, washing dishes) and preparing meals.  May provide assistance at non-residential care facilities.  May advise families, the elderly, convalescents, and persons with disabilities regarding such things as nutrition, cleanliness, and household activities. '
   ,'True'
   ,'1'
   ,'Find a thoughtful, practiced expert in all things personal-care related, be it in-home or at a care facility. A trained aide will help with routine household tasks and also with ensuring you or your relative''s health and maintenance of a healthy environment. They can be trusted to advise and help with nutrition, hygiene, and keeping house.'
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('28'
   ,'2'
   ,'2'
   ,'Cuidador/ra'
   ,'Cuidadores/as'
   ,''
   ,'Asisten a personas de edad avanzada, convalecientes o discapacitadas a realizar las actividades de la vida diaria en el domicilio de la persona o en un centro de atenci¢n. Las tareas desempe¤adas en el lugar de residencia de la persona atendida pueden incluir el mantenimiento dom‚stico (tender camas, lavar la ropa, lavar los platos) y preparar la comida. Tambi‚n pueden prestar asistencia en centros de atenci¢n no residenciales. Pueden aconsejar a las familias, personas de edad avanzada, personas convalecientes y con discapacidades sobre temas tales como nutrici¢n, aseo y actividades dom‚sticas.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('29'
   ,'1'
   ,'1'
   ,'Auto Service Technician'
   ,'Auto Service Technicians'
   ,''
   ,'Bring a practiced hand to routine auto maintenance like oil changes and tune-ups.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/31/2011 12:00:00 AM'
   ,'jd'
   ,'49-3023'
   ,'Automotive Service Technicians and Mechanics'
   ,'Diagnose, adjust, repair, or overhaul automotive vehicles.  Excludes “Automotive Body and Related Repairers" (49-3021), "Bus and Truck Mechanics and Diesel Engine Specialists" (49-3031), and "Electronic Equipment Installers and Repairers, Motor Vehicles" (49-2096).'
   ,'True'
   ,'1'
   ,'Long past due for an oil change? Fix it,
 start,
 and get that car running smooth as butter with a little help from an expert auto technician. '
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('29'
   ,'2'
   ,'2'
   ,''
   ,''
   ,''
   ,'Diagnostican desperfectos, ajustan, reparan o reacondicionan veh¡culos de motor. Excluye a los ?Reparadores de Carrocer¡as y Componentes Automotrices Relacionados? (49-3021), ?Mec nicos de Autobuses y Camiones y Especialistas en Motores Diesel? (49-3031) y a los ?Instaladores y Reparadores de Equipo El‚ctrico y Electr¢nico de Veh¡culos de Motor? (49-2096).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('30'
   ,'1'
   ,'1'
   ,'Auto Mechanic'
   ,'Auto Mechanics'
   ,''
   ,'Lend your expert hand towards any and all auto issues, diagnosing, adjusting, repairing, or overhauling automotive vehicles.  '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-3023'
   ,'Automotive Service Technicians and Mechanics'
   ,'Diagnose, adjust, repair, or overhaul automotive vehicles.  Excludes “Automotive Body and Related Repairers" (49-3021), "Bus and Truck Mechanics and Diesel Engine Specialists" (49-3031), and "Electronic Equipment Installers and Repairers, Motor Vehicles" (49-2096).'
   ,'True'
   ,'3'
   ,'Figure out, at last, the source of that weird chipmunky noise coming from under the hood. Find the perfect mechanic to diagnose your car''s problems,  fix ''em, and provide car maintenance advice.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('30'
   ,'2'
   ,'2'
   ,'Mec·nico/a'
   ,'Mec·nicos/as'
   ,''
   ,'Diagnostican desperfectos, ajustan, reparan o reacondicionan veh¡culos de motor. Excluye a los ?Reparadores de Carrocer¡as y Componentes Automotrices Relacionados? (49-3021), ?Mec nicos de Autobuses y Camiones y Especialistas en Motores Diesel? (49-3031) y a los ?Instaladores y Reparadores de Equipo El‚ctrico y Electr¢nico de Veh¡culos de Motor? (49-2096).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('31'
   ,'1'
   ,'1'
   ,'Lawyer'
   ,'Lawyers'
   ,''
   ,'Justice at last! Represent clients in criminal and civil litigation and other legal proceedings, draw up legal documents, or manage or advise clients on legal transactions.  You might be a specialist in one particular area or more of a broadly-oriented expert.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'23-1011'
   ,'Lawyers'
   ,'Represent clients in criminal and civil litigation and other legal proceedings, draw up legal documents, or manage or advise clients on legal transactions.  May specialize in a single area or may practice broadly in many areas of law. '
   ,'True'
   ,'2'
   ,'Find legal help with veritable experts who can offer their trained ear to whatever the issue. Pick representation, a helper with legal documents, or an advisor in all things legal protocol.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('31'
   ,'2'
   ,'2'
   ,'Abogado'
   ,'Abogados'
   ,''
   ,'Representan a sus clientes en litigios penales y civiles y en otros procedimientos legales, redactan documentos legales, o se ocupan de la gesti¢n de los tr mites legales de sus clientes o los asesoran sobre los mismos. Pueden estar especializados en una £nica  rea o pueden ejercer la profesi¢n dentro de varias ramas del derecho.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('32'
   ,'1'
   ,'1'
   ,'Tutor'
   ,'Tutors'
   ,''
   ,'Spread the know-it-all spirit by helping students improve their knowledge through structured lessons.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'25-3099'
   ,'Teachers and Instructors, All Other'
   ,'All teachers and instructors not listed separately.'
   ,'True'
   ,'1'
   ,'Finally achieve know-it-all status for you or your child with structured lessons from a well-practiced tutor.'
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('32'
   ,'2'
   ,'2'
   ,'Tutor/a'
   ,'Tutores/as'
   ,''
   ,'Todos los maestros e instructores que no est n listados por separado.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('33'
   ,'1'
   ,'1'
   ,'Instructor'
   ,'Instructors'
   ,''
   ,'All teachers and instructors not listed separately.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'25-3099'
   ,'Teachers and Instructors, All Other'
   ,'All teachers and instructors not listed separately.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('33'
   ,'2'
   ,'2'
   ,'Instructor/a'
   ,'Instructores/as'
   ,''
   ,'Todos los maestros e instructores que no est n listados por separado.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('34'
   ,'1'
   ,'1'
   ,'Electrician'
   ,'Electricians'
   ,''
   ,'Help folks bring a little more light into the world by instalingl, maintaining, and repairing electrical wiring, equipment, and fixtures.  Ensure that work is in accordance with relevant codes. You might install or service street lights, intercom systems, or electrical control systems.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2111'
   ,'Electricians'
   ,'Install, maintain, and repair electrical wiring, equipment, and fixtures.  Ensure that work is in accordance with relevant codes.  May install or service street lights, intercom systems, or electrical control systems.  Excludes ?Security and Fire Alarm Systems Installers"" (49-2098).'
   ,'True'
   ,'3'
   ,'Bring a little light into the world with help from a trained electrician. They might install or repair electrical systems, provide advice on all things voltage, or work on streetlights and outside systems. All of this, of course, with careful thought to relevant codes and regulations.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('34'
   ,'2'
   ,'2'
   ,'Electricista'
   ,'Electricistas'
   ,''
   ,'Instalan, mantienen y reparan instalaciones de cableado, equipos y artefactos el‚ctricos. Garantizan que el trabajo se realice de acuerdo a los c¢digos pertinentes. Pueden instalar o reparar aparatos de alumbrado p£blico, sistemas de intercomunicaci¢n o sistemas de control el‚ctrico. Excluye a los ?Instaladores de Sistemas de Alarma de Seguridad e Incendio? (49-2098).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('35'
   ,'1'
   ,'1'
   ,'Religious Official'
   ,'Religious Officials'
   ,''
   ,'Support and inspire communities by conducting religious worship and performing other spiritual functions. Provide spiritual and moral guidance and assistance to members.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'21-2011'
   ,'Clergy'
   ,'Conduct religious worship and perform other spiritual functions associated with beliefs and practices of religious faith or denomination.  Provide spiritual and moral guidance and assistance to members.'
   ,'True'
   ,'1'
   ,'Find a thoughtful and inspiring religious official to consult, learn from, or lead religious gatherings.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('35'
   ,'2'
   ,'2'
   ,'Religious Official'
   ,''
   ,''
   ,'Realizan servicios religiosos y desempe§an otras funciones espirituales relacionadas con las creencias y pr cticas de una fe o denominaci¢n religiosa. Brindan orientaci¢n y asistencia espiritual y moral a sus miembros.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('36'
   ,'1'
   ,'1'
   ,'Hairstylist'
   ,'Hairstylists'
   ,''
   ,'Lend your stylings to those in need with haircuts,
 washes,
 blow-drys,
 and,
 of course,
 stylings.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'39-5012'
   ,'Hairdressers, Hairstylists, and Cosmetologists'
   ,'Provide beauty services, such as shampooing, cutting, coloring, and styling hair, and massaging and treating scalp.  May apply makeup, dress wigs, perform hair removal, and provide nail and skin care services.  Excludes "Makeup Artists, Theatrical and Performance (39-5091), "Manicurists and Pedicurists" (39-5092), and "Skincare Specialists" (39-5094).'
   ,'True'
   ,'1'
   ,'Bring some "oomph" to your look with a new haircut, sweet styling, or (dare we suggest?) purple tips. Actually, maybe some nice, natural highlights would do the trick. '
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('36'
   ,'2'
   ,'2'
   ,'Peluquero/a'
   ,'Peluqueros/as'
   ,''
   ,'Prestan servicios de belleza, como por ejemplo lavar, cortar, te§ir y peinar el cabello, y proveen tratamientos y masajes para el cuello cabelludo. Pueden aplicar maquillaje, colocar pelucas, hacer depilaciones y prestar servicios de cuidado de la piel y las u§as. Excluye a los ?Maquilladores Art°sticos, Teatrales y de Actores? (39-5091), ?Manicuristas y Pedicuristas? (39-5092) y a los ?Especialistas en Cuidados de la Piel? (39-5094).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('37'
   ,'1'
   ,'1'
   ,'Cosmetologist'
   ,'Cosmetologists'
   ,''
   ,'Treat customers to some first-class aesthetic advice (otherwise known as a "makeover"). Employ your skills in the worlds of hair, skin, and beauty to make sure there''s still some loveliness out there in the world.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'39-5012'
   ,'Hairdressers, Hairstylists, and Cosmetologists'
   ,'Provide beauty services, such as shampooing, cutting, coloring, and styling hair, and massaging and treating scalp.  May apply makeup, dress wigs, perform hair removal, and provide nail and skin care services.  Excludes "Makeup Artists, Theatrical and Performance (39-5091), "Manicurists and Pedicurists" (39-5092), and "Skincare Specialists" (39-5094).'
   ,'True'
   ,'1'
   ,'Add to the world''s loveliness with advice and treatment from an expert in the fields of skin, hair, and beauty. Offering everything from anti-blemish tips to a 90''s-movie-style "oh-my-goodness-here-she-comes-can-you-believe-it" makeover, a cosmetologist can make sure you''re always at your best.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('37'
   ,'2'
   ,'2'
   ,'CosmetÛlogo/a'
   ,'CosmetÛlogos/as'
   ,''
   ,'Prestan servicios de belleza, como por ejemplo lavar, cortar, te§ir y peinar el cabello, y proveen tratamientos y masajes para el cuello cabelludo. Pueden aplicar maquillaje, colocar pelucas, hacer depilaciones y prestar servicios de cuidado de la piel y las u§as. Excluye a los ?Maquilladores Art°sticos, Teatrales y de Actores? (39-5091), ?Manicuristas y Pedicuristas? (39-5092) y a los ?Especialistas en Cuidados de la Piel? (39-5094).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('38'
   ,'1'
   ,'1'
   ,'Hair Removal Specialist'
   ,'Hair Removal Specialists'
   ,''
   ,'You, my friend, are a kind of magician, but with one difference between you and the trained masters of the craft: while they focus on making rabbits disappear, your speciality is in other rather furry things. Bring your abracadabra spirit to help clients remove unsightly body hair. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'39-5012'
   ,'Hairdressers, Hairstylists, and Cosmetologists'
   ,'Provide beauty services, such as shampooing, cutting, coloring, and styling hair, and massaging and treating scalp.  May apply makeup, dress wigs, perform hair removal, and provide nail and skin care services.  Excludes "Makeup Artists, Theatrical and Performance (39-5091), "Manicurists and Pedicurists" (39-5092), and "Skincare Specialists" (39-5094).'
   ,'True'
   ,'1'
   ,'Like any good magician, a hair removal specialist never reveals their secrets. Well, that''s not entirely true. You can count on an expert with experience in electrolysis, waxing, threading, and the like to "disappear" your unwanted hair faster than you can say "Abracadabra!"'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('38'
   ,'2'
   ,'2'
   ,'Depilador/a'
   ,'Depiladores/as'
   ,''
   ,'Prestan servicios de belleza, como por ejemplo lavar, cortar, te§ir y peinar el cabello, y proveen tratamientos y masajes para el cuello cabelludo. Pueden aplicar maquillaje, colocar pelucas, hacer depilaciones y prestar servicios de cuidado de la piel y las u§as. Excluye a los ?Maquilladores Art°sticos, Teatrales y de Actores? (39-5091), ?Manicuristas y Pedicuristas? (39-5092) y a los ?Especialistas en Cuidados de la Piel? (39-5094).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('39'
   ,'1'
   ,'1'
   ,'Bartender'
   ,'Bartenders'
   ,''
   ,'Two parts alcohol expertise, one part charming spirit, and one part quick-thinking makes a terrific bartender (that''s you),  not to mention a PARTY (we''d like to apologize for the terrible pun)!! Help fellow partiers get festivities in order with all that know-how.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'35-3011'
   ,'Bartenders'
   ,'Mix and serve drinks to patrons, directly or through waitstaff.'
   ,'True'
   ,'1'
   ,'Hire yourself a tall glass of water (or something else) with a professional trained in the art of all things alcohol.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('39'
   ,'2'
   ,'2'
   ,'Camarero/a'
   ,'Camareros/as'
   ,''
   ,'Mezclan tragos y los sirven directamente a los clientes o a trav‚s del personal de camareros.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('40'
   ,'1'
   ,'1'
   ,'Plumber'
   ,'Plumbers'
   ,''
   ,'We''re plumb crazy about you guys. Indispensible encyclopedias of all things pipe, drain, and sprinkler related, you speak in a language full of things like "U-Bend" and "sweating the pipe." Share your know-how with clients in need of everything from an emergency fix to a complete plumbing overhaul.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2152'
   ,'Plumbers, Pipefitters, and Steamfitters'
   ,'Assemble, install, alter, and repair pipelines or pipe systems that carry water, steam, air, or other liquids or gases.  May install heating and cooling equipment and mechanical control systems.  Includes sprinklerfitters.'
   ,'True'
   ,'2'
   ,'Plumbers: underappreciated geniuses of your house''s inner workings. Hire someone for anything from a dire, wet emergency to a general-check in or a sprinkler fitting.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('40'
   ,'2'
   ,'2'
   ,'Fontanero/a'
   ,'Fontaneros/as'
   ,''
   ,'Ensamblan, instalan, modifican y reparan ca§er°as o sistemas de conductos de agua, vapor, aire u otros l°quidos o gases. Pueden instalar equipos de calefacci¢n y refrigeraci¢n y sistemas de control mec nico. Incluye a los instaladores de sistemas de rociadores.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('41'
   ,'1'
   ,'1'
   ,'Pipefitter'
   ,'Pipefitters'
   ,''
   ,'Assemble, install, alter, and repair pipelines or pipe systems that carry water, steam, air, or other liquids or gases.  May install heating and cooling equipment and mechanical control systems.  Includes sprinklerfitters.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2152'
   ,'Plumbers, Pipefitters, and Steamfitters'
   ,'Assemble, install, alter, and repair pipelines or pipe systems that carry water, steam, air, or other liquids or gases.  May install heating and cooling equipment and mechanical control systems.  Includes sprinklerfitters.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('41'
   ,'2'
   ,'2'
   ,'Pipefitter'
   ,''
   ,''
   ,'Ensamblan, instalan, modifican y reparan ca§er°as o sistemas de conductos de agua, vapor, aire u otros l°quidos o gases. Pueden instalar equipos de calefacci¢n y refrigeraci¢n y sistemas de control mec nico. Incluye a los instaladores de sistemas de rociadores.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('42'
   ,'1'
   ,'1'
   ,'Sprinkler Installer'
   ,'Sprinkler Installers'
   ,''
   ,'Assemble, install, alter, and repair pipelines or pipe systems that carry water, steam, air, or other liquids or gases.  May install heating and cooling equipment and mechanical control systems.  Includes sprinklerfitters.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2152'
   ,'Plumbers, Pipefitters, and Steamfitters'
   ,'Assemble, install, alter, and repair pipelines or pipe systems that carry water, steam, air, or other liquids or gases.  May install heating and cooling equipment and mechanical control systems.  Includes sprinklerfitters.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('42'
   ,'2'
   ,'2'
   ,'Sprinkler Installer'
   ,''
   ,''
   ,'Ensamblan, instalan, modifican y reparan ca§er°as o sistemas de conductos de agua, vapor, aire u otros l°quidos o gases. Pueden instalar equipos de calefacci¢n y refrigeraci¢n y sistemas de control mec nico. Incluye a los instaladores de sistemas de rociadores.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('43'
   ,'1'
   ,'1'
   ,'Bus Driver'
   ,'Bus Drivers'
   ,''
   ,'Transport students or special clients, such as the elderly or persons with disabilities.  Ensure adherence to safety rules.  May assist passengers in boarding or exiting.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'53-3022'
   ,'Bus Drivers, School or Special Client '
   ,'Transport students or special clients, such as the elderly or persons with disabilities.  Ensure adherence to safety rules.  May assist passengers in boarding or exiting.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('43'
   ,'2'
   ,'2'
   ,'Bus Driver'
   ,''
   ,''
   ,'Transportan estudiantes o clientes especiales, como por ejemplo personas de edad avanzada o con discapacidades. Garantizan el cumplimiento de las normas de seguridad. Pueden ayudar a los pasajeros a entrar o salir del autob£s.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('44'
   ,'1'
   ,'1'
   ,'Painter'
   ,'Painters'
   ,''
   ,'You, my friend, are the cross between artistic genius and Home Improvement-style practicality, but better. Find clients and tackle everything from large-scale projects to simple in-home jobs. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2141'
   ,'Painters, Construction and Maintenance'
   ,'Paint walls, equipment, buildings, bridges, and other structural surfaces, using brushes, rollers, and spray guns.  May remove old paint to prepare surface prior to painting.  May mix colors or oils to obtain desired color or consistency.  Excludes ?Paperhangers"" (47-2142).'
   ,'True'
   ,'1'
   ,'Whatever the paint job, there''s an expert for it to mix colors, carefully conquer your wall/bridge/trim/what have you, and advise on options.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('44'
   ,'2'
   ,'2'
   ,'Pintor/a'
   ,'Pintores/as'
   ,''
   ,'Pintan paredes, equipos, edificios, puentes y superficies de otro tipo de estructuras utilizando pinceles, rodillos y pistolas de aspersi¢n de pintura. Pueden quitar las capas de pintura vieja para preparar la superficie antes de pintarla. Pueden mezclar colores o aceites para obtener el color o consistencia deseados. Excluye a los ?Empapeladores? (47-2142).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('45'
   ,'1'
   ,'1'
   ,'Barback'
   ,'Barbacks'
   ,''
   ,'Facilitate food service.  Clean tables, remove dirty dishes, replace soiled table linens; set tables; replenish supply of clean linens, silverware, glassware, and dishes; supply service bar with food; and serve items such as water, condiments, and coffee to patrons.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'35-9011'
   ,'Dining Room and Cafeteria Attendants and Bartender Helpers'
   ,'Facilitate food service.  Clean tables, remove dirty dishes, replace soiled table linens; set tables; replenish supply of clean linens, silverware, glassware, and dishes; supply service bar with food; and serve items such as water, condiments, and coffee to patrons.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('45'
   ,'2'
   ,'2'
   ,'Barback'
   ,''
   ,''
   ,'Facilitan el servicio de comidas. Limpian mesas, retiran los platos sucios, remplazan la manteler¡a sucia; acondicionan las mesas; cambian manteles y servilletas, cubiertos, cristaler¡a y platos; reabastecen la comida en el servicio de bar; y sirven agua, condimentos y caf‚ a los clientes del lugar.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('46'
   ,'1'
   ,'1'
   ,'Welder'
   ,'Welders'
   ,''
   ,'Use hand-welding, flame-cutting, hand soldering, or brazing equipment to weld or join metal components or to fill holes, indentations, or seams of fabricated metal products.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'51-4121'
   ,'Welders, Cutters, Solderers, and Brazers'
   ,'Use hand-welding, flame-cutting, hand soldering, or brazing equipment to weld or join metal components or to fill holes, indentations, or seams of fabricated metal products.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('46'
   ,'2'
   ,'2'
   ,'Welder'
   ,''
   ,''
   ,'Usan equipo manual de soldar, cortar con llama o esta§ar para soldar o unir componentes de metal o para rellenar orificios, mellas o l°neas de uni¢n de productos fabricados con metal.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('47'
   ,'1'
   ,'1'
   ,'Driver'
   ,'Drivers'
   ,''
   ,'Drive truck or other vehicle over established routes or within an established territory and sell or deliver goods, such as food products, including restaurant take-out items, or pick up or deliver items such as commercial laundry.  May also take orders, collect payment, or stock merchandise at point of delivery.  Includes newspaper delivery drivers.  Excludes "Coin, Vending, and Amusement Machine Servicers and Repairers" (49-9091) and "Light Truck or Delivery Services Drivers" (53-3033).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'53-3031'
   ,'Driver/Sales Workers'
   ,'Drive truck or other vehicle over established routes or within an established territory and sell or deliver goods, such as food products, including restaurant take-out items, or pick up or deliver items such as commercial laundry.  May also take orders, collect payment, or stock merchandise at point of delivery.  Includes newspaper delivery drivers.  Excludes "Coin, Vending, and Amusement Machine Servicers and Repairers" (49-9091) and "Light Truck or Delivery Services Drivers" (53-3033).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('47'
   ,'2'
   ,'2'
   ,'Conductor/a'
   ,'Conductores/as'
   ,''
   ,'Conducen camiones u otro tipo de veh¡culo en rutas establecidas o dentro de una zona establecida y venden o entregan productos, como por ejemplo alimentos, incluye a los conductores que entregan pedidos de restaurantes a domicilio, o que recogen o entregan art¡culos de una lavander¡a comercial. Tambi‚n pueden tomar ¢rdenes de pedido, cobrar, o proveer mercader¡a en el punto de entrega. Incluye a los conductores de entrega domiciliaria de peri¢dicos. Excluye a los ?Reparadores y Encargados de Servicio de M quinas a Monedas, Expendedoras y M quinas de Entretenimiento? (49-9091) y a los ?Conductores de Cami¢n Liviano o de Servicio de Entrega? (53-3033).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('48'
   ,'1'
   ,'1'
   ,'Real Estate Agent'
   ,'Real Estate Agents'
   ,''
   ,'Rent, buy, or sell property for clients.  Perform duties, such as study property listings, interview prospective clients, accompany clients to property site, discuss conditions of sale, and draw up real estate contracts.  Includes agents who represent buyer.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'41-9022'
   ,'Real Estate Sales Agents'
   ,'Rent, buy, or sell property for clients.  Perform duties, such as study property listings, interview prospective clients, accompany clients to property site, discuss conditions of sale, and draw up real estate contracts.  Includes agents who represent buyer.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('48'
   ,'2'
   ,'2'
   ,'Real Estate Agent'
   ,''
   ,''
   ,'Alquilan, compran o venden propiedades para sus clientes. Desempe§an tareas tales como estudiar el listado de propiedades disponibles, entrevistar a los potenciales clientes, acompa§ar a los clientes a visitar las propiedades, discutir las condiciones de venta y redactar contratos de operaciones inmobiliarias. Incluye a los agentes que representan al comprador.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('49'
   ,'1'
   ,'1'
   ,'Car Detailer'
   ,'Car Detailers'
   ,''
   ,'Strip the grime away from machinery, most notably cars, with your knowledge of nooks, crannies, and everything in between.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'53-7061'
   ,'Cleaners of Vehicles and Equipment'
   ,'Wash or otherwise clean vehicles, machinery, and other equipment.  Use such materials as water, cleaning agents, brushes, cloths, and hoses.  Excludes ?Janitors and Cleaners" (37-2011).'
   ,'True'
   ,'1'
   ,'Find a professional to touch up your car or machinery or clean out its nooks and crannies. Then breathe a sigh of contentment upon hitting the open road. '
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('49'
   ,'2'
   ,'2'
   ,'Car Detailer'
   ,''
   ,''
   ,'Lavan o limpian de alg£n otro modo veh¡culos, maquinaria y dem s equipo. Usan materiales tales como agua, agentes de limpieza, cepillos, pa¤os y mangueras. Excluye a los ?Ordenanzas y Empleados de Limpieza, Excepto Empleados Dom‚sticos y Personal de Limpieza de Casas Privadas? (37-2011).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('50'
   ,'1'
   ,'1'
   ,'Telemarketer'
   ,'Telemarketers'
   ,''
   ,'Solicit donations or orders for goods or services over the telephone.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'41-9041'
   ,'Telemarketers'
   ,'Solicit donations or orders for goods or services over the telephone.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('50'
   ,'2'
   ,'2'
   ,'Telemarketer'
   ,''
   ,''
   ,'Solicitan donaciones u ofrecen productos o servicios por tel‚fono.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('51'
   ,'1'
   ,'1'
   ,'HVAC Mechanic'
   ,'HVAC Mechanics'
   ,''
   ,'Install or repair heating, central air conditioning, or refrigeration systems, including oil burners, hot-air furnaces, and heating stoves.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-9021'
   ,'Heating, Air Conditioning, and Refrigeration Mechanics and Installers'
   ,'Install or repair heating, central air conditioning, or refrigeration systems, including oil burners, hot-air furnaces, and heating stoves.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('51'
   ,'2'
   ,'2'
   ,'TÈcnico/a de CalefacciÛn'
   ,'TÈcnicos/as de CalefacciÛn'
   ,''
   ,'Instalan o reparan sistemas de calefacci¢n, aire acondicionado central o refrigeraci¢n, incluyendo aparatos quemadores de aceite, hornos de aire caliente y estufas.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('52'
   ,'1'
   ,'1'
   ,'HVAC Installer'
   ,'HVAC Installers'
   ,''
   ,'Install or repair heating, central air conditioning, or refrigeration systems, including oil burners, hot-air furnaces, and heating stoves.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-9021'
   ,'Heating, Air Conditioning, and Refrigeration Mechanics and Installers'
   ,'Install or repair heating, central air conditioning, or refrigeration systems, including oil burners, hot-air furnaces, and heating stoves.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('52'
   ,'2'
   ,'2'
   ,'HVAC Installer'
   ,''
   ,''
   ,'Instalan o reparan sistemas de calefacci¢n, aire acondicionado central o refrigeraci¢n, incluyendo aparatos quemadores de aceite, hornos de aire caliente y estufas.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('53'
   ,'1'
   ,'1'
   ,'Personal Assistant'
   ,'Personal Assistants'
   ,''
   ,'Find clients specifically seeking your special skills and know-how to tackle their projects and add some finesse otherwise lacking in their daily operations.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'43-9199'
   ,'Office and Administrative Support Workers, All Other'
   ,'All office and administrative support workers not listed separately.'
   ,'True'
   ,'2'
   ,'Find the right person to add a touch of finesse to your daily operations, whether it''s picking up dry cleaning, answering the phone, or keeping you on track with your latest project.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('53'
   ,'2'
   ,'2'
   ,'Personal Assistant'
   ,''
   ,''
   ,'Todos los empleados de oficina y de apoyo administrativo que no est n listados por separado.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('54'
   ,'1'
   ,'1'
   ,'Claims Adjuster'
   ,'Claims Adjusters'
   ,''
   ,'Review settled claims to determine that payments and settlements are made in accordance with company practices and procedures.  Confer with legal counsel on claims requiring litigation.  May also settle insurance claims.  Excludes ""Fire Inspectors and Investigators"" (33-2021).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,''
   ,'13-1031'
   ,'Claims Adjusters, Examiners, and Investigators'
   ,'Review settled claims to determine that payments and settlements are made in accordance with company practices and procedures.  Confer with legal counsel on claims requiring litigation.  May also settle insurance claims.  Excludes ""Fire Inspectors and Investigators"" (33-2021).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('54'
   ,'2'
   ,'2'
   ,'Claims Adjuster'
   ,''
   ,''
   ,'Revisan las reclamaciones acordadas para determinar si los pagos y los acuerdos se efect£an conforme a las pr cticas y procedimientos establecidos por la compa¤¡a. Consultan a los asesores legales respecto a las reclamaciones que deben someterse a litigio. Tambi‚n pueden resolver reclamaciones de seguro. Excluye a los ?Inspectores e Investigadores de Incendios? 33-2021).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('55'
   ,'1'
   ,'1'
   ,'Graphic Designer'
   ,'Graphic Designers'
   ,''
   ,'Design or create graphics to meet specific commercial or promotional needs, such as packaging, displays, or logos.  May use a variety of mediums to achieve artistic or decorative effects.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-1024'
   ,'Graphic Designers'
   ,'Design or create graphics to meet specific commercial or promotional needs, such as packaging, displays, or logos.  May use a variety of mediums to achieve artistic or decorative effects.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('55'
   ,'2'
   ,'2'
   ,'DiseÒador/a Gr·fica'
   ,'DiseÒador/a Gr·fica'
   ,''
   ,'Dise§an o crean gr ficos para cumplir con necesidades comerciales o promocionales espec°ficas, como por ejemplo envases, embalajes, exhibidores o logotipos. Pueden crear efectos art°sticos o decorativos utilizando una variedad de medios de dise§o gr fico.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('56'
   ,'1'
   ,'1'
   ,'Data Entry Keyer'
   ,'Data Entry Keyers'
   ,''
   ,'Operate data entry device, such as keyboard or photo composing perforator.  Duties may include verifying data and preparing materials for printing.  Excludes ""Word Processors and Typists"" (43-9022).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'43-9021'
   ,'Data Entry Keyers'
   ,'Operate data entry device, such as keyboard or photo composing perforator.  Duties may include verifying data and preparing materials for printing.  Excludes ""Word Processors and Typists"" (43-9022).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('56'
   ,'2'
   ,'2'
   ,'Data Entry Keyer'
   ,''
   ,''
   ,'Operan un equipo de ingreso de datos, como por ejemplo un teclado o un perforador de fotocomposici¢n. Sus tareas pueden incluir la verificaci¢n de datos y la preparaci¢n de materiales para su impresi¢n. Excluye a los ?Procesadores de Texto y Dactil¢grafos? (43-9022).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('57'
   ,'1'
   ,'1'
   ,'Public Relations Specialist'
   ,'Public Relations Specialists'
   ,''
   ,'Engage in promoting or creating an intended public image for individuals, groups, or organizations.  May write or select material for release to various communications media. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-3031'
   ,'Public Relations Specialists'
   ,'Engage in promoting or creating an intended public image for individuals, groups, or organizations.  May write or select material for release to various communications media. '
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('57'
   ,'2'
   ,'2'
   ,'Public Relations Specialist'
   ,''
   ,''
   ,'Trabajan en la promoci¢n o creaci¢n de una imagen p£blica determinada de individuos, grupos u organizaciones. Pueden redactar o seleccionar material para difundirlo en diversos medios de comunicaci¢n.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('58'
   ,'1'
   ,'1'
   ,'Bus Mechanic'
   ,'Bus Mechanics'
   ,''
   ,'Diagnose, adjust, repair, or overhaul buses and trucks, or maintain and repair any type of diesel engines.  Includes mechanics working primarily with automobile or marine diesel engines.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-3031'
   ,'Bus and Truck Mechanics and Diesel Engine Specialists'
   ,'Diagnose, adjust, repair, or overhaul buses and trucks, or maintain and repair any type of diesel engines.  Includes mechanics working primarily with automobile or marine diesel engines.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('58'
   ,'2'
   ,'2'
   ,'Bus Mechanic'
   ,''
   ,''
   ,'Diagnostican desperfectos, ajustan, reparan o reacondicionan autobuses y camiones, o mantienen y reparan cualquier tipo de motor diesel. Incluye a los mec nicos que se dedican principalmente a trabajar con motores diesel de autom¢viles o embarcaciones.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('59'
   ,'1'
   ,'1'
   ,'Truck Mechanic'
   ,'Truck Mechanics'
   ,''
   ,'Diagnose, adjust, repair, or overhaul buses and trucks, or maintain and repair any type of diesel engines.  Includes mechanics working primarily with automobile or marine diesel engines.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-3031'
   ,'Bus and Truck Mechanics and Diesel Engine Specialists'
   ,'Diagnose, adjust, repair, or overhaul buses and trucks, or maintain and repair any type of diesel engines.  Includes mechanics working primarily with automobile or marine diesel engines.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('59'
   ,'2'
   ,'2'
   ,'Truck Mechanic'
   ,''
   ,''
   ,'Diagnostican desperfectos, ajustan, reparan o reacondicionan autobuses y camiones, o mantienen y reparan cualquier tipo de motor diesel. Incluye a los mec nicos que se dedican principalmente a trabajar con motores diesel de autom¢viles o embarcaciones.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('60'
   ,'1'
   ,'1'
   ,'Diesel Engine Mechanic'
   ,'Diesel Engine Mechanics'
   ,''
   ,'Diagnose, adjust, repair, or overhaul buses and trucks, or maintain and repair any type of diesel engines.  Includes mechanics working primarily with automobile or marine diesel engines.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-3031'
   ,'Bus and Truck Mechanics and Diesel Engine Specialists'
   ,'Diagnose, adjust, repair, or overhaul buses and trucks, or maintain and repair any type of diesel engines.  Includes mechanics working primarily with automobile or marine diesel engines.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('60'
   ,'2'
   ,'2'
   ,'Diesel Engine Mechanic'
   ,''
   ,''
   ,'Diagnostican desperfectos, ajustan, reparan o reacondicionan autobuses y camiones, o mantienen y reparan cualquier tipo de motor diesel. Incluye a los mec nicos que se dedican principalmente a trabajar con motores diesel de autom¢viles o embarcaciones.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('61'
   ,'1'
   ,'1'
   ,'Personal Trainer'
   ,'Personal Trainers'
   ,''
   ,'You like making ''em sweat, that''s for sure. Get clients on track to healthy exercise regimens with tips, sessions, and either personal or group training. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'39-9031'
   ,'Fitness Trainers and Aerobics Instructors'
   ,'Instruct or coach groups or individuals in exercise activities.  Demonstrate techniques and form, observe participants, and explain to them corrective measures necessary to improve their skills.  Excludes teachers classified in 25-0000 Education, Training, and Library Occupations.  Excludes ?Coaches and Scouts? (27-2022) and ""Athletic Trainers"" (29-9091).'
   ,'True'
   ,'1'
   ,'Start sweating (it''s a good thing!) with help from an experienced professional in the world of exercise. In either an individual or group session, get on track to a healthy physical regimen.'
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('61'
   ,'2'
   ,'2'
   ,'Entrenador/a Personal'
   ,'Entrenadores/as Personales'
   ,''
   ,'Dan instrucci¢n o entrenan a grupos o individuos en sus actividades f¡sicas. Demuestran t‚cnicas y m‚todos, observan a los participantes y les explican las medidas correctivas necesarias para mejorar sus habilidades. Excluye a los maestros clasificados en las Ocupaciones Relacionadas con la Educaci¢n, Capacitaci¢n y Bibliotecolog¡a (25-0000). Excluye a los ?Entrenadores y Buscadores de Talentos Deportivos? (27-2022) y a los ?Instructores Atl‚ticos? (29-9091).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('62'
   ,'1'
   ,'1'
   ,'Aerobics Instructor'
   ,'Aerobics Instructors'
   ,''
   ,'You like making ''em sweat, that''s for sure. Get clients on track to healthy exercise regimens with tips, sessions, and either personal or group training. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'39-9031'
   ,'Fitness Trainers and Aerobics Instructors'
   ,'Instruct or coach groups or individuals in exercise activities.  Demonstrate techniques and form, observe participants, and explain to them corrective measures necessary to improve their skills.  Excludes teachers classified in 25-0000 Education, Training, and Library Occupations.  Excludes ?Coaches and Scouts? (27-2022) and ""Athletic Trainers"" (29-9091).'
   ,'True'
   ,'2'
   ,'Start sweating (it''s a good thing!) with help from an experienced professional in the world of exercise. In either an individual or group session, get on track to a healthy physical regimen.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('62'
   ,'2'
   ,'2'
   ,'Monitor/a de Aerobic'
   ,'Monitores/as de AerÛbic'
   ,''
   ,'Dan instrucci¢n o entrenan a grupos o individuos en sus actividades f¡sicas. Demuestran t‚cnicas y m‚todos, observan a los participantes y les explican las medidas correctivas necesarias para mejorar sus habilidades. Excluye a los maestros clasificados en las Ocupaciones Relacionadas con la Educaci¢n, Capacitaci¢n y Bibliotecolog¡a (25-0000). Excluye a los ?Entrenadores y Buscadores de Talentos Deportivos? (27-2022) y a los ?Instructores Atl‚ticos? (29-9091).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('63'
   ,'1'
   ,'1'
   ,'Laundry Worker'
   ,'Laundry Workers'
   ,''
   ,'Operate or tend washing or dry-cleaning machines to wash or dry-clean industrial or household articles, such as cloth garments, suede, leather, furs, blankets, draperies, linens, rugs, and carpets.  Includes spotters and dyers of these articles.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'51-6011'
   ,'Laundry and Dry-Cleaning Workers'
   ,'Operate or tend washing or dry-cleaning machines to wash or dry-clean industrial or household articles, such as cloth garments, suede, leather, furs, blankets, draperies, linens, rugs, and carpets.  Includes spotters and dyers of these articles.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('63'
   ,'2'
   ,'2'
   ,'Laundry Worker'
   ,''
   ,''
   ,'Operan o se encargan de m quinas de lavar o de limpieza en seco utilizadas para lavar o limpiar en seco art¡culos de uso industrial o dom‚stico, tales como prendas de vestir, gamuza, cuero, pieles, mantas, cortinas, ropa de cama y alfombras. Incluye a los trabajadores de desmanchado y te¤ido de dichos art¡culos.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('64'
   ,'1'
   ,'1'
   ,'Dry-Cleaner'
   ,'Dry-Cleaners'
   ,''
   ,'Operate or tend washing or dry-cleaning machines to wash or dry-clean industrial or household articles, such as cloth garments, suede, leather, furs, blankets, draperies, linens, rugs, and carpets.  Includes spotters and dyers of these articles.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'51-6011'
   ,'Laundry and Dry-Cleaning Workers'
   ,'Operate or tend washing or dry-cleaning machines to wash or dry-clean industrial or household articles, such as cloth garments, suede, leather, furs, blankets, draperies, linens, rugs, and carpets.  Includes spotters and dyers of these articles.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('64'
   ,'2'
   ,'2'
   ,'Dry-Cleaner'
   ,''
   ,''
   ,'Operan o se encargan de m quinas de lavar o de limpieza en seco utilizadas para lavar o limpiar en seco art¡culos de uso industrial o dom‚stico, tales como prendas de vestir, gamuza, cuero, pieles, mantas, cortinas, ropa de cama y alfombras. Incluye a los trabajadores de desmanchado y te¤ido de dichos art¡culos.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('65'
   ,'1'
   ,'1'
   ,'Taxi Driver'
   ,'Taxi Drivers'
   ,''
   ,'Drive automobiles, vans, or limousines to transport passengers.  May occasionally carry cargo.  Includes hearse drivers.  Excludes ?Ambulance Drivers and Attendants, Except Emergency Medical Technicians"" (53-3011) and ""Bus Drivers"" (53-3020).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'53-3041'
   ,'Taxi Drivers and Chauffeurs'
   ,'Drive automobiles, vans, or limousines to transport passengers.  May occasionally carry cargo.  Includes hearse drivers.  Excludes ?Ambulance Drivers and Attendants, Except Emergency Medical Technicians"" (53-3011) and ""Bus Drivers"" (53-3020).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('65'
   ,'2'
   ,'2'
   ,'ChÛfer'
   ,'ChÛferes'
   ,''
   ,'Conducen autom¢viles, camionetas o limosinas para transportar pasajeros. Ocasionalmente, pueden transportar carga. Incluye a los choferes de coches f£nebres. Excluye a los ?Conductores y Asistentes de Ambulancia, Excepto T‚cnicos de Emergencia M‚dica? (53-3011) y a los ?Conductores de Autob£s? (53-3020).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('66'
   ,'1'
   ,'1'
   ,'Limousine Driver'
   ,'Limousine Drivers'
   ,''
   ,'Drive automobiles, vans, or limousines to transport passengers.  May occasionally carry cargo.  Includes hearse drivers.  Excludes ?Ambulance Drivers and Attendants, Except Emergency Medical Technicians"" (53-3011) and ""Bus Drivers"" (53-3020).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'53-3041'
   ,'Taxi Drivers and Chauffeurs'
   ,'Drive automobiles, vans, or limousines to transport passengers.  May occasionally carry cargo.  Includes hearse drivers.  Excludes ?Ambulance Drivers and Attendants, Except Emergency Medical Technicians"" (53-3011) and ""Bus Drivers"" (53-3020).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('66'
   ,'2'
   ,'2'
   ,'Limousine Driver'
   ,''
   ,''
   ,'Conducen autom¢viles, camionetas o limosinas para transportar pasajeros. Ocasionalmente, pueden transportar carga. Incluye a los choferes de coches f£nebres. Excluye a los ?Conductores y Asistentes de Ambulancia, Excepto T‚cnicos de Emergencia M‚dica? (53-3011) y a los ?Conductores de Autob£s? (53-3020).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('67'
   ,'1'
   ,'1'
   ,'Coach'
   ,'Coaches'
   ,''
   ,'Instruct or coach groups or individuals in the fundamentals of sports.  Demonstrate techniques and methods of participation.  May evaluate athletes'' strengths and weaknesses as possible recruits or to improve the athletes'' technique to prepare them for competition.  Those required to hold teaching degrees should be reported in the appropriate teaching category.  Excludes ""Athletic Trainers"" (29-9091).  '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-2022'
   ,'Coaches and Scouts'
   ,'Instruct or coach groups or individuals in the fundamentals of sports.  Demonstrate techniques and methods of participation.  May evaluate athletes'' strengths and weaknesses as possible recruits or to improve the athletes'' technique to prepare them for competition.  Those required to hold teaching degrees should be reported in the appropriate teaching category.  Excludes ""Athletic Trainers"" (29-9091).  '
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('67'
   ,'2'
   ,'2'
   ,'Coach'
   ,''
   ,''
   ,'Ense¤an o entrenan a grupos o individuos sobre los principios b sicos de los deportes. Demuestran las t‚cnicas y m‚todos de participaci¢n. Pueden evaluar las fortalezas y debilidades de los atletas para considerar la posibilitad de reclutarlos o para mejorar la t‚cnica de los atletas con el fin de prepararlos para participar en competencias. Aquellos entrenadores y buscadores de talentos deportivos que deban poseer diploma de ense¤anza deben reportarse en la categor¡a de ense¤anza correspondiente. Excluye a los ?Instructores Atl‚ticos? (29-9091).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('68'
   ,'1'
   ,'1'
   ,'Personal Financial Advisor'
   ,'Personal Financial Advisors'
   ,''
   ,'Lend clients advice on the often-overwhelming world that is personal finance. Duties include assessing clients'' assets, liabilities, cash flow, insurance coverage, tax status, and financial objectives.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'13-2052'
   ,'Personal Financial Advisors'
   ,'Advise clients on financial plans using knowledge of tax and investment strategies, securities, insurance, pension plans, and real estate.  Duties include assessing clients'' assets, liabilities, cash flow, insurance coverage, tax status, and financial objectives.'
   ,'True'
   ,'3'
   ,'Find a captain on your journey through the stormy seas of personal finance. With good cheer and possibly a few "Ahoys," your advisor will help you navigate your assets, financial plans, and investments.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('68'
   ,'2'
   ,'2'
   ,'Asesor/a Financiero/a'
   ,'Asesores/as Financieros/as'
   ,''
   ,'Asesoran a sus clientes sobre planes financieros utilizando conocimientos sobre impuestos, estrategias de inversi¢n, valores, seguro, planes de pensi¢n y propiedad inmobiliaria. Sus tareas incluyen asesorar a sus clientes con respecto al valor de sus activos, el monto de sus obligaciones, el nivel de liquidez, la cobertura de seguro, el estatus impositivo y sus objetivos financieros.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('69'
   ,'1'
   ,'1'
   ,'Telecom Equipment Installer'
   ,'Telecom Equipment Installers'
   ,''
   ,'Install, set-up, rearrange, or remove switching, distribution, routing, and dialing equipment used in central offices or headends.  Service or repair telephone, cable television, Internet, and other communications equipment on customers'' property.  May install communications equipment or communications wiring in buildings.  Excludes ?Telecommunications Line Installers and Repairers? (49-9052).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-2022'
   ,'Telecommunications Equipment Installers and Repairers, Except Line Installers'
   ,'Install, set-up, rearrange, or remove switching, distribution, routing, and dialing equipment used in central offices or headends.  Service or repair telephone, cable television, Internet, and other communications equipment on customers'' property.  May install communications equipment or communications wiring in buildings.  Excludes ?Telecommunications Line Installers and Repairers? (49-9052).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('69'
   ,'2'
   ,'2'
   ,'TÈcnico de Telecomunicaciones'
   ,'TÈcnicos de Telecomunicaciones'
   ,''
   ,'Instalan, configuran o reorganizan, o retiran equipo de conmutaci¢n, distribuci¢n, enrutamiento y discado utilizado en oficinas centrales o terminales de cabecera. Dan servicio o reparan equipo de tel‚fono, televisi¢n por cable, Internet y dem s equipo de comunicaciones en el domicilio de los clientes. Pueden instalar equipo o cableado de comunicaciones en edificios. Excluye a los ?Instaladores y Reparadores de Tendido de L¡neas de Telecomunicaciones? (49-9052).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('70'
   ,'1'
   ,'1'
   ,'Telecom Equipment Repairer'
   ,'Telecom Equipment Repairers'
   ,''
   ,'Install, set-up, rearrange, or remove switching, distribution, routing, and dialing equipment used in central offices or headends.  Service or repair telephone, cable television, Internet, and other communications equipment on customers'' property.  May install communications equipment or communications wiring in buildings.  Excludes ?Telecommunications Line Installers and Repairers? (49-9052).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2012 12:00:00 AM'
   ,'fg'
   ,'49-2022'
   ,'Telecommunications Equipment Installers and Repairers, Except Line Installers'
   ,'Install, set-up, rearrange, or remove switching, distribution, routing, and dialing equipment used in central offices or headends.  Service or repair telephone, cable television, Internet, and other communications equipment on customers'' property.  May install communications equipment or communications wiring in buildings.  Excludes ?Telecommunications Line Installers and Repairers? (49-9052).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('70'
   ,'2'
   ,'2'
   ,'Telecom Equipment Repairer'
   ,''
   ,''
   ,'Instalan, configuran o reorganizan, o retiran equipo de conmutaci¢n, distribuci¢n, enrutamiento y discado utilizado en oficinas centrales o terminales de cabecera. Dan servicio o reparan equipo de tel‚fono, televisi¢n por cable, Internet y dem s equipo de comunicaciones en el domicilio de los clientes. Pueden instalar equipo o cableado de comunicaciones en edificios. Excluye a los ?Instaladores y Reparadores de Tendido de L¡neas de Telecomunicaciones? (49-9052).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('71'
   ,'1'
   ,'1'
   ,'Cement Mason'
   ,'Cement Masons'
   ,''
   ,'Smooth and finish surfaces of poured concrete, such as floors, walks, sidewalks, roads, or curbs using a variety of hand and power tools.  Align forms for sidewalks, curbs, or gutters; patch voids; and use saws to cut expansion joints.  Installers of mortarless segmental concrete masonry wall units are classified in ""Landscaping and Groundskeeping Workers? (37- 3011).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2051'
   ,'Cement Masons and Concrete Finishers'
   ,'Smooth and finish surfaces of poured concrete, such as floors, walks, sidewalks, roads, or curbs using a variety of hand and power tools.  Align forms for sidewalks, curbs, or gutters; patch voids; and use saws to cut expansion joints.  Installers of mortarless segmental concrete masonry wall units are classified in ""Landscaping and Groundskeeping Workers? (37- 3011).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('71'
   ,'2'
   ,'2'
   ,'Cement Mason'
   ,''
   ,''
   ,'Pulen y dan acabado a superficies de concreto  spero, como por ejemplo, pisos, senderos, aceras, caminos o bordillos utilizando una variedad de herramientas manuales y de motor. Trazan aceras, bordillos o cunetas; arreglan y tapan huecos y usan sierras para cortar juntas para permitir la expansi¢n del material. Los alba§iles que instalan paredes construidas con segmentos de concreto sin unirlos con mezcla o cemento est n clasificados en la ocupaci¢n ?Trabajadores de Jardiner°a y ?reas Verdes? (37-3011).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('72'
   ,'1'
   ,'1'
   ,'Caterer'
   ,'Caterers'
   ,''
   ,'Not only do you do the work of an angel by expanding the frontier of delicious food into delightful new territory, you actually bring the good stuff to people''s tables, parties, and corporate events. If we could pick one type of professional to have by our side in a lost-in-the-wilderness scenerio, it would likely be you -- we get the feeling you''d be making bilberry canapes, lichen-infused rum balls, and tree bark pilaf for sustenance while we fiddled with the map. Find slightly less desperate clients planning top-notch parties, casual get-togethers, and huge corporate events for which they need your capable hands.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'35-3041'
   ,'Servidores de Comida, Excepto Restaurante'
   ,'Sirven comida a los comensales en lugares que no son restaurantes, como por ejemplo en habitaciones de hotel, hospitales, centros residenciales de atenci¢n o en autos. Excluye a los ?Trabajadores de Venta a Domicilio, Vendedores de Peri¢dicos y Ambulantes y Trabajadores Relacionados? (41-9091) y a los ?Dependientes de Mostrador, Cafeter¡a, Concesi¢n de Servicio de Comidas y Establecimiento de Servicio de Caf‚? (35-3022).'
   ,'True'
   ,'2'
   ,'If we could pick one type of professional to have by our side in a lost-in-the-wilderness scenerio, it would likely be a caterer -- we get the feeling they''d be making bilberry canapes, lichen-infused rum balls, and tree bark pilaf for sustenance while we fiddled with the map. Your scenario -- a private party, huge corporate event, or casual get-together -- is likely a little less desperate but still in need of food produced by capable hands. Find the perfect caterer/savior here!'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('72'
   ,'2'
   ,'2'
   ,'Caterer'
   ,''
   ,''
   ,'Sirven comida a los comensales en lugares que no son restaurantes, como por ejemplo en habitaciones de hotel, hospitales, centros residenciales de atenci¢n o en autos. Excluye a los ?Trabajadores de Venta a Domicilio, Vendedores de Peri¢dicos y Ambulantes y Trabajadores Relacionados? (41-9091) y a los ?Dependientes de Mostrador, Cafeter¡a, Concesi¢n de Servicio de Comidas y Establecimiento de Servicio de Caf‚? (35-3022).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('73'
   ,'1'
   ,'1'
   ,'Musician'
   ,'Musicians'
   ,''
   ,'Aha! A balladeer! Troubadour! Jongleur! Or maybe you prefer the good, solid, all-encompassing "musician." Playing anything from the lyre to the guitar to the triangle to your own vocal chords, you spread musical inspiration and cheer by working back-up, parties, events, or a multitude of other gigs. Harmoniously connect with clients in need of your skills.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-2042'
   ,'Musicians and Singers'
   ,'Play one or more musical instruments or sing.  May perform on stage, for on-air broadcasting, or for sound or video recording. '
   ,'True'
   ,'1'
   ,'Find your ideal bard/troubadour/one-man-band/balladeer/barbershop quartet here! Whether you need an expert triangle player to give your recording an extra "oomph" ("ding"?) or a trained singer for your upcoming event, the perfect musician can be harmoniously arranged.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('73'
   ,'2'
   ,'2'
   ,'M?sico/a'
   ,'M?sicos/as'
   ,''
   ,'Ejecutan uno o m s instrumentos musicales o cantan. Pueden hacer representaciones en un escenario, en emisiones en vivo, o en grabaciones de sonido y video.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('74'
   ,'1'
   ,'1'
   ,'Singer'
   ,'Singers'
   ,''
   ,'Share your expert warblings with prospective clients needing musical assistance at parties, in recordings, on broadcasted shows, and beyond!'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-2042'
   ,'Musicians and Singers'
   ,'Play one or more musical instruments or sing.  May perform on stage, for on-air broadcasting, or for sound or video recording. '
   ,'True'
   ,'1'
   ,'Find the ideal warbler for your party, formal event, broadcast, recording session, or anything else that might be harmoniously improved by a bit of tunage.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('74'
   ,'2'
   ,'2'
   ,'Cantante'
   ,'Cantantes'
   ,''
   ,'Ejecutan uno o m s instrumentos musicales o cantan. Pueden hacer representaciones en un escenario, en emisiones en vivo, o en grabaciones de sonido y video.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('75'
   ,'1'
   ,'1'
   ,'Physical Therapist'
   ,'Physical Therapists'
   ,''
   ,'A knowledgeable consultant in all things bodily pain, injury, and trouble, you get people up and running, back on track (sometimes literally). Find clients looking to gain mobility, exercise, muscle, and pain relief from your guidance.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'29-1123'
   ,'Physical Therapists'
   ,'Assess, plan, organize, and participate in rehabilitative programs that improve mobility, relieve pain, increase strength, and improve or correct disabling conditions resulting from disease or injury.'
   ,'True'
   ,'3'
   ,'Get up and running again, back on track, or just feeling good and healthy. The right physical therapist will provide one-on-one advice and instruction, assessing your bodily woes and planning with you the best way to overcome them. '
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('75'
   ,'2'
   ,'2'
   ,'Fisioterapeuta'
   ,'Fisioterapeutas'
   ,''
   ,'Eval£an planifican, organizan y participan de programas de rehabilitaci¢n que tienen por fin mejorar la movilidad, aliviar el dolor, aumentar la fortaleza f°sica y mejorar o corregir condiciones que causan una incapacidad f°sica producida por enfermedades o lesiones.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('76'
   ,'1'
   ,'1'
   ,'Dog Walker'
   ,'Dog Walkers'
   ,''
   ,'You make sure our best friends are trim, happy, and socialized. Find furry clients to exercise and take around town. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'39-2021'
   ,'Nonfarm Animal Caretakers'
   ,'Feed, water, groom, bathe, exercise, or otherwise care for pets and other nonfarm animals, such as dogs, cats, ornamental fish or birds, zoo animals, and mice.  Work in settings such as kennels, animal shelters, zoos, circuses, and aquariums.  May keep records of feedings, treatments, and animals received or discharged.  May clean, disinfect, and repair cages, pens, or fish tanks.  Excludes ""Veterinary Assistants and Laboratory Animal Caretakers"" (31-9096).'
   ,'True'
   ,'1'
   ,'Nothing like a cold, damp nose to greet you happily at the end of the day. Right? Find an experienced professional to take care of your beloved''s exercise regimen either one-on-one or in a horde of rambunctious friends.'
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('76'
   ,'2'
   ,'2'
   ,'Dog Walker'
   ,''
   ,''
   ,'Alimentan, dan agua, acicalan, ba¤an, ejercitan o brindan alg£n otro tipo de cuidado a animales dom‚sticos y dem s animales que no son de granja, como por ejemplo, perros, gatos, peces o p jaros ornamentales, animales de zool¢gico o ratones. Trabajan en lugares tales como guarder¡as para perros, refugios de animales, zool¢gicos, circos y acuarios. Pueden ocuparse de los registros de alimentaci¢n, tratamientos y datos de animales recibidos o dados de baja. Pueden limpiar, desinfectar y reparar jaulas, corrales o peceras. Excluye a los ?Asistentes de Veterinarios y Cuidadores de Animales de Laboratorio? (31-9096).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('77'
   ,'1'
   ,'1'
   ,'Pet Groomer'
   ,'Pet Groomers'
   ,''
   ,'No one quite knows how you do what you do (is there a vacuum involved?), but your expertise leaves old Rover looking like a pup again -- dirt-free, dry, and with a great new haircut and manicure. Find furry clients in need of a makeover or just general upkeep. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'39-2021'
   ,'Nonfarm Animal Caretakers'
   ,'Feed, water, groom, bathe, exercise, or otherwise care for pets and other nonfarm animals, such as dogs, cats, ornamental fish or birds, zoo animals, and mice.  Work in settings such as kennels, animal shelters, zoos, circuses, and aquariums.  May keep records of feedings, treatments, and animals received or discharged.  May clean, disinfect, and repair cages, pens, or fish tanks.  Excludes ""Veterinary Assistants and Laboratory Animal Caretakers"" (31-9096).'
   ,'True'
   ,'1'
   ,'Maybe Rover needs a treat, and not of the bacon-flavored variety. Find the perfect professional to wash, trim, manicure, and style the precious pup.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('77'
   ,'2'
   ,'2'
   ,'Cuidador/a de Mascotas'
   ,'Cuidadores/as de Mascotas'
   ,''
   ,'Alimentan, dan agua, acicalan, ba¤an, ejercitan o brindan alg£n otro tipo de cuidado a animales dom‚sticos y dem s animales que no son de granja, como por ejemplo, perros, gatos, peces o p jaros ornamentales, animales de zool¢gico o ratones. Trabajan en lugares tales como guarder¡as para perros, refugios de animales, zool¢gicos, circos y acuarios. Pueden ocuparse de los registros de alimentaci¢n, tratamientos y datos de animales recibidos o dados de baja. Pueden limpiar, desinfectar y reparar jaulas, corrales o peceras. Excluye a los ?Asistentes de Veterinarios y Cuidadores de Animales de Laboratorio? (31-9096).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('78'
   ,'1'
   ,'1'
   ,'Pet Sitter'
   ,'Pet Sitters'
   ,''
   ,'Ah, the life of a pet. Food, occasional exercise, and lots of sleeping. Almost sounds like childhood again! Find some furry (feathered/scaled) clients to take care of and live the life with.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'39-2021'
   ,'Nonfarm Animal Caretakers'
   ,'Feed, water, groom, bathe, exercise, or otherwise care for pets and other nonfarm animals, such as dogs, cats, ornamental fish or birds, zoo animals, and mice.  Work in settings such as kennels, animal shelters, zoos, circuses, and aquariums.  May keep records of feedings, treatments, and animals received or discharged.  May clean, disinfect, and repair cages, pens, or fish tanks.  Excludes ""Veterinary Assistants and Laboratory Animal Caretakers"" (31-9096).'
   ,'True'
   ,'1'
   ,'For whatever reason, you need to get away, and little Fluff-Fluff/Sauron the Destroyer needs an experienced, temporary friend to keep him company. Find the perfect playmate for the job.'
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('78'
   ,'2'
   ,'2'
   ,'Pet Sitter'
   ,''
   ,''
   ,'Alimentan, dan agua, acicalan, ba¤an, ejercitan o brindan alg£n otro tipo de cuidado a animales dom‚sticos y dem s animales que no son de granja, como por ejemplo, perros, gatos, peces o p jaros ornamentales, animales de zool¢gico o ratones. Trabajan en lugares tales como guarder¡as para perros, refugios de animales, zool¢gicos, circos y acuarios. Pueden ocuparse de los registros de alimentaci¢n, tratamientos y datos de animales recibidos o dados de baja. Pueden limpiar, desinfectar y reparar jaulas, corrales o peceras. Excluye a los ?Asistentes de Veterinarios y Cuidadores de Animales de Laboratorio? (31-9096).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('79'
   ,'1'
   ,'1'
   ,'Telecom Line Installer'
   ,'Telecom Line Installers'
   ,''
   ,'Install and repair telecommunications cable, including fiber optics.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-9052'
   ,'Telecommunications Line Installers and Repairers'
   ,'Install and repair telecommunications cable, including fiber optics.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('79'
   ,'2'
   ,'2'
   ,'Telecom Line Installer'
   ,''
   ,''
   ,'Instalan y reparan cables de telecomunicaciones, incluidos cables de fibra ¢ptica.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('80'
   ,'1'
   ,'1'
   ,'Telecom Line Repairer'
   ,'Telecom Line Repairers'
   ,''
   ,'Install and repair telecommunications cable, including fiber optics.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-9052'
   ,'Telecommunications Line Installers and Repairers'
   ,'Install and repair telecommunications cable, including fiber optics.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('80'
   ,'2'
   ,'2'
   ,'Telecom Line Repairer'
   ,''
   ,''
   ,'Instalan y reparan cables de telecomunicaciones, incluidos cables de fibra ¢ptica.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('81'
   ,'1'
   ,'1'
   ,'Gutter Repairerer'
   ,'Gutter Repairerers'
   ,''
   ,'All, installation, maintenance, and repair workers not listed separately.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-9099'
   ,'Installation, Maintenance, and Repair Workers, All Other'
   ,'All, installation, maintenance, and repair workers not listed separately.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('81'
   ,'2'
   ,'2'
   ,'Gutter Repairerer'
   ,''
   ,''
   ,'Todos los trabajadores de ocupaciones relacionadas con la instalaci¢n, mantenimiento y reparaci¢n que no est n listados por separado.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('82'
   ,'1'
   ,'1'
   ,'Handyman'
   ,'Handymen'
   ,''
   ,'Nothing like a dandy handyman or first-class handylass (our apologies for the rhymes) to get everything in tip-top shape once more. Connect with clients who need your fix-it skills.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-9099'
   ,'Installation, Maintenance, and Repair Workers, All Other'
   ,'All, installation, maintenance, and repair workers not listed separately.'
   ,'True'
   ,'1'
   ,'For those of us who cannot claim fix-it knowledge, there is a solution: handypeople! Locate the perfect Jack/Jill for that leak, looseness, or remodel.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('82'
   ,'2'
   ,'2'
   ,'Manitas'
   ,'Manitas'
   ,''
   ,'Todos los trabajadores de ocupaciones relacionadas con la instalaci¢n, mantenimiento y reparaci¢n que no est n listados por separado.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('83'
   ,'1'
   ,'1'
   ,'Luggage Repairerer'
   ,'Luggage Repairerers'
   ,''
   ,'We have once waited three hours in the Philadelphia airport''s baggage claim for our bags to be pulled out  from the depths underneath a broken baggage machine. Upon its arrival safe into our tired hands, the bag promptly busted at the seams, spilling its overstuffed contents (some of them polka-dotted and unmentionable) everywhere. Boy, could we have used your help. Find clients looking to prevent such embarassments and more with your expert repair work.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-9099'
   ,'Installation, Maintenance, and Repair Workers, All Other'
   ,'All, installation, maintenance, and repair workers not listed separately.'
   ,'True'
   ,'2'
   ,'We have once waited three hours in the Philadelphia airport''s baggage claim for our bags to be pulled out from the depths underneath a broken baggage machine. Upon its arrival safe into our tired hands, the bag promptly busted at the seams, spilling its overstuffed contents (some of them polka-dotted and unmentionable) everywhere. Boy, could we have used a luggage repairer''s help. Prevent such embarassments or pretend that never happened with the expert assistance of a true luggage repair person.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('83'
   ,'2'
   ,'2'
   ,'Luggage Repairerer'
   ,''
   ,''
   ,'Todos los trabajadores de ocupaciones relacionadas con la instalaci¢n, mantenimiento y reparaci¢n que no est n listados por separado.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('84'
   ,'1'
   ,'1'
   ,'Pool Repairerer'
   ,'Pool Repairerers'
   ,''
   ,'All, installation, maintenance, and repair workers not listed separately.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-9099'
   ,'Installation, Maintenance, and Repair Workers, All Other'
   ,'All, installation, maintenance, and repair workers not listed separately.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('84'
   ,'2'
   ,'2'
   ,'Pool Repairerer'
   ,''
   ,''
   ,'Todos los trabajadores de ocupaciones relacionadas con la instalaci¢n, mantenimiento y reparaci¢n que no est n listados por separado.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('85'
   ,'1'
   ,'1'
   ,'Energy Efficiency Specialist'
   ,'Energy Efficiency Specialists'
   ,''
   ,'Give the gift of information about energy strategies and costs to interested businesses and residents looking to green things up, save a little money, and/or rethink their energy approach. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-9099'
   ,'Installation, Maintenance, and Repair Workers, All Other'
   ,'All, installation, maintenance, and repair workers not listed separately.'
   ,'True'
   ,'1'
   ,'Consult with an energetic energy expert on strategy and implementation for your home or business. Whether you''re looking to green things up, talk shop, or learn the ins-and-outs of associated regulations, there''s the perfect professional to enlighten you with the scoop.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('85'
   ,'2'
   ,'2'
   ,'Energy Efficiency Specialist'
   ,''
   ,''
   ,'Todos los trabajadores de ocupaciones relacionadas con la instalaci¢n, mantenimiento y reparaci¢n que no est n listados por separado.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('86'
   ,'1'
   ,'1'
   ,'Meat & Fish Cutter'
   ,'Meat & Fish Cutters'
   ,''
   ,'Use hand or hand tools to perform routine cutting and trimming of meat, poultry, and seafood.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'51-3022'
   ,'Meat, Poultry, and Fish Cutters and Trimmers'
   ,'Use hand or hand tools to perform routine cutting and trimming of meat, poultry, and seafood.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('86'
   ,'2'
   ,'2'
   ,'Meat & Fish Cutter'
   ,''
   ,''
   ,'Realizan tareas rutinarias de corte y fileteado de carnes, aves, mariscos y pescados manualmente o con herramientas manuales.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('87'
   ,'1'
   ,'1'
   ,'Auto Body Repairer'
   ,'Auto Body Repairers'
   ,''
   ,'Repair and refinish automotive vehicle bodies and straighten vehicle frames.  Excludes ?Painters, Transportation Equipment"" (51-9122) and ""Automotive Glass Installers and Repairers"" (49-3022).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-3021'
   ,'Automotive Body and Related Repairers'
   ,'Repair and refinish automotive vehicle bodies and straighten vehicle frames.  Excludes ?Painters, Transportation Equipment"" (51-9122) and ""Automotive Glass Installers and Repairers"" (49-3022).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('87'
   ,'2'
   ,'2'
   ,'Auto Body Repairer'
   ,''
   ,''
   ,'Reparan y dan acabado a la carrocer°a de veh°culos de motor y enderezan chasis de veh°culos. Excluye a los ?Pintores de Equipo de Transporte? (51-9122) y a los ?Instaladores y Reparadores de Cristales Automotrices? (49-3022).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('88'
   ,'1'
   ,'1'
   ,'Computer Repairer'
   ,'Computer Repairers'
   ,''
   ,'We''re wired, but that doesn''t mean we know what we''re doing (and does anyone actually say they''re "wired" anymore unless they''ve just had a huge cup of coffee?). Help us and our grandmas out with installations, repair work, all those infuriating router issues, weird noises, cracked screens, coffee we''ve just wiredly spilled on our keyboards, and way, way more.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-2011'
   ,'Computer, Automated Teller, and Office Machine Repairers'
   ,'Repair, maintain, or install computers, word processing systems, automated teller machines, and electronic office machines, such as duplicating and fax machines.'
   ,'True'
   ,'2'
   ,'We''re wired, but that doesn''t mean we know what we''re doing (and does anyone actually say they''re "wired" anymore unless they''ve just had a huge cup of coffee?). Computer repairers help us out with installations, repair work, all those infuriating router issues, weird noises, cracked screens, coffee we''ve just wiredly spilled on our keyboards, and way, way more. Find the perfect tech-know-it-all for the task.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('88'
   ,'2'
   ,'2'
   ,'TÈcnico Inform·tico'
   ,'TÈcnico Inform·tico'
   ,''
   ,'Reparan, mantienen o instalan computadoras, sistemas de procesamiento de texto, cajeros autom ticos y m quinas electr¢nicas de oficina, como por ejemplo m quinas de duplicaci¢n y de fax.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('89'
   ,'1'
   ,'1'
   ,'Office Machine Repairer'
   ,'Office Machine Repairers'
   ,''
   ,'Repair, maintain, or install computers, word processing systems, automated teller machines, and electronic office machines, such as duplicating and fax machines.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-2011'
   ,'Computer, Automated Teller, and Office Machine Repairers'
   ,'Repair, maintain, or install computers, word processing systems, automated teller machines, and electronic office machines, such as duplicating and fax machines.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('89'
   ,'2'
   ,'2'
   ,'Office Machine Repairer'
   ,''
   ,''
   ,'Reparan, mantienen o instalan computadoras, sistemas de procesamiento de texto, cajeros autom ticos y m quinas electr¢nicas de oficina, como por ejemplo m quinas de duplicaci¢n y de fax.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('90'
   ,'1'
   ,'1'
   ,'Photographer'
   ,'Photographers'
   ,''
   ,'An expert in lighting, framing, snapping, editing? Clients are waiting to connect, whether they need shots of their admittedly rather strange clothing line or of their delightful wedding.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-4021'
   ,'Photographers'
   ,'Photograph people, landscapes, merchandise, or other  subjects, using digital or film cameras and equipment.  May develop negatives or use computer software to produce finished images and prints.  Includes scientific photographers, aerial photographers, and photojournalists.'
   ,'True'
   ,'1'
   ,'Document whatever it is you need documented -- your clothing line, your wedding, your baby, your evidence of someone else''s wrongdoing -- with help from a savvy professional.'
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('90'
   ,'2'
   ,'2'
   ,'FotÛgrafo/a'
   ,'FotÛgrafos/as'
   ,''
   ,'Fotograf¡an personas, paisajes, mercader¡a u otras tem ticas utilizando c maras y equipo digital o con pel¡cula fotogr fica. Pueden revelar negativos o utilizar programas de computaci¢n para reproducir im genes e impresiones terminadas. Incluye a los fot¢grafos cient¡ficos, fot¢grafos a‚reos y fotoperiodistas.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('91'
   ,'1'
   ,'1'
   ,'Psychiatrist'
   ,'Psychiatrists'
   ,''
   ,'Physicians who diagnose, treat, and help prevent disorders of the mind.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'29-1066'
   ,'Psychiatrists'
   ,'Physicians who diagnose, treat, and help prevent disorders of the mind.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('91'
   ,'2'
   ,'2'
   ,'Psiquiatra'
   ,'Psiquiatras'
   ,''
   ,'M‚dicos que diagnostican, tratan o ayudan a prevenir trastornos mentales.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('92'
   ,'1'
   ,'1'
   ,'Baker'
   ,'Bakers'
   ,''
   ,'We wanted your job until we realized two things -- baking doesn''t necessarily mean getting to eat all the baked goods one produces, and one has to wake up well before the crack of dawn to get started on all those breads and rolls. Find clients like us -- appreciative but incapable of your dedication and early morning vitality -- to produce those wondrous, warm creations of yours.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'51-3011'
   ,'Bakers'
   ,'Mix and bake ingredients to produce breads, rolls, cookies, cakes, pies, pastries, or other baked goods.  Pastry chefs in restaurants and hotels are included with ""Chefs and Head Cooks"" (35-1011).'
   ,'True'
   ,'1'
   ,'Once upon a time, we wanted to be bakers -- that is, until we realized two things: we wouldn''t get to eat every baked good we made and we would have to wake up well before the crack of dawn every day to start a-workin''. Assuming you''re at all like us, the idea of a well-made loaf or flaky croissant really gets you going. Find an accomplished, energetic baker for your job.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('92'
   ,'2'
   ,'2'
   ,'Baker'
   ,''
   ,''
   ,'Mezclan y hornean ingredientes para producir panes, panecillos, galletas, pasteles, hogazas de pasteler°a y otros productos horneados. Los chefs pasteleros de restaurantes y hoteles est n dentro de la ocupaci¢n ?Chefs y Primeros Chefs? (35-1011).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('93'
   ,'1'
   ,'1'
   ,'Drywall Installer'
   ,'Drywall Installers'
   ,''
   ,'Apply plasterboard or other wallboard to ceilings or interior walls of buildings.  Apply or mount acoustical tiles or blocks, strips, or sheets of shock-absorbing materials to ceilings and walls of buildings to reduce or reflect sound.  Materials may be of decorative quality.  Includes lathers who fasten wooden, metal, or rockboard lath to walls, ceilings or partitions of buildings to provide support base for plaster, fire-proofing, or acoustical material.  Excludes “Carpet Installers" (47-2041), "Carpenters" (47-2031), and "Tile and Marble Setters" (47-2044).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2081'
   ,'Drywall and Ceiling Tile Installers'
   ,'Apply plasterboard or other wallboard to ceilings or interior walls of buildings.  Apply or mount acoustical tiles or blocks, strips, or sheets of shock-absorbing materials to ceilings and walls of buildings to reduce or reflect sound.  Materials may be of decorative quality.  Includes lathers who fasten wooden, metal, or rockboard lath to walls, ceilings or partitions of buildings to provide support base for plaster, fire-proofing, or acoustical material.  Excludes “Carpet Installers" (47-2041), "Carpenters" (47-2031), and "Tile and Marble Setters" (47-2044).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('93'
   ,'2'
   ,'2'
   ,'Drywall Installer'
   ,''
   ,''
   ,'Instalan paneles de enlucido u otro tipo de bloques en techos o paredes interiores de edificios. Instalan o montan paneles o bloques ac£sticos, bandas o l minas de materiales de amortiguaci¢n en techos y paredes de edificios o en construcciones para reducir o para reflejar el sonido. Los materiales tambi‚n pueden ser de uso decorativo. Incluye a los trabajadores que ajustan o amuran listones de madera, metal o de material r¡gido en paredes, techos o divisiones de edificios como base de instalaci¢n de los paneles de material de enlucido, incombustible o ac£stico. Excluye a los ?Instaladores de Alfombras? (47-2041), ?Carpinteros? (47-2031) y a los ?Instaladores de Losas y M rmol? (47-2044).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('94'
   ,'1'
   ,'1'
   ,'Ceiling Tile Installer'
   ,'Ceiling Tile Installers'
   ,''
   ,'Apply plasterboard or other wallboard to ceilings or interior walls of buildings.  Apply or mount acoustical tiles or blocks, strips, or sheets of shock-absorbing materials to ceilings and walls of buildings to reduce or reflect sound.  Materials may be of decorative quality.  Includes lathers who fasten wooden, metal, or rockboard lath to walls, ceilings or partitions of buildings to provide support base for plaster, fire-proofing, or acoustical material.  Excludes “Carpet Installers" (47-2041), "Carpenters" (47-2031), and "Tile and Marble Setters" (47-2044).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2081'
   ,'Drywall and Ceiling Tile Installers'
   ,'Apply plasterboard or other wallboard to ceilings or interior walls of buildings.  Apply or mount acoustical tiles or blocks, strips, or sheets of shock-absorbing materials to ceilings and walls of buildings to reduce or reflect sound.  Materials may be of decorative quality.  Includes lathers who fasten wooden, metal, or rockboard lath to walls, ceilings or partitions of buildings to provide support base for plaster, fire-proofing, or acoustical material.  Excludes “Carpet Installers" (47-2041), "Carpenters" (47-2031), and "Tile and Marble Setters" (47-2044).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('94'
   ,'2'
   ,'2'
   ,'Ceiling Tile Installer'
   ,''
   ,''
   ,'Instalan paneles de enlucido u otro tipo de bloques en techos o paredes interiores de edificios. Instalan o montan paneles o bloques ac£sticos, bandas o l minas de materiales de amortiguaci¢n en techos y paredes de edificios o en construcciones para reducir o para reflejar el sonido. Los materiales tambi‚n pueden ser de uso decorativo. Incluye a los trabajadores que ajustan o amuran listones de madera, metal o de material r¡gido en paredes, techos o divisiones de edificios como base de instalaci¢n de los paneles de material de enlucido, incombustible o ac£stico. Excluye a los ?Instaladores de Alfombras? (47-2041), ?Carpinteros? (47-2031) y a los ?Instaladores de Losas y M rmol? (47-2044).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('95'
   ,'1'
   ,'1'
   ,'Garbage Collector'
   ,'Garbage Collectors'
   ,''
   ,'Collect and dump refuse or recyclable materials from containers into truck.  May drive truck. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'53-7081'
   ,'Refuse and Recyclable Material Collectors'
   ,'Collect and dump refuse or recyclable materials from containers into truck.  May drive truck. '
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('95'
   ,'2'
   ,'2'
   ,'Garbage Collector'
   ,''
   ,''
   ,'Recolectan y descargan residuos o materiales reciclables de los contenedores de basura coloc ndolos dentro del cami¢n de residuos. Pueden conducir camiones de residuos.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('96'
   ,'1'
   ,'1'
   ,'Roofer'
   ,'Roofers'
   ,''
   ,'We''re sure you''ve heard this semi-joke a million times, but we''re going to say it anyway -- you keep a roof over our heads. So thank you. Provide this essential service -- covering roofs with shingles, slate, aluminum, wood, and the like, and preserving them for years and winters to come -- for clients in need of your sheltering expertise.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2181'
   ,'Roofers'
   ,'Cover roofs of structures with shingles, slate, asphalt, aluminum, wood, or related materials.  May spray roofs, sidings, and walls with material to bind, seal, insulate, or soundproof sections of structures. '
   ,'True'
   ,'3'
   ,'Look up! Did you just get a drop of water in your eye? If so, you need a roofer. If not, well, made you look (and you might also need a roofer)! Patch up, construct, or preserve your roof with expert help from a trained professional who won''t play silly tricks like ours on you.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('96'
   ,'2'
   ,'2'
   ,'Roofer'
   ,''
   ,''
   ,'Cubren techos de estructuras con tejas de madera, tejas de pizarra, asfalto, aluminio, madera u otro tipo de materiales. Pueden aplicar materiales utilizados para unir, sellar, aislar o insonorizar secciones de estructuras sobre techos, revestimientos exteriores y paredes.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('97'
   ,'1'
   ,'1'
   ,'Typist'
   ,'Typists'
   ,''
   ,'Use word processor, computer or typewriter to type letters, reports, forms, or other material from rough draft, corrected copy, or voice recording.  May perform other clerical duties as assigned.  Excludes “Data Entry Keyers" (43-9021), "Secretaries and Administrative Assistants" (43-6011 through 43-6014), "Court Reporters" (23-2091), and "Medical Transcriptionists" (31-9094).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'43-9022'
   ,'Word Processors and Typists'
   ,'Use word processor, computer or typewriter to type letters, reports, forms, or other material from rough draft, corrected copy, or voice recording.  May perform other clerical duties as assigned.  Excludes “Data Entry Keyers" (43-9021), "Secretaries and Administrative Assistants" (43-6011 through 43-6014), "Court Reporters" (23-2091), and "Medical Transcriptionists" (31-9094).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('97'
   ,'2'
   ,'2'
   ,'Typist'
   ,''
   ,''
   ,'Utilizan m quinas de procesamiento de texto, computadoras o m quinas de escribir para escribir cartas, informes, formularios u otros materiales sobre la base de una copia borrador, copia corregida o grabaci¢n de voz. Pueden desempe¤ar otras tareas de oficina seg£n les sean asignadas. Excluye a los ?Operadores de Equipos de Ingreso de Datos? (43-9021), ?Secretarios y Asistentes Administrativos? (desde c¢digo 43-6011 hasta c¢digo 43-6014), ?Transcriptores Judiciales? (23-2091) y a los ?Transcriptores M‚dicos? (31-9094).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('98'
   ,'1'
   ,'1'
   ,'Architect'
   ,'Architects'
   ,''
   ,'If only you could make a blueprint for our lives as well as you do for our houses, offices, and surrounding structures. Planning and overseeing the construction of your thoughtfully-designed structures, you provide an essential, often highly creative service. Find and consult with clients looking for the perfect architect for their project, house, huge scheme, or anything else buildable.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'17-1011'
   ,'Architects, Except Landscape and Naval'
   ,'Plan and design structures, such as private residences, office buildings, theaters, factories, and other structural property.  Excludes ?Landscape Architects? (17-1012) and ?Marine Engineers and Naval Architects? (17-2121).'
   ,'True'
   ,'3'
   ,'Doghouse, porch extension, office building, or whole new house, there exists the perfect, eagle-eyed architect for the job. Draw out, consult, and realize your structural dreams with help from a trained professional.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('98'
   ,'2'
   ,'2'
   ,'Arquitecto/a'
   ,'Arquitectos/as'
   ,''
   ,'Planifican, proyectan y dise§an estructuras tales como residencias privadas, edificios de oficinas, teatros, f bricas y otras propiedades estructurales. Excluye a los ?Arquitectos Paisajistas? (17-1012) y a los ?Ingenieros Mar°timos y Arquitectos Navales? (17-2121).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('99'
   ,'1'
   ,'1'
   ,'Valet Attendant'
   ,'Valet Attendants'
   ,''
   ,'Park vehicles or issue tickets for customers in a parking lot or garage.  May collect fee.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'53-6021'
   ,'Parking Lot Attendants'
   ,'Park vehicles or issue tickets for customers in a parking lot or garage.  May collect fee.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('99'
   ,'2'
   ,'2'
   ,'Valet Attendant'
   ,''
   ,''
   ,'Estacionan veh°culos y entregan boletos a los clientes que dejan sus veh°culos en lotes de estacionamiento o garajes. Pueden cobrar las tarifas de estacionamiento.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('100'
   ,'1'
   ,'1'
   ,'Brickmason'
   ,'Brickmasons'
   ,''
   ,'Laying and binding building materials with the know-how only you have, your work is everywhere when we look around. Find clients in need of your expert assistance.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2021'
   ,'Brickmasons and Blockmasons'
   ,'Lay and bind building materials, such as brick, structural tile, concrete block, cinder block, glass block, and terra-cotta block, with mortar and other substances to construct or repair walls, partitions, arches, sewers, and other structures.  Excludes ?Stonemasons"" (47-2022).  Installers of mortarless segmental concrete masonry wall units are classified in ""Landscaping and Groundskeeping Workers"" (37-3011).'
   ,'True'
   ,'3'
   ,'Find the ideal bricklayer for that big pile of bricks (soon to become a wall!). '
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('100'
   ,'2'
   ,'2'
   ,'Brickmason'
   ,''
   ,''
   ,'Colocan y unen materiales de construcci¢n, tales como ladrillos, losetas estructurales, bloques de concreto, bloques de hormig¢n, bloques de vidrio y terracota con mezcla de cemento y otras sustancias para construir o reparar paredes, muros divisorios, arcos, sistemas de desag?e y otras estructuras. Excluye a los ?Alba¤iles de Piedras? (47-2022). Los alba¤iles que instalan paredes construidas con segmentos de concreto sin unirlos con mezcla o cemento est n clasificados en la ocupaci¢n ?Trabajadores de Jardiner¡a y ?reas Verdes? (37-3011).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('101'
   ,'1'
   ,'1'
   ,'Cabinetmaker'
   ,'Cabinetmakers'
   ,''
   ,'Cut, shape, and assemble wooden articles or set up and operate a variety of woodworking machines, such as power saws, jointers, and mortisers to surface, cut, or shape lumber or to fabricate parts for wood products.  Excludes ?Woodworking Machine Setters, Operators, and Tenders"" (51-7040).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'51-7011'
   ,'Cabinetmakers and Bench Carpenters'
   ,'Cut, shape, and assemble wooden articles or set up and operate a variety of woodworking machines, such as power saws, jointers, and mortisers to surface, cut, or shape lumber or to fabricate parts for wood products.  Excludes ?Woodworking Machine Setters, Operators, and Tenders"" (51-7040).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('101'
   ,'2'
   ,'2'
   ,'Cabinetmaker'
   ,''
   ,''
   ,'Cortan, modelan y ensamblan art¡culos de madera o instalan y operan una variedad de m quinas utilizadas para trabajar la madera, como por ejemplo, sierras el‚ctricas, m quinas para ensamblar, cortar o modelar madera o para fabricar piezas de productos de madera. Excluye a los ?Preparadores, Operadores y Encargados de M quinas de Ebanister¡a y Carpinter¡a? (51-7040).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('102'
   ,'1'
   ,'1'
   ,'Editor'
   ,'Editors'
   ,''
   ,'Plan, coordinate, or edit content of material for publication.  May review proposals and drafts for possible publication.  Includes technical editors.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-3041'
   ,'Editors'
   ,'Plan, coordinate, or edit content of material for publication.  May review proposals and drafts for possible publication.  Includes technical editors.'
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('102'
   ,'2'
   ,'2'
   ,'Editor'
   ,''
   ,''
   ,'Planifican, coordinan o editan el contenido de materiales para su posterior publicaci¢n. Pueden revisar propuestas y borradores de posible publicaci¢n. Incluye a los editores t‚cnicos.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('103'
   ,'1'
   ,'1'
   ,'Video Editor'
   ,'Video Editors'
   ,''
   ,'Plan, coordinate, or edit content of material for publication.  May review proposals and drafts for possible publication.  Includes technical editors.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-3041'
   ,'Editors'
   ,'Plan, coordinate, or edit content of material for publication.  May review proposals and drafts for possible publication.  Includes technical editors.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('103'
   ,'2'
   ,'2'
   ,'Video Editor'
   ,''
   ,''
   ,'Planifican, coordinan o editan el contenido de materiales para su posterior publicaci¢n. Pueden revisar propuestas y borradores de posible publicaci¢n. Incluye a los editores t‚cnicos.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('104'
   ,'1'
   ,'1'
   ,'Rehabilitation Counselor'
   ,'Rehabilitation Counselors'
   ,''
   ,'Counsel individuals to maximize the independence and employability of persons coping with personal, social, and vocational difficulties that result from birth defects, illness, disease, accidents, or the stress of daily life.  Coordinate activities for residents of care and treatment facilities.  Assess client needs and design and implement rehabilitation programs that may include personal and vocational counseling, training, and job placement.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'21-1015'
   ,'Rehabilitation Counselors'
   ,'Counsel individuals to maximize the independence and employability of persons coping with personal, social, and vocational difficulties that result from birth defects, illness, disease, accidents, or the stress of daily life.  Coordinate activities for residents of care and treatment facilities.  Assess client needs and design and implement rehabilitation programs that may include personal and vocational counseling, training, and job placement.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('104'
   ,'2'
   ,'2'
   ,'Rehabilitation Counselor'
   ,''
   ,''
   ,'Asesoran a las personas que est n enfrentando dificultades personales, sociales y vocacionales causadas por defectos de nacimiento, afecciones, enfermedades, accidentes o por el estr‚s de la vida cotidiana para ayudarlos a maximizar su nivel de independencia y su capacidad de conseguir empleo. Coordinan las actividades de los residentes internados en centros de atenci¢n y tratamiento. Eval£an las necesidades del paciente y dise¤an e implementan programas de rehabilitaci¢n que pueden incluir consejer¡a personal y vocacional, capacitaci¢n y asistencia para colocaci¢n de empleo.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('105'
   ,'1'
   ,'1'
   ,'Butcher'
   ,'Butchers'
   ,''
   ,'Cut, trim, or prepare consumer-sized portions of meat for use or sale in retail establishments.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'51-3021'
   ,'Butchers and Meat Cutters'
   ,'Cut, trim, or prepare consumer-sized portions of meat for use or sale in retail establishments.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('105'
   ,'2'
   ,'2'
   ,'Butcher'
   ,''
   ,''
   ,'Cortan, filetean o preparan porciones de carne para consumo o para la venta en establecimientos minoristas.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('106'
   ,'1'
   ,'1'
   ,'Massage Therapist'
   ,'Massage Therapists'
   ,'Masseuse, Masseur, Body work'
   ,'We''ve got your back. While you''re terrifically massaging ours. Find clients who need to work out their kinks, offer treatment plans and evaluations of their bodily woes.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'31-9011'
   ,'Massage Therapists'
   ,'Perform therapeutic massages of soft tissues and joints.  May assist in the assessment of range of motion and muscle strength, or propose client therapy plans.'
   ,'True'
   ,'1'
   ,'Does someone have your back? Well, they should. Find the perfect massage therapist to work out your kinks, advise you on treatment plans, and get a better understanding of your bodily woes.'
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('106'
   ,'2'
   ,'2'
   ,'Masajista'
   ,'Masajistas'
   ,''
   ,'Realizan masajes terap‚uticos en los tejidos blandos y en las articulaciones. Pueden colaborar en la evaluaci¢n del rango de movimiento y fortaleza muscular, o proponer planes de terapia para el paciente.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('107'
   ,'1'
   ,'1'
   ,'Courier'
   ,'Couriers'
   ,''
   ,'Not only do you know every inch of your town''s layout, but you''re likely the owner of some enviable biceps, thanks to the repeated heavy lifting of the items you transport from one person to another. By foot, bicycle, car, or jetski, you safely and efficiently move an item from point A to point B, with the hearty thanks of the eventual recipient (especially if that item is a sandwich). Find clients needing your speedy service and know-how.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'43-5021'
   ,'Couriers and Messengers'
   ,'Pick up and deliver messages, documents, packages, and other items between offices or departments within an establishment or directly to other business concerns, traveling by foot, bicycle, motorcycle, automobile, or public conveyance.  Excludes ""Light Truck or Delivery Services Drivers"" (53-3033).'
   ,'True'
   ,'3'
   ,'Not only do these folks know every inch of their environment, they''re likely the proud owners of some enviable biceps. Transport what you will -- sandwich, papers, table -- from point A to point B with a courier working on foot or by bicycle, car, or jetski (we wish). '
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('107'
   ,'2'
   ,'2'
   ,'Mensajero/a'
   ,'Mensajeros/as'
   ,''
   ,'Recogen y entregan mensajes, documentos, paquetes y otros art°culos entre oficinas o departamentos dentro de un establecimiento o directamente con otras empresas comerciales, traslad ndose a pie, en bicicleta, motocicleta, autom¢vil o en transporte p£blico. Excluye a los ?Conductores de Cami¢n Liviano o de Servicio de Entrega? (53-3033).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('108'
   ,'1'
   ,'1'
   ,'Aircraft Mechanic'
   ,'Aircraft Mechanics'
   ,''
   ,'Diagnose, adjust, repair, or overhaul aircraft engines and assemblies, such as hydraulic and pneumatic systems.  Includes helicopter and aircraft engine specialists.  Excludes ?Avionics Technician"" (49-2091).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-3011'
   ,'Aircraft Mechanics and Service Technicians'
   ,'Diagnose, adjust, repair, or overhaul aircraft engines and assemblies, such as hydraulic and pneumatic systems.  Includes helicopter and aircraft engine specialists.  Excludes ?Avionics Technician"" (49-2091).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('108'
   ,'2'
   ,'2'
   ,'Aircraft Mechanic'
   ,''
   ,''
   ,'Diagnostican, ajustan, reparan o reacondicionan motores y ensamblajes de aeronaves, como por ejemplo, sistemas hidr ulicos y neum ticos. Incluye a los especialistas en motores de aviones y helic¢pteros. Excluye a los ?T‚cnicos de Avi¢nica? (49-2091).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('109'
   ,'1'
   ,'1'
   ,'Speech Pathologist'
   ,'Speech Pathologists'
   ,''
   ,'Assess and treat persons with speech, language, voice, and fluency disorders.  May select alternative communication systems and teach their use.  May perform research related to speech and language problems.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'29-1127'
   ,'Speech-Language Pathologists'
   ,'Assess and treat persons with speech, language, voice, and fluency disorders.  May select alternative communication systems and teach their use.  May perform research related to speech and language problems.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('109'
   ,'2'
   ,'2'
   ,'Logopeda'
   ,'Logopedas'
   ,''
   ,'Eval£an y tratan a personas con trastornos del habla, lenguaje, voz y fluidez de palabra. Pueden seleccionar sistemas alternativos de comunicaci¢n y ense§arles a los pacientes el modo de usarlos. Pueden realizar investigaciones sobre temas relacionados con problemas del habla y el lenguaje.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('110'
   ,'1'
   ,'1'
   ,'Lifeguard'
   ,'Lifeguards'
   ,''
   ,'Baywatch die-hards or not (we''re guessing not), you folks are essential keepers of aquatic safety and protection. Find clients looking for your expert protection and fierce whistle-blowing capabilities.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'33-9092'
   ,'Lifeguards, Ski Patrol, and Other Recreational Protective Service Workers'
   ,'Monitor recreational areas, such as pools, beaches, or ski slopes to provide assistance and protection to participants.'
   ,'True'
   ,'3'
   ,'Find the perfect whistle-blower and trained aquatic safety professional for your pool, event, or long bath.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('110'
   ,'2'
   ,'2'
   ,'Salvavidas'
   ,'Salvavidas'
   ,''
   ,'Monitorean  reas recreativas tales como piscinas, playas o laderas de esqu° para prestar socorro y protecci¢n a los participantes.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('111'
   ,'1'
   ,'1'
   ,'Mental Health Counselor'
   ,'Mental Health Counselors'
   ,''
   ,'Aconsejan a individuos y grupos poniendo ‚nfasis en la prevenci¢n. Trabajan con individuos y grupos con el fin de promover un estado de salud mental y emocional ¢ptimo. Pueden ayudar a los individuos a lidiar con asuntos relacionados con las adicciones y el abuso de sustancias; problemas familiares, de paternidad y maternidad y conflictos matrimoniales; manejo del estr‚s; autoestima y envejecimiento. Excluye a los ?Trabajadores Sociales? (desde c¢digo 21-1021 hasta c¢digo 21-1029), ?Psiquiatras? (29-1066) y a los ?Psic¢logos? (desde c¢digo 19-3031 hasta c¢digo 19-3039).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'21-1014'
   ,'Consejeros de Salud Mental'
   ,'Aconsejan a individuos y grupos poniendo ‚nfasis en la prevenci¢n. Trabajan con individuos y grupos con el fin de promover un estado de salud mental y emocional ¢ptimo. Pueden ayudar a los individuos a lidiar con asuntos relacionados con las adicciones y el abuso de sustancias; problemas familiares, de paternidad y maternidad y conflictos matrimoniales; manejo del estr‚s; autoestima y envejecimiento. Excluye a los ?Trabajadores Sociales? (desde c¢digo 21-1021 hasta c¢digo 21-1029), ?Psiquiatras? (29-1066) y a los ?Psic¢logos? (desde c¢digo 19-3031 hasta c¢digo 19-3039).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('111'
   ,'2'
   ,'2'
   ,'Mental Health Counselor'
   ,''
   ,''
   ,'Aconsejan a individuos y grupos poniendo ‚nfasis en la prevenci¢n. Trabajan con individuos y grupos con el fin de promover un estado de salud mental y emocional ¢ptimo. Pueden ayudar a los individuos a lidiar con asuntos relacionados con las adicciones y el abuso de sustancias; problemas familiares, de paternidad y maternidad y conflictos matrimoniales; manejo del estr‚s; autoestima y envejecimiento. Excluye a los ?Trabajadores Sociales? (desde c¢digo 21-1021 hasta c¢digo 21-1029), ?Psiquiatras? (29-1066) y a los ?Psic¢logos? (desde c¢digo 19-3031 hasta c¢digo 19-3039).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('112'
   ,'1'
   ,'1'
   ,'Personal Shopper'
   ,'Personal Shoppers'
   ,''
   ,'As much as everyone wants to look their best, well, some of us have an easier time at it than others. Luckily you''re around to bridge the gap with personalized help. Find clients needing wardrobe assistance, your expert eye, and general know-how.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'39-9099'
   ,'Personal Care and Service Workers, All Other'
   ,'All personal care and service workers not listed separately.'
   ,'True'
   ,'2'
   ,'We have a recurring dream where we sit down to work, work for a while, look down, and realize that we''ve been typing for a decade and our wardrobe hasn''t changed one bit. Crop top, sparkling white sneakers, bellbottomed denim, Britney-style pigtails, and everything. If you''re a victim of this same dream, in a wardrobe rut, pressed for time, or just in need of an outside opinion, there''s the perfect personal shopper for the job. They''ll assess the situation, hear you out, make suggestions, and get you dreaming of sugarplums once more.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('112'
   ,'2'
   ,'2'
   ,'Personal Shopper'
   ,''
   ,''
   ,'Todos los trabajadores de ocupaciones relacionadas con el cuidado y servicio personal que no est n listados por separado.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('113'
   ,'1'
   ,'1'
   ,'Travel Agent'
   ,'Travel Agents'
   ,''
   ,'Book it! You help clients make the stuff of their dreams -- white sand, rainy afternoons spent in Parisian cafes, ziplining through the cloud forest -- into a hopefully semi-affordable reality. Find clients eager for your industry expertise, your mental database of travel options and seasonal fares, your one-on-one advice, and your pullable strings.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'41-3041'
   ,'Travel Agents'
   ,'Plan and sell transportation and accommodations for travel agency customers.  Determine destination, modes of transportation, travel dates, costs, and accommodations required.  May also describe, plan, and arrange itineraries and sell tour packages.  May assist in resolving clients? travel problems.'
   ,'True'
   ,'3'
   ,'A blissful beach with hot white sand? Afternoons spent ducking out of the rain and into Parisian cafés? Solo fjord excursions? Ziplining through the cloud forest? Whatever your ideal adventure, the perfect travel agent exists to wrangle it into reality.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('113'
   ,'2'
   ,'2'
   ,'Travel Agent'
   ,''
   ,''
   ,'Planifican y venden servicios de transporte y de alojamiento a los clientes de las agencias de viajes. Determinan los destinos, medios de transporte, fechas de viaje, costos y lugares de alojamiento necesarios. Tambi‚n pueden describir, planificar y coordinar itinerarios y vender paquetes de excursiones tur¡sticas. Pueden ayudar a los clientes a resolver los problemas de viaje.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('114'
   ,'1'
   ,'1'
   ,'Occupational Therapist'
   ,'Occupational Therapists'
   ,''
   ,'Assess, plan, organize, and participate in rehabilitative programs that help build or restore vocational, homemaking, and daily living skills, as well as general independence, to persons with disabilities or developmental delays.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'29-1122'
   ,'Occupational Therapists'
   ,'Assess, plan, organize, and participate in rehabilitative programs that help build or restore vocational, homemaking, and daily living skills, as well as general independence, to persons with disabilities or developmental delays.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('114'
   ,'2'
   ,'2'
   ,'Occupational Therapist'
   ,''
   ,''
   ,'Eval£an, planifican, organizan y participan de programas de rehabilitaci¢n que tiene por fin ayudar a generar o restaurar aptitudes y capacidades vocacionales, hogare¤as y de la vida diaria, como as¡ tambi‚n la independencia general de personas con discapacidades o retrasos de desarrollo.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('115'
   ,'1'
   ,'1'
   ,'Tire Repairer'
   ,'Tire Repairers'
   ,''
   ,'Repair and replace tires.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-3093'
   ,'Tire Repairers and Changers'
   ,'Repair and replace tires.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('115'
   ,'2'
   ,'2'
   ,'Tire Repairer'
   ,''
   ,''
   ,'Reparan y cambian neum ticos o llantas.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('116'
   ,'1'
   ,'1'
   ,'Product Demonstrator'
   ,'Product Demonstrators'
   ,''
   ,'Demonstrate merchandise and answer questions for the purpose of creating public interest in buying the product.  May sell demonstrated merchandise.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'41-9011'
   ,'Demonstrators and Product Promoters'
   ,'Demonstrate merchandise and answer questions for the purpose of creating public interest in buying the product.  May sell demonstrated merchandise.'
   ,'False'
   ,'2'
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('116'
   ,'2'
   ,'2'
   ,'Product Demonstrator'
   ,''
   ,''
   ,'Hacen demostraciones de productos y responden preguntas de los interesados con el prop¢sito de generar el inter‚s del p£blico en la compra de un producto en particular. Pueden vender la mercader¡a de demostraci¢n.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('117'
   ,'1'
   ,'1'
   ,'Product Promoter'
   ,'Product Promoters'
   ,''
   ,'Demonstrate merchandise and answer questions for the purpose of creating public interest in buying the product.  May sell demonstrated merchandise.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'41-9011'
   ,'Demonstrators and Product Promoters'
   ,'Demonstrate merchandise and answer questions for the purpose of creating public interest in buying the product.  May sell demonstrated merchandise.'
   ,'False'
   ,'2'
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('117'
   ,'2'
   ,'2'
   ,'Product Promoter'
   ,''
   ,''
   ,'Hacen demostraciones de productos y responden preguntas de los interesados con el prop¢sito de generar el inter‚s del p£blico en la compra de un producto en particular. Pueden vender la mercader¡a de demostraci¢n.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('118'
   ,'1'
   ,'1'
   ,'Producer'
   ,'Producers'
   ,''
   ,'Produce or direct stage, television, radio, video, or motion picture productions for entertainment, information, or instruction.  Responsible for creative decisions, such as interpretation of script, choice of actors or guests, set design, sound, special effects, and choreography.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-2012'
   ,'Producers and Directors'
   ,'Produce or direct stage, television, radio, video, or motion picture productions for entertainment, information, or instruction.  Responsible for creative decisions, such as interpretation of script, choice of actors or guests, set design, sound, special effects, and choreography.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('118'
   ,'2'
   ,'2'
   ,'Producer'
   ,''
   ,''
   ,'Producen o dirigen representaciones esc‚nicas, o producciones de televisi¢n, radio, video o cine con fines de entretenimiento, informaci¢n o instrucci¢n. Son responsables de tomar decisiones creativas, tales como la interpretaci¢n de un gui¢n, la selecci¢n de actores o participantes invitados, dise¤o del set, sonido, efectos especiales y coreograf¡a.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('119'
   ,'1'
   ,'1'
   ,'Director'
   ,'Directors'
   ,''
   ,'Produce or direct stage, television, radio, video, or motion picture productions for entertainment, information, or instruction.  Responsible for creative decisions, such as interpretation of script, choice of actors or guests, set design, sound, special effects, and choreography.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-2012'
   ,'Producers and Directors'
   ,'Produce or direct stage, television, radio, video, or motion picture productions for entertainment, information, or instruction.  Responsible for creative decisions, such as interpretation of script, choice of actors or guests, set design, sound, special effects, and choreography.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('119'
   ,'2'
   ,'2'
   ,'Director'
   ,''
   ,''
   ,'Producen o dirigen representaciones esc‚nicas, o producciones de televisi¢n, radio, video o cine con fines de entretenimiento, informaci¢n o instrucci¢n. Son responsables de tomar decisiones creativas, tales como la interpretaci¢n de un gui¢n, la selecci¢n de actores o participantes invitados, dise¤o del set, sonido, efectos especiales y coreograf¡a.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('120'
   ,'1'
   ,'1'
   ,'Tax Preparer'
   ,'Tax Preparers'
   ,''
   ,'You make sense of taxes, a world that to the rest of us feels like Mordor -- i.e., terrifying, gloomy, and run by a supreme, ever-watchful overlord. Determining tax liability and collecting taxes from both people and organizations, you (to continue the metaphor) are our Frodo, pushing ever forward through rough, surprising territory. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'13-2082'
   ,'Tax Preparers'
   ,'Determine tax liability or collect taxes from individuals or business firms according to prescribed laws and regulations.'
   ,'True'
   ,'2'
   ,'In a sense, tax preparers are like Frodo (Middle Earth''s savior) pushing through Mordor (that terrifying land of fiery pits and sharp rocks) to save all the rest of us hobbits. They make sense of our taxes and determine fees and liabilities, pushing ever forward towards tax season''s rough terrain like only they know how.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('120'
   ,'2'
   ,'2'
   ,'Tax Preparer'
   ,''
   ,''
   ,'Preparan declaraciones de impuestos de individuos o de peque§os comercios. Excluye a los ?Contadores y Auditores? (13-2011).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('121'
   ,'1'
   ,'1'
   ,'Real Estate Appraiser'
   ,'Real Estate Appraisers'
   ,''
   ,'Appraise real property and estimate its fair value.  May assess taxes in accordance with prescribed schedules.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'13-2021'
   ,'Appraisers and Assessors of Real Estate'
   ,'Appraise real property and estimate its fair value.  May assess taxes in accordance with prescribed schedules.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('121'
   ,'2'
   ,'2'
   ,'Tasador/a de Propiedades'
   ,'Tasadores/as de Propiedades'
   ,''
   ,'Tasan bienes ra°ces o inmuebles y calculan su justo valor. Pueden cuantificar el valor de los impuestos de acuerdo a las tablas de c lculo prescritas.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('122'
   ,'1'
   ,'1'
   ,'Real Estate Assessor'
   ,'Real Estate Assessors'
   ,''
   ,'Appraise real property and estimate its fair value.  May assess taxes in accordance with prescribed schedules.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'13-2021'
   ,'Appraisers and Assessors of Real Estate'
   ,'Appraise real property and estimate its fair value.  May assess taxes in accordance with prescribed schedules.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('122'
   ,'2'
   ,'2'
   ,'Real Estate Assessor'
   ,''
   ,''
   ,'Tasan bienes ra°ces o inmuebles y calculan su justo valor. Pueden cuantificar el valor de los impuestos de acuerdo a las tablas de c lculo prescritas.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('123'
   ,'1'
   ,'1'
   ,'Substance Abuse Counselor'
   ,'Substance Abuse Counselors'
   ,''
   ,'Counsel and advise individuals with alcohol, tobacco, drug, or other problems, such as gambling and eating disorders.  May counsel individuals, families, or groups or engage in prevention programs.  Excludes “Social Workers" (21-1021 through  21-1029), "Psychologists" (19-3031 through 19-3039), and "Mental Health Counselors" (21-1014) providing these services.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'21-1011'
   ,'Substance Abuse and Behavioral Disorder Counselors'
   ,'Counsel and advise individuals with alcohol, tobacco, drug, or other problems, such as gambling and eating disorders.  May counsel individuals, families, or groups or engage in prevention programs.  Excludes “Social Workers" (21-1021 through  21-1029), "Psychologists" (19-3031 through 19-3039), and "Mental Health Counselors" (21-1014) providing these services.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('123'
   ,'2'
   ,'2'
   ,'Substance Abuse Counselor'
   ,''
   ,''
   ,'Aconsejan y asesoran a las personas que tienen problemas de alcoholismo, tabaquismo, drogadicci¢n y otros problemas tales como adicci¢n a los juegos de azar y trastornos de la alimentaci¢n. Pueden aconsejar a individuos, familias o grupos o participar de programas de prevenci¢n. Excluye a los ?Trabajadores Sociales? (desde c¢digo 21-1021 hasta c¢digo 21-1029),?Psic¢logos? (desde c¢digo 19-3031 hasta c¢digo 19-3039) y a los ?Consejeros de Salud Mental? (21-1014) que prestan estos servicios.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('124'
   ,'1'
   ,'1'
   ,'Behavioral Disorder Counselor'
   ,'Behavioral Disorder Counselors'
   ,''
   ,'Counsel and advise individuals with alcohol, tobacco, drug, or other problems, such as gambling and eating disorders.  May counsel individuals, families, or groups or engage in prevention programs.  Excludes “Social Workers" (21-1021 through  21-1029), "Psychologists" (19-3031 through 19-3039), and "Mental Health Counselors" (21-1014) providing these services.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'21-1011'
   ,'Substance Abuse and Behavioral Disorder Counselors'
   ,'Counsel and advise individuals with alcohol, tobacco, drug, or other problems, such as gambling and eating disorders.  May counsel individuals, families, or groups or engage in prevention programs.  Excludes “Social Workers" (21-1021 through  21-1029), "Psychologists" (19-3031 through 19-3039), and "Mental Health Counselors" (21-1014) providing these services.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('124'
   ,'2'
   ,'2'
   ,'Behavioral Disorder Counselor'
   ,''
   ,''
   ,'Aconsejan y asesoran a las personas que tienen problemas de alcoholismo, tabaquismo, drogadicci¢n y otros problemas tales como adicci¢n a los juegos de azar y trastornos de la alimentaci¢n. Pueden aconsejar a individuos, familias o grupos o participar de programas de prevenci¢n. Excluye a los ?Trabajadores Sociales? (desde c¢digo 21-1021 hasta c¢digo 21-1029),?Psic¢logos? (desde c¢digo 19-3031 hasta c¢digo 19-3039) y a los ?Consejeros de Salud Mental? (21-1014) que prestan estos servicios.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('125'
   ,'1'
   ,'1'
   ,'Multimedia Artist'
   ,'Multimedia Artists'
   ,''
   ,'Create special effects, animation, or other visual images using film, video, computers, or other electronic tools and media for use in products or creations, such as computer games, movies, music videos, and commercials.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-1014'
   ,'Multimedia Artists and Animators'
   ,'Create special effects, animation, or other visual images using film, video, computers, or other electronic tools and media for use in products or creations, such as computer games, movies, music videos, and commercials.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('125'
   ,'2'
   ,'2'
   ,'Artista Multimedia'
   ,'Artistas Multimedia'
   ,''
   ,'Crean efectos especiales, animaciones u otras im genes visuales utilizando pel°culas, videos, computadoras y otras herramientas y medios electr¢nicos a ser utilizados en productos o creaciones tales como juegos de computadora, pel°culas, videos de m£sica y anuncios publicitarios.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('126'
   ,'1'
   ,'1'
   ,'Animator'
   ,'Animators'
   ,''
   ,'Create special effects, animation, or other visual images using film, video, computers, or other electronic tools and media for use in products or creations, such as computer games, movies, music videos, and commercials.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-1014'
   ,'Multimedia Artists and Animators'
   ,'Create special effects, animation, or other visual images using film, video, computers, or other electronic tools and media for use in products or creations, such as computer games, movies, music videos, and commercials.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('126'
   ,'2'
   ,'2'
   ,'Animator'
   ,''
   ,''
   ,'Crean efectos especiales, animaciones u otras im genes visuales utilizando pel°culas, videos, computadoras y otras herramientas y medios electr¢nicos a ser utilizados en productos o creaciones tales como juegos de computadora, pel°culas, videos de m£sica y anuncios publicitarios.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('127'
   ,'1'
   ,'1'
   ,'Pilot'
   ,'Pilots'
   ,''
   ,'Pilot and navigate the flight of fixed-wing, multi-engine aircraft, usually on scheduled air carrier routes, for the transport of passengers and cargo.  Requires Federal Air Transport certificate and rating for specific aircraft type used.  Includes regional, National, and international airline pilots and flight instructors of airline pilots.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'53-2011'
   ,'Airline Pilots, Copilots, and Flight Engineers'
   ,'Pilot and navigate the flight of fixed-wing, multi-engine aircraft, usually on scheduled air carrier routes, for the transport of passengers and cargo.  Requires Federal Air Transport certificate and rating for specific aircraft type used.  Includes regional, National, and international airline pilots and flight instructors of airline pilots.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('127'
   ,'2'
   ,'2'
   ,'Pilot'
   ,''
   ,''
   ,'Pilotean y navegan el vuelo de aeronaves multimotor y de alas fijas, usualmente en rutas a‚reas programadas para transportar pasajeros y carga. Deben poseer un Certificado Federal de Piloto de Transporte A‚reo y la clasificaci¢n correspondiente al tipo espec¡fico de avi¢n a pilotearse. Incluye a los pilotos de aerol¡neas regionales, nacionales e internacionales y a los instructores de vuelo de pilotos de l¡neas a‚reas.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('128'
   ,'1'
   ,'1'
   ,'Floral Designer'
   ,'Floral Designers'
   ,''
   ,'You wrangle plants and flowers into delightful submission, creating arrangements and displays to customers'' specifications (even if they''re not quite sure what they want). From a dozen roses to a huge, baby''s breath-free masterpiece, you''ve got the smarts and the clippers for the job. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-1023'
   ,'Floral Designers'
   ,'Design, cut, and arrange live, dried, or artificial flowers and foliage.'
   ,'True'
   ,'1'
   ,'A dozen roses or a masterpiece absolutely free of baby''s breath, your floral desires can be realized by the right florist. Find someone with the cutting precision and know-how for the job.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('128'
   ,'2'
   ,'2'
   ,'DiseÒador/a Floral'
   ,'DiseÒadores/as Florales'
   ,''
   ,'Dise§an, cortan y arreglan flores y plantas decorativas vivas, disecadas o artificiales.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('129'
   ,'1'
   ,'1'
   ,'Tile and Marble Setter'
   ,'Tile and Marble Setters'
   ,''
   ,'Apply hard tile, marble, and wood tile to walls, floors, ceilings, and roof decks.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2044'
   ,'Tile and Marble Setters'
   ,'Apply hard tile, marble, and wood tile to walls, floors, ceilings, and roof decks.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('129'
   ,'2'
   ,'2'
   ,'Tile and Marble Setter'
   ,''
   ,''
   ,'Aplican losas, m rmol y tejuelas de madera en paredes, pisos, techos y azoteas.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('130'
   ,'1'
   ,'1'
   ,'Manicurist'
   ,'Manicurists'
   ,''
   ,'You file away our hand-related worries. Tending to customers'' various skin and nail woes, you give them helping hand (or two). Find clients eager for your expertise and gentle touch.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'39-5092'
   ,'Manicurists and Pedicurists'
   ,'Clean and shape customers'' fingernails and toenails.  May polish or decorate nails.'
   ,'True'
   ,'1'
   ,'Need a helping hand (or two)? The right manicurist addresses your hand-related woes and gets you back on track with soft skin, evenly trimmed and filed nails, and a coat or two of daring color. '
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('130'
   ,'2'
   ,'2'
   ,'Manicuro/a'
   ,'Manicuros/as'
   ,''
   ,'Acicalan y moldean las u§as de las manos y de los pies de los clientes. Pueden pintar y decorar u§as.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('131'
   ,'1'
   ,'1'
   ,'Pedicurist'
   ,'Pedicurists'
   ,''
   ,'You file away our foot-related worries. Tending to customers'' various skin and nail woes, you ensure everyone''s on their own two feet. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'39-5092'
   ,'Manicurists and Pedicurists'
   ,'Clean and shape customers'' fingernails and toenails.  May polish or decorate nails.'
   ,'True'
   ,'1'
   ,'Needing to get back on your own two feet? A great pedicurist can make all the difference with thoughtful care towards your skin and toenails, washing, moisturizing, trimming, buffing, and polishing everything back up.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('131'
   ,'2'
   ,'2'
   ,'Pedicuro/a'
   ,'Pedicuros/as'
   ,''
   ,'Acicalan y moldean las u§as de las manos y de los pies de los clientes. Pueden pintar y decorar u§as.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('132'
   ,'1'
   ,'1'
   ,'Interior Designer'
   ,'Interior Designers'
   ,'Interior Decorator, Decorator'
   ,'Bring light, beauty, and design into spaces previously dark, ugly, and/or unthoughtful. Believe us, we need your help. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-1025'
   ,'Interior Designers'
   ,'Plan, design, and furnish interiors of residential, commercial, or industrial buildings.  Formulate design which is practical, aesthetic, and conducive to intended purposes, such as raising productivity, selling merchandise, or improving life style.  May specialize in a particular field, style, or phase of interior design.  Excludes ""Merchandise Displayers and Window Trimmers"" (27-1026).'
   ,'True'
   ,'2'
   ,'Whether you''re remodeling, rethinking, just at your wit''s end, or maybe all of the above, there''s an interior designer out there to calm you down and bring beauty into your space.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('132'
   ,'2'
   ,'2'
   ,'DiseÒador/a de Interiores'
   ,'DiseÒadores/as de Interiores'
   ,''
   ,'Planifican, dise¤an y equipan espacios interiores de edificios residenciales, comerciales o industriales. Formulan dise¤os pr cticos, est‚ticos y conducentes respecto de los prop¢sitos establecidos, como por ejemplo, aumentar el nivel de productividad, vender mercader¡a o mejorar el estilo de vida. Pueden estar especializados en un campo, estilo o fase del dise¤o de interiores. Excluye a los ?Dise¤adores de Exhibidores de Mercader¡a y Escaparatistas? (27-1026).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('133'
   ,'1'
   ,'1'
   ,'Title Examiner'
   ,'Title Examiners'
   ,''
   ,'Search real estate records, examine titles, or summarize pertinent legal or insurance documents or details for a variety of purposes.  May compile lists of mortgages, contracts, and other instruments pertaining to titles by searching public and private records for law firms, real estate agencies, or title insurance companies.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'23-2093'
   ,'Title Examiners, Abstractors, and Searchers'
   ,'Search real estate records, examine titles, or summarize pertinent legal or insurance documents or details for a variety of purposes.  May compile lists of mortgages, contracts, and other instruments pertaining to titles by searching public and private records for law firms, real estate agencies, or title insurance companies.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('133'
   ,'2'
   ,'2'
   ,'Title Examiner'
   ,''
   ,''
   ,'Exploran los registros de bienes inmuebles, examinan t°tulos o resumen documentos o detalles legales o de seguro pertinentes con diversos prop¢sitos. Pueden compilar listas de hipotecas, contratos y otros instrumentos relacionados con los t°tulos de propiedad por medio de la exploraci¢n de registros p£blicos y privados al servicio de firmas jur°dicas, agencias de bienes ra°ces o compa§°as aseguradoras de t°tulos.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('134'
   ,'1'
   ,'1'
   ,'Title Abstractor'
   ,'Title Abstractors'
   ,''
   ,'Search real estate records, examine titles, or summarize pertinent legal or insurance documents or details for a variety of purposes.  May compile lists of mortgages, contracts, and other instruments pertaining to titles by searching public and private records for law firms, real estate agencies, or title insurance companies.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'23-2093'
   ,'Title Examiners, Abstractors, and Searchers'
   ,'Search real estate records, examine titles, or summarize pertinent legal or insurance documents or details for a variety of purposes.  May compile lists of mortgages, contracts, and other instruments pertaining to titles by searching public and private records for law firms, real estate agencies, or title insurance companies.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('134'
   ,'2'
   ,'2'
   ,'Title Abstractor'
   ,''
   ,''
   ,'Exploran los registros de bienes inmuebles, examinan t°tulos o resumen documentos o detalles legales o de seguro pertinentes con diversos prop¢sitos. Pueden compilar listas de hipotecas, contratos y otros instrumentos relacionados con los t°tulos de propiedad por medio de la exploraci¢n de registros p£blicos y privados al servicio de firmas jur°dicas, agencias de bienes ra°ces o compa§°as aseguradoras de t°tulos.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('135'
   ,'1'
   ,'1'
   ,'Title Searcher'
   ,'Title Searchers'
   ,''
   ,'Search real estate records, examine titles, or summarize pertinent legal or insurance documents or details for a variety of purposes.  May compile lists of mortgages, contracts, and other instruments pertaining to titles by searching public and private records for law firms, real estate agencies, or title insurance companies.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'23-2093'
   ,'Title Examiners, Abstractors, and Searchers'
   ,'Search real estate records, examine titles, or summarize pertinent legal or insurance documents or details for a variety of purposes.  May compile lists of mortgages, contracts, and other instruments pertaining to titles by searching public and private records for law firms, real estate agencies, or title insurance companies.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('135'
   ,'2'
   ,'2'
   ,'Title Searcher'
   ,''
   ,''
   ,'Exploran los registros de bienes inmuebles, examinan t°tulos o resumen documentos o detalles legales o de seguro pertinentes con diversos prop¢sitos. Pueden compilar listas de hipotecas, contratos y otros instrumentos relacionados con los t°tulos de propiedad por medio de la exploraci¢n de registros p£blicos y privados al servicio de firmas jur°dicas, agencias de bienes ra°ces o compa§°as aseguradoras de t°tulos.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('136'
   ,'1'
   ,'1'
   ,'Exterminator'
   ,'Exterminators'
   ,''
   ,'Helping houses and buildings get into tip-top shape again, you take your know-how and trusty tools to various pesky pests. Find clients desperately searching for your help in getting rid of those weird attic noises at night, the chewed-up wires, the growing number of holes in the ceiling.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'37-2021'
   ,'Pest Control Workers'
   ,'Apply or release chemical solutions or toxic gases and set traps to kill or remove pests and vermin that infest buildings and surrounding areas. '
   ,'True'
   ,'2'
   ,'Whatever the issue -- ghastly noises from the attic at night, a growing number of holes in the ceiling -- there''s the right exterminator for the job. Find a trained professional sympathetic to your problem and equipped with a variety of solutions. '
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('136'
   ,'2'
   ,'2'
   ,'Exterminador/a'
   ,'Exterminadores/as'
   ,''
   ,'Aplican o esparcen soluciones qu°micas o gases t¢xicos y colocan trampas para matar o eliminar plagas e insectos que infestan los edificios y  reas circundantes.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('137'
   ,'1'
   ,'1'
   ,'Security Alarm Installer'
   ,'Security Alarm Installers'
   ,''
   ,'Install, program, maintain, and repair security and fire alarm wiring and equipment.  Ensure that work is in accordance with relevant codes.  Excludes ?Electricians"" (47-2111) who do a broad range of electrical wiring.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-2098'
   ,'Security and Fire Alarm Systems Installers'
   ,'Install, program, maintain, and repair security and fire alarm wiring and equipment.  Ensure that work is in accordance with relevant codes.  Excludes ?Electricians"" (47-2111) who do a broad range of electrical wiring.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('137'
   ,'2'
   ,'2'
   ,'Instalador/a de Alarmas'
   ,'Instaladores/as de Alarmas'
   ,''
   ,'Instalan, programan, mantienen o reparan el equipo y el cableado de los sistemas de alarma de seguridad o de incendio. Se aseguran de que el trabajo se efect£e conforme a los c¢digos pertinentes. Excluye a los ?Electricistas? (47-2111) que efect£an una amplia variedad de tareas de cableado de conexi¢n.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('138'
   ,'1'
   ,'1'
   ,'Fire Alarm Installer'
   ,'Fire Alarm Installers'
   ,''
   ,'Install, program, maintain, and repair security and fire alarm wiring and equipment.  Ensure that work is in accordance with relevant codes.  Excludes ?Electricians"" (47-2111) who do a broad range of electrical wiring.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-2098'
   ,'Security and Fire Alarm Systems Installers'
   ,'Install, program, maintain, and repair security and fire alarm wiring and equipment.  Ensure that work is in accordance with relevant codes.  Excludes ?Electricians"" (47-2111) who do a broad range of electrical wiring.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('138'
   ,'2'
   ,'2'
   ,'Fire Alarm Installer'
   ,''
   ,''
   ,'Instalan, programan, mantienen o reparan el equipo y el cableado de los sistemas de alarma de seguridad o de incendio. Se aseguran de que el trabajo se efect£e conforme a los c¢digos pertinentes. Excluye a los ?Electricistas? (47-2111) que efect£an una amplia variedad de tareas de cableado de conexi¢n.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('139'
   ,'1'
   ,'1'
   ,'Psychiatric Aide'
   ,'Psychiatric Aides'
   ,''
   ,'Assist mentally impaired or emotionally disturbed patients, working under direction of nursing and medical staff.  May assist with daily living activities, lead patients in educational and recreational activities, or accompany patients to and from examinations and treatments.  May restrain violent patients.  Includes psychiatric orderlies.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'31-1013'
   ,'Psychiatric Aides'
   ,'Assist mentally impaired or emotionally disturbed patients, working under direction of nursing and medical staff.  May assist with daily living activities, lead patients in educational and recreational activities, or accompany patients to and from examinations and treatments.  May restrain violent patients.  Includes psychiatric orderlies.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('139'
   ,'2'
   ,'2'
   ,'Psychiatric Aide'
   ,''
   ,''
   ,'Ayudan a pacientes que padecen trastornos mentales o disturbios emocionales trabajando bajo la direcci¢n de personal m‚dico y de enfermer¡a. Pueden ayudar a los pacientes a efectuar sus actividades de la vida cotidiana, guiarlos en actividades educativas o recreativas o acompa¤ar a los pacientes en el trayecto de ida y vuelta a sus ex menes y tratamientos. Pueden controlar f¡sicamente a los pacientes violentos. Incluye a los camilleros psiqui tricos.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('140'
   ,'1'
   ,'1'
   ,'Pipelayer'
   ,'Pipelayers'
   ,''
   ,'Lay pipe for storm or sanitation sewers, drains, and water mains.  Perform any combination of the following tasks: grade trenches or culverts, position pipe, or seal joints.  Excludes ?Welders, Cutters, Solderers, and Brazers"" (51-4121).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2151'
   ,'Pipelayers'
   ,'Lay pipe for storm or sanitation sewers, drains, and water mains.  Perform any combination of the following tasks: grade trenches or culverts, position pipe, or seal joints.  Excludes ?Welders, Cutters, Solderers, and Brazers"" (51-4121).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('140'
   ,'2'
   ,'2'
   ,'Pipelayer'
   ,''
   ,''
   ,'Colocan tuber¡as de sistemas de alcantarillado de aguas de lluvia o residuales, desag?es y abastecimiento de agua corriente. Desempe¤an cualquier combinaci¢n de las siguientes tareas: nivelar zanjas o alcantarillas, colocar tubos o sellar juntas. Excluye a los ?Soldadores, Cortadores, Esta¤adores y Soldadores de Lat¢n? (51-4121).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('141'
   ,'1'
   ,'1'
   ,'Nutritionist'
   ,'Nutritionists'
   ,''
   ,'Oh boy, if only we had one of you on staff. Attending to and advising on issues of diet and nutrition, you ensure your clients are feeding themselves a great chance at health. Find clients looking for consultations, your expert oversight, or your know-how for larger institutional projects.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'29-1031'
   ,'Dietitians and Nutritionists'
   ,'Plan and conduct food service or nutritional programs to assist in the promotion of health and control of disease.  May supervise activities of a department providing quantity food services, counsel individuals, or conduct nutritional research.'
   ,'True'
   ,'1'
   ,'Does broccoli tend to languish in the back of your fridge? Or maybe broccoli has never graced the back of your fridge in the first place? A nutritionist can help get you on track to great health through diet advice. Find the right professional to assess your current food habits and advise you on future ones, broccoli-laden or not.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('141'
   ,'2'
   ,'2'
   ,'Nutricionista'
   ,'Nutricionistas'
   ,''
   ,'Planifican y dirigen servicios de comidas o programas nutricionales para colaborar con la promoci¢n de la salud y control de enfermedades. Pueden supervisar las actividades de un departamento que provee servicio de comidas en cantidades, asesorar personas o realizar investigaci¢n sobre nutrici¢n.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('142'
   ,'1'
   ,'1'
   ,'Pavement Installer'
   ,'Pavement Installers'
   ,''
   ,'Operate equipment used for applying concrete, asphalt, or other materials to road beds, parking lots, or airport runways and taxiways, or equipment used for tamping gravel, dirt, or other materials.  Includes concrete and asphalt paving machine operators, form tampers, tamping machine operators, and stone spreader operators.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2071'
   ,'Paving, Surfacing, and Tamping Equipment Operators'
   ,'Operate equipment used for applying concrete, asphalt, or other materials to road beds, parking lots, or airport runways and taxiways, or equipment used for tamping gravel, dirt, or other materials.  Includes concrete and asphalt paving machine operators, form tampers, tamping machine operators, and stone spreader operators.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('142'
   ,'2'
   ,'2'
   ,'Pavement Installer'
   ,''
   ,''
   ,'Operan equipos para aplicar concreto, asfalto u otros materiales para formar la base para carreteras, lotes de estacionamiento o pistas de aterrizaje y despegue de los aeropuertos, u operan equipos para compactar gravilla, tierra u otros materiales. Incluye a los operadores de m quinas de pavimentaci¢n de concreto y asfalto, aplanadoras, compactadoras y a los operadores de m quinas esparcidoras de piedras.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('143'
   ,'1'
   ,'1'
   ,'Concrete Repairer'
   ,'Concrete Repairers'
   ,''
   ,'All construction and related workers not listed separately.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-4099'
   ,'Construction and Related Workers, All Other'
   ,'All construction and related workers not listed separately.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('143'
   ,'2'
   ,'2'
   ,'Concrete Repairer'
   ,''
   ,''
   ,'Todos los dem s trabajadores de la construcci¢n y trabajadores relacionados que no est n listados por separado.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('144'
   ,'1'
   ,'1'
   ,'Veterinarian'
   ,'Veterinarians'
   ,''
   ,'You keep our animal companions in tip-top shape and help out the ailing ones with expert care and advice. Find clients needing another set of hands and professional eyes towards their special friends.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'29-1131'
   ,'Veterinarians'
   ,'Diagnose, treat, or research diseases and injuries of animals.  Includes veterinarians who conduct research and development, inspect livestock, or care for pets and companion animals.'
   ,'True'
   ,'3'
   ,'Whatever the issue with Bessie or Bella, a trained veterinarian can lend valuable advice and assistance. Find the right one and get your animal companion back to driving you crazy. '
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('144'
   ,'2'
   ,'2'
   ,'Veterinario/a'
   ,'Veterinarios/as'
   ,''
   ,'Diagnostican, tratan o investigan enfermedades y lesiones de los animales. Incluye a los veterinarios que realizan tareas de investigaci¢n y desarrollo, inspeccionan ganado o atienden animales dom‚sticos o de compa¤¡a.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('145'
   ,'1'
   ,'1'
   ,'Clown'
   ,'Clowns'
   ,''
   ,'We''re not going to try to be funny, that''s your job. Find clients looking for your clowning expertise and accompanying hilarity for small parties or larger events.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-2099'
   ,'Entertainers and Performers, Sports and Related Workers, All Other'
   ,'All entertainers and performers, sports and related workers not listed separately.'
   ,'True'
   ,'2'
   ,'We could make a joke here, but that''s really a clown''s job. Find the perfect hilarious entertainer for anything from your child''s birthday party to a large corporate event.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('145'
   ,'2'
   ,'2'
   ,'Payaso/a'
   ,'Payasos/as'
   ,''
   ,'Todos los animadores, int‚rpretes art¡sticos, deportistas y trabajadores relacionados que no est n listados por separado.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('146'
   ,'1'
   ,'1'
   ,'Hypnotherapist'
   ,'Hypnotherapists'
   ,''
   ,'Bring your expertise to help clients determine the nature of their problem and, with your professional training, work with them to overcome what ails.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-2099'
   ,'Entertainers and Performers, Sports and Related Workers, All Other'
   ,'All entertainers and performers, sports and related workers not listed separately.'
   ,'True'
   ,'2'
   ,'Tried it all? Tried nothing? Find a hypnotherapist to work behind-the-scenes on whatever problem ails you.'
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('146'
   ,'2'
   ,'2'
   ,'Hipnotista'
   ,'Hipnotistas'
   ,''
   ,'Todos los animadores, int‚rpretes art¡sticos, deportistas y trabajadores relacionados que no est n listados por separado.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('147'
   ,'1'
   ,'1'
   ,'Magician'
   ,'Magicians'
   ,''
   ,'Work your magic at client birthday parties, office gatherings, coventions, and more. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-2099'
   ,'Entertainers and Performers, Sports and Related Workers, All Other'
   ,'All entertainers and performers, sports and related workers not listed separately.'
   ,'True'
   ,'2'
   ,'Booking a magician for your gathering (or maybe just personal enjoyment) is -- dare we say it -- as easy as waving a wand. '
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('147'
   ,'2'
   ,'2'
   ,'Mago/a'
   ,'Magos/as'
   ,''
   ,'Todos los animadores, int‚rpretes art¡sticos, deportistas y trabajadores relacionados que no est n listados por separado.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('148'
   ,'1'
   ,'1'
   ,'Psychic'
   ,'Psychics'
   ,''
   ,'All entertainers and performers, sports and related workers not listed separately.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-2099'
   ,'Entertainers and Performers, Sports and Related Workers, All Other'
   ,'All entertainers and performers, sports and related workers not listed separately.'
   ,'False'
   ,'2'
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('148'
   ,'2'
   ,'2'
   ,'Psychic'
   ,''
   ,''
   ,'Todos los animadores, int‚rpretes art¡sticos, deportistas y trabajadores relacionados que no est n listados por separado.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('149'
   ,'1'
   ,'1'
   ,'Astrologer'
   ,'Astrologers'
   ,''
   ,'All entertainers and performers, sports and related workers not listed separately.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-2099'
   ,'Entertainers and Performers, Sports and Related Workers, All Other'
   ,'All entertainers and performers, sports and related workers not listed separately.'
   ,'False'
   ,'2'
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('149'
   ,'2'
   ,'2'
   ,'AstrÛlogo/a'
   ,'AstrÛlogos/as'
   ,''
   ,'Todos los animadores, int‚rpretes art¡sticos, deportistas y trabajadores relacionados que no est n listados por separado.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('150'
   ,'1'
   ,'1'
   ,'Surveyor'
   ,'Surveyors'
   ,''
   ,'Make exact measurements and determine property boundaries.  Provide data relevant to the shape, contour, gravitation, location, elevation, or dimension of land or land features on or near the earth''s surface for engineering, mapmaking, mining, land evaluation, construction, and other purposes.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'17-1022'
   ,'Surveyors'
   ,'Make exact measurements and determine property boundaries.  Provide data relevant to the shape, contour, gravitation, location, elevation, or dimension of land or land features on or near the earth''s surface for engineering, mapmaking, mining, land evaluation, construction, and other purposes.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('150'
   ,'2'
   ,'2'
   ,'Encuestador/a'
   ,'Encuestadores/as'
   ,''
   ,'Efect£an mediciones precisas y determinan los l°mites perimetrales de las propiedades. Suministran datos pertinentes a la forma, contorno, gravitaci¢n, ubicaci¢n, altitud o dimensi¢n de terrenos o caracter°sticas del terreno en la superficie terrestre o locaci¢n cercana a la superficie terrestre con prop¢sitos de ingenier°a, cartograf°a, miner°a, evaluaci¢n de terrenos, construcci¢n y dem s.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('151'
   ,'1'
   ,'1'
   ,'Event Planner'
   ,'Event Planners'
   ,''
   ,'You know how to party in style -- or, rather, to let everyone else party in style while you efficiently pull strings in the background. Find clients looking for your expert eye and assistance in putting together the perfect soiree, get-together, party, convention, mingling, gathering, or anything else you''re likely great at organizing.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'13-1121'
   ,'Meeting, Convention, and Event Planners'
   ,'Coordinate activities of staff, convention personnel, or clients to make arrangements for group meetings, events, or conventions.'
   ,'True'
   ,'2'
   ,'These folks know how to party in style -- or, rather, to let other people party in style while they coolly pull strings in the background. Find the perfect event planner to wrangle things into place for your upcoming soiree/get-together/single-mingle/convention/anything!'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('151'
   ,'2'
   ,'2'
   ,'Planificador/a de Eventos'
   ,'Planificadores/as de Eventos'
   ,''
   ,'Coordinan las actividades de los miembros de un grupo de trabajo, personal de convenciones o de los clientes con el fin de hacer los arreglos necesarios para llevar a cabo reuniones de grupo, eventos o convenciones.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('152'
   ,'1'
   ,'1'
   ,'Wedding Planner'
   ,'Wedding Planners'
   ,''
   ,'Something old, something new, something borrowed, something YOU! You''re indispensible to any involved wedding planning operation. Find brides, their mothers, their fathers, grooms, their mothers, their fathers, or anyone else desperately seeking your assistance in making a great wedding truly perfect.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'13-1121'
   ,'Meeting, Convention, and Event Planners'
   ,'Coordinate activities of staff, convention personnel, or clients to make arrangements for group meetings, events, or conventions.'
   ,'True'
   ,'2'
   ,'A great wedding planner takes most of the stress out of, well, planning your wedding. We don''t suggest watching "The Wedding Planner," though, for an accurate portrayal of the profession. Find J. Lo''s real-life counterpart and start wrangling your wedding into glorious reality.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('152'
   ,'2'
   ,'2'
   ,'Wedding Planner'
   ,''
   ,''
   ,'Coordinan las actividades de los miembros de un grupo de trabajo, personal de convenciones o de los clientes con el fin de hacer los arreglos necesarios para llevar a cabo reuniones de grupo, eventos o convenciones.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('153'
   ,'1'
   ,'1'
   ,'Actor'
   ,'Actors'
   ,''
   ,'Play parts in stage, television, radio, video, motion picture productions, or other settings for entertainment, information, or instruction.  Interpret serious or comic role by speech, gesture, and body movement to entertain or inform audience.  May dance and sing.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-2011'
   ,'Actors'
   ,'Play parts in stage, television, radio, video, motion picture productions, or other settings for entertainment, information, or instruction.  Interpret serious or comic role by speech, gesture, and body movement to entertain or inform audience.  May dance and sing.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('153'
   ,'2'
   ,'2'
   ,'Actor/Actriz'
   ,'Actores/Actrices'
   ,''
   ,'Act£an roles en representaciones esc‚nicas, producciones de televisi¢n, radio, video y cine o en otras ambientaciones esc‚nicas con fines de entretenimiento, informaci¢n o instrucci¢n. Interpretan roles c¢micos o dram ticos actuando con la voz, gestos y movimiento del cuerpo para entretener o informar al p£blico. Tambi‚n pueden bailar o cantar.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('154'
   ,'1'
   ,'1'
   ,'AV Equipment Technician'
   ,'AV Equipment Technicians'
   ,''
   ,'Set up, or set up and operate audio and video equipment including microphones, sound speakers, video screens, projectors, video monitors, recording equipment, connecting wires and cables, sound and mixing boards, and related electronic equipment for concerts, sports events, meetings and conventions, presentations, and news conferences.  May also set up and operate associated spotlights and other custom lighting systems.  Excludes ""Sound Engineering Technicians"" (27-4014).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-4011'
   ,'Audio and Video Equipment Technicians'
   ,'Set up, or set up and operate audio and video equipment including microphones, sound speakers, video screens, projectors, video monitors, recording equipment, connecting wires and cables, sound and mixing boards, and related electronic equipment for concerts, sports events, meetings and conventions, presentations, and news conferences.  May also set up and operate associated spotlights and other custom lighting systems.  Excludes ""Sound Engineering Technicians"" (27-4014).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('154'
   ,'2'
   ,'2'
   ,'AV Equipment Technician'
   ,''
   ,''
   ,'Instalan, o instalan y operan equipos de audio y video, incluidos micr¢fonos, altavoces, pantallas de video, proyectores, monitores de video, equipos de grabaci¢n, cables y cableados de conexi¢n, consolas de sonido y de mezcla de sonido y equipos electr¢nicos relacionados para su utilizaci¢n en conciertos, eventos deportivos, reuniones, convenciones, presentaciones y conferencias de noticias. Tambi‚n pueden instalar y operar sistemas de focos reflectores e iluminaci¢n adaptados al tipo de evento. Excluye a los ?T‚cnicos de Ingenier¡a de Sonido? (27-4014).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('155'
   ,'1'
   ,'1'
   ,'Tailor'
   ,'Tailors'
   ,''
   ,'You, my friend, are both artist and mathematician. Flatter figures ''round the world by finding clients in need of everything from alteration to specially designed suits.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'51-6052'
   ,'Tailors, Dressmakers, and Custom Sewers'
   ,'Design, make, alter, repair, or fit garments.'
   ,'True'
   ,'2'
   ,'Cut a fine figure with an eagle-eyed tailor who can expertly execute everything from the tiniest alteration to designing a full-blown suit.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('155'
   ,'2'
   ,'2'
   ,'Sastre'
   ,'Sastres'
   ,''
   ,'Dise§an, confeccionan, modifican, arreglan o adaptan prendas de vestir.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('156'
   ,'1'
   ,'1'
   ,'Dressmaker'
   ,'Dressmakers'
   ,''
   ,'Sometimes, Macy''s just won''t cut it. Connect to customers needing your expertise in all things alteration, design, creating, and clothing consultation. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'51-6052'
   ,'Tailors, Dressmakers, and Custom Sewers'
   ,'Design, make, alter, repair, or fit garments.'
   ,'True'
   ,'2'
   ,'Need something taken in or a hem let out (we only kind of know what those things mean)? A great dressmaker can help out with alterations, design, creation, or just consultation.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('156'
   ,'2'
   ,'2'
   ,'Modisto/a'
   ,'Modistos/as'
   ,''
   ,'Dise§an, confeccionan, modifican, arreglan o adaptan prendas de vestir.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('157'
   ,'1'
   ,'1'
   ,'Window Installer'
   ,'Window Installers'
   ,''
   ,'Install glass in windows, skylights, store fronts, and display cases, or on surfaces, such as building fronts, interior walls, ceilings, and tabletops.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2121'
   ,'Glaziers'
   ,'Install glass in windows, skylights, store fronts, and display cases, or on surfaces, such as building fronts, interior walls, ceilings, and tabletops.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('157'
   ,'2'
   ,'2'
   ,'Instalador/a de Ventanas'
   ,'Instaladores/as de Ventanas'
   ,''
   ,'Instalan cristales en ventanas, claraboyas, frentes de negocios y vitrinas o en superficies planas, como por ejemplo, en los frentes de los edificios, paredes interiores, techos o superficies de mesas.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('158'
   ,'1'
   ,'1'
   ,'Solar Panel Installer'
   ,'Solar Panel Installers'
   ,''
   ,'Install glass in windows, skylights, store fronts, and display cases, or on surfaces, such as building fronts, interior walls, ceilings, and tabletops.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2121'
   ,'Glaziers'
   ,'Install glass in windows, skylights, store fronts, and display cases, or on surfaces, such as building fronts, interior walls, ceilings, and tabletops.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('158'
   ,'2'
   ,'2'
   ,'Solar Panel Installe'
   ,''
   ,''
   ,'Instalan cristales en ventanas, claraboyas, frentes de negocios y vitrinas o en superficies planas, como por ejemplo, en los frentes de los edificios, paredes interiores, techos o superficies de mesas.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('159'
   ,'1'
   ,'1'
   ,'Music Director'
   ,'Music Directors'
   ,''
   ,'Conduct, direct, plan, and lead instrumental or vocal performances by musical groups, such as orchestras, bands, choirs, and glee clubs.  Includes arrangers, composers, choral directors, and orchestrators.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-2041'
   ,'Music Directors and Composers'
   ,'Conduct, direct, plan, and lead instrumental or vocal performances by musical groups, such as orchestras, bands, choirs, and glee clubs.  Includes arrangers, composers, choral directors, and orchestrators.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('159'
   ,'2'
   ,'2'
   ,'Music Director'
   ,''
   ,''
   ,'Conducen, dirigen, planifican y lideran interpretaciones instrumentales o vocales de grupos musicales tales como orquestas, bandas, coros y grupos de m£sica coral. Incluye a los arregladores, compositores, directores de coros y orquestadores.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('160'
   ,'1'
   ,'1'
   ,'Music Composer'
   ,'Music Composers'
   ,''
   ,'Conduct, direct, plan, and lead instrumental or vocal performances by musical groups, such as orchestras, bands, choirs, and glee clubs.  Includes arrangers, composers, choral directors, and orchestrators.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-2041'
   ,'Music Directors and Composers'
   ,'Conduct, direct, plan, and lead instrumental or vocal performances by musical groups, such as orchestras, bands, choirs, and glee clubs.  Includes arrangers, composers, choral directors, and orchestrators.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('160'
   ,'2'
   ,'2'
   ,'Music Composer'
   ,''
   ,''
   ,'Conducen, dirigen, planifican y lideran interpretaciones instrumentales o vocales de grupos musicales tales como orquestas, bandas, coros y grupos de m£sica coral. Incluye a los arregladores, compositores, directores de coros y orquestadores.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('161'
   ,'1'
   ,'1'
   ,'Barber'
   ,'Barbers'
   ,''
   ,'We hope you''re riding the foamy wave of barber resurgence. Everywhere we look, we see impeccably barbered folks. Then we swoon. Keep riding the wave or spread the lather further by connecting to clients in need of your expert hands and trimming tools.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'39-5011'
   ,'Barbers'
   ,'Provide barbering services, such as cutting, trimming, shampooing, and styling hair, trimming beards, or giving shaves.'
   ,'True'
   ,'1'
   ,'Want to join the ranks of the impeccably barbered? Or maybe you just need a touch-up. A great barber can make all the difference between a hairy lout and a fine, upstanding gentleperson. '
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('161'
   ,'2'
   ,'2'
   ,'Barbero/a'
   ,'Barberos/as'
   ,''
   ,'Prestan servicios de barber°a, como por ejemplo cortar, lavar y peinar el cabello, recortar barbas o afeitar.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('162'
   ,'1'
   ,'1'
   ,'Upholsterer'
   ,'Upholsterers'
   ,''
   ,'Patch the hole in your customer base with more folks looking to give their furniture a makeover. Saving seats doesn''t always mean waiting for your theatre companion to come back from the bathroom. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'51-6093'
   ,'Upholsterers'
   ,'Make, repair, or replace upholstery for household furniture or transportation vehicles.'
   ,'True'
   ,'3'
   ,'Save your seats with help from an upholsterer with a trained eye for all things corners, fraying, wood, base, padding, arms…all that stuff we can''t pretend to really know about. Maybe you''re fixing a wicker stool or finally dealing with the old stains on the favorite family chair. Whatever the issue, there''s an expert to fix it.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('162'
   ,'2'
   ,'2'
   ,'Tapicero/a'
   ,'Tapiceros/as'
   ,''
   ,'Hacen, reparan o reemplazan tapizados de muebles de uso dom‚stico o de veh¡culos de transporte.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('163'
   ,'1'
   ,'1'
   ,'Furniture Repairer'
   ,'Furniture Repairers'
   ,''
   ,'You''ve probably seen it all -- rips, certainly, but also bugs, a wealth of loose change, unmentionable items, and questionable stains. Find clients needing repairs to their furniture, whether it''s some simple seat-saving or a complete upholstery overhaul.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'51-6093'
   ,'Upholsterers'
   ,'Make, repair, or replace upholstery for household furniture or transportation vehicles.'
   ,'True'
   ,'3'
   ,'A trained furniture repairperson has likely seen it all, plus more you don''t want to know about. Whatever your problem -- busted seats, outdated upholstery, questionable stains -- there''s the perfect person for the job.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('163'
   ,'2'
   ,'2'
   ,'Furniture Repairer'
   ,''
   ,''
   ,'Hacen, reparan o reemplazan tapizados de muebles de uso dom‚stico o de veh¡culos de transporte.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('164'
   ,'1'
   ,'1'
   ,'Jeweler'
   ,'Jewelers'
   ,''
   ,'Design, fabricate, adjust, repair, or appraise jewelry, gold, silver, other precious metals, or gems.  Includes diamond polishers and gem cutters, and persons who perform precision casting and modeling of molds, casting metal in molds, or setting precious and semi-precious stones for jewelry and related products.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'51-9071'
   ,'Jewelers and Precious Stone and Metal Workers'
   ,'Design, fabricate, adjust, repair, or appraise jewelry, gold, silver, other precious metals, or gems.  Includes diamond polishers and gem cutters, and persons who perform precision casting and modeling of molds, casting metal in molds, or setting precious and semi-precious stones for jewelry and related products.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('164'
   ,'2'
   ,'2'
   ,'Joyero/a'
   ,'Joyeros/as'
   ,''
   ,'Dise§an, fabrican, ajustan, reparan o tasan joyas, oro, plata y dem s gemas o metales preciosos. Incluye a los pulidores de diamantes y cortadores de gemas y a las personas que fabrican y forjan moldes de precisi¢n, que funden metales en los moldes o que engarzan piedras preciosas y semipreciosas para art°culos de joyer°a y relacionados.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('165'
   ,'1'
   ,'1'
   ,'Home Electronics Installer'
   ,'Home Electronics Installers'
   ,''
   ,'Repair, adjust, or install audio or television receivers, stereo systems, camcorders, video systems, or other electronic home entertainment equipment.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-2097'
   ,'Electronic Home Entertainment Equipment Installers and Repairers'
   ,'Repair, adjust, or install audio or television receivers, stereo systems, camcorders, video systems, or other electronic home entertainment equipment.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('165'
   ,'2'
   ,'2'
   ,'Home Electronics Installer'
   ,''
   ,''
   ,'Reparan, ajustan o instalan receptores de audio o televisi¢n, sistemas est‚reo, videoc maras, sistemas de video u otro equipo electr¢nico de entretenimiento en el hogar.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('166'
   ,'1'
   ,'1'
   ,'Home Electronics Repairer'
   ,'Home Electronics Repairers'
   ,''
   ,'You, my friend, are the savior of many an over-eager electronics buyer, frustrated grandmother, or, actually, any of us as we struggle to make sense of our increasingly online surroundings. Find clients in need of a consultation or regular old help getting their electronics back in working order. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-2097'
   ,'Electronic Home Entertainment Equipment Installers and Repairers'
   ,'Repair, adjust, or install audio or television receivers, stereo systems, camcorders, video systems, or other electronic home entertainment equipment.'
   ,'True'
   ,'3'
   ,'Mayday! Mayday! Whatever your seemingly doomed piece of electronic equipment is, there''s the right consultant for the task of bringing it back into repair. Over and out!'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('166'
   ,'2'
   ,'2'
   ,'Home Electronics Repairer'
   ,''
   ,''
   ,'Reparan, ajustan o instalan receptores de audio o televisi¢n, sistemas est‚reo, videoc maras, sistemas de video u otro equipo electr¢nico de entretenimiento en el hogar.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('167'
   ,'1'
   ,'1'
   ,'Carpet Installer'
   ,'Carpet Installers'
   ,''
   ,'Without you, our feet would be cold, dirty, and in even more discomfort than they already are. Find clients looking to cushion their existence with some primo carpeting laid out and secured by your one-and-only expertise.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2041'
   ,'Carpet Installers'
   ,'Lay and install carpet from rolls or blocks on floors.  Install padding and trim flooring materials.  Excludes ?Floor Layers, Except Carpet, Wood, and Hard Tiles"" (47-2042).'
   ,'True'
   ,'3'
   ,'Ah, a world without carpet. What a sad, cold, dirty, uncomfortable, un-rollable-on-the-living-room-floor type of world. Add some padding to your daily existence with help from a trained carpet-laying professional.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('167'
   ,'2'
   ,'2'
   ,'Carpet Installer'
   ,''
   ,''
   ,'Colocan e instalan alfombras en rollo o en paneles individuales sobre los pisos. Instalan materiales acolchados bajo las alfombras y recortan los materiales utilizados para revestir pisos. Excluye a los ?Instaladores de Pisos, Excepto Alfombras, Pisos de Madera y Losas? (47-2042).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('168'
   ,'1'
   ,'1'
   ,'Translator'
   ,'Translators'
   ,''
   ,'Bring your careful thought and years-in-the-making expertise in language to clients needing translation help.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-3091'
   ,'Interpreters and Translators'
   ,'Interpret oral or sign language, or translate written text from one language into another.'
   ,'True'
   ,'1'
   ,'Somewhere out there lies a translator for nearly every language. Find the right one for your project or just to tell you how to say things in the language of your choix (that’s French for "choice").'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('168'
   ,'2'
   ,'2'
   ,'Traductor/a'
   ,'Traductores/as'
   ,''
   ,'Interpretan idiomas verbales o de se§as, o traducen textos escritos de un idioma a otro.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('169'
   ,'1'
   ,'1'
   ,'Home Appliance Repairer'
   ,'Home Appliance Repairers'
   ,''
   ,'Many of us view a refrigerator on the fritz as a ticking time bomb. Hour three -- there goes the yogurt! Find yogurt-lovers and just ordinary people in desperate need of your home appliance expertise.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-9031'
   ,'Home Appliance Repairers'
   ,'Repair, adjust, or install all types of electric or gas household appliances, such as refrigerators, washers, dryers, and ovens.'
   ,'True'
   ,'3'
   ,'Many of us view a refrigerator on the fritz as a ticking time bomb. Hour three -- there goes the yogurt! Prevent such catastrophes and more with help from a knowledgeable home appliance repairperson.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('169'
   ,'2'
   ,'2'
   ,'Home Appliance Repairer'
   ,''
   ,''
   ,'Reparan, ajustan o instalan todo tipo de equipo dom‚stico el‚ctrico o de gas, tales como refrigeradores, lavadoras, secadoras de ropa y hornos.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('170'
   ,'1'
   ,'1'
   ,'Chiropractor'
   ,'Chiropractors'
   ,''
   ,'We''re sure you''ve endured many, many puns about all things spine-related, so we''ll get back on track -- find clients in need of your bodily expertise.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'29-1011'
   ,'Chiropractors'
   ,'Assess, treat, and care for patients by manipulation of spine and musculoskeletal system.  May provide spinal adjustment or address sacral or pelvic misalignment.'
   ,'True'
   ,'2'
   ,'Get your back back on track with help from a trained chiropractor well-versed in the muscle, bone, and tendon woes of that spot you just can''t reach. '
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('170'
   ,'2'
   ,'2'
   ,'Quiropr·ctico/a'
   ,'Quiropr·cticos/as'
   ,''
   ,'Eval£an, tratan y atienden pacientes por medio de la manipulaci¢n de la columna vertebral, del sistema muscular y del sistema ¢seo. Pueden efectuar ajustes de la columna vertebral o tratar la desalineaci¢n de los huesos de la regi¢n del sacro o la pelvis.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('171'
   ,'1'
   ,'1'
   ,'Plasterer'
   ,'Plasterers'
   ,''
   ,'Apply interior or exterior plaster, cement, stucco, or similar materials.  May also set ornamental plaster. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2161'
   ,'Plasterers and Stucco Masons'
   ,'Apply interior or exterior plaster, cement, stucco, or similar materials.  May also set ornamental plaster. '
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('171'
   ,'2'
   ,'2'
   ,'Plasterer'
   ,''
   ,''
   ,'Aplican yeso, cemento, estuco o materiales similares en superficies interiores y exteriores. Tambi‚n pueden aplicar yeso ornamental.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('172'
   ,'1'
   ,'1'
   ,'Stucco Mason'
   ,'Stucco Masons'
   ,''
   ,'Apply interior or exterior plaster, cement, stucco, or similar materials.  May also set ornamental plaster. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2161'
   ,'Plasterers and Stucco Masons'
   ,'Apply interior or exterior plaster, cement, stucco, or similar materials.  May also set ornamental plaster. '
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('172'
   ,'2'
   ,'2'
   ,'Stucco Mason'
   ,''
   ,''
   ,'Aplican yeso, cemento, estuco o materiales similares en superficies interiores y exteriores. Tambi‚n pueden aplicar yeso ornamental.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('173'
   ,'1'
   ,'1'
   ,'Technical Writer'
   ,'Technical Writers'
   ,''
   ,'Write technical materials, such as equipment manuals, appendices, or operating and maintenance instructions.  May assist in layout work.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-3042'
   ,'Technical Writers'
   ,'Write technical materials, such as equipment manuals, appendices, or operating and maintenance instructions.  May assist in layout work.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('173'
   ,'2'
   ,'2'
   ,'Technical Writer'
   ,''
   ,''
   ,'Escriben materiales t‚cnicos tales como manuales de equipos, ap‚ndices, o instrucciones de operaci¢n y mantenimiento. Pueden colaborar con tareas de formato.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('174'
   ,'1'
   ,'1'
   ,'Animal Trainer'
   ,'Animal Trainers'
   ,''
   ,'Train animals for riding, harness, security, performance, or obedience, or assisting persons with disabilities.  Accustom animals to human voice and contact; and condition animals to respond to commands.  Train animals according to prescribed standards for show or competition.  May train animals to carry pack loads or work as part of pack team.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'39-2011'
   ,'Animal Trainers'
   ,'Train animals for riding, harness, security, performance, or obedience, or assisting persons with disabilities.  Accustom animals to human voice and contact; and condition animals to respond to commands.  Train animals according to prescribed standards for show or competition.  May train animals to carry pack loads or work as part of pack team.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('174'
   ,'2'
   ,'2'
   ,'Adiestrador/a de Animales'
   ,'Adiestradores/as de Animales'
   ,''
   ,'Entrenan animales para montar, uso de arneses, seguridad, desempe§o u obediencia, o con el fin de ayudar a personas con discapacidades. Acostumbran a los animales al contacto con las personas y la voz humana y condicionan a los animales para responder a las ¢rdenes impartidas. Entrenan animales de acuerdo a las normas prescritas para exhibiciones o competencias. Pueden adiestrar animales para acarrear cargas o como parte de un grupo de animales.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('175'
   ,'1'
   ,'1'
   ,'Private Investigator'
   ,'Private Investigators'
   ,''
   ,'Gather, analyze, compile and report information regarding individuals or organizations to clients, or detect occurrences of unlawful acts or infractions of rules in private establishment. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'33-9021'
   ,'Private Detectives and Investigators'
   ,'Gather, analyze, compile and report information regarding individuals or organizations to clients, or detect occurrences of unlawful acts or infractions of rules in private establishment. '
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('175'
   ,'2'
   ,'2'
   ,'Investigador/a Privado/a'
   ,'Investigadores/as Privados/as'
   ,''
   ,'Re£nen, analizan y compilan informaci¢n sobre individuos u organizaciones y se la reportan a sus clientes, o detectan incidentes que involucran actos ilegales o infracciones de las reglas dentro de un establecimiento privado.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('176'
   ,'1'
   ,'1'
   ,'Tree Trimmer'
   ,'Tree Trimmers'
   ,''
   ,'As much time as we spent climbing trees as kids, we''re surprised we don''t have your job (and we often envy you from our office). Find clients needing your particular brand of careful, knowledgeable tree trimming.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'37-3013'
   ,'Tree Trimmers and Pruners'
   ,'Using sophisticated climbing and rigging techniques, cut away dead or excess branches from trees or shrubs to maintain right-of-way for roads, sidewalks, or utilities, or to improve appearance, health, and value of tree.  Prune or treat trees or shrubs using handsaws, hand pruners, clippers, and power pruners.  Works off the ground in the tree canopy and may use truck-mounted lifts.  Excludes workers who primarily perform duties of "Pesticide Handlers, Sprayers, and Applicators, Vegetation" (37-3012) and "Landscaping and Groundskeeping Workers" (37-3011).'
   ,'True'
   ,'3'
   ,'Sometimes, staring out of our office windows, we''d like to spend a day in a tree trimmer''s shoes. Ah, to be young again, in the canopy of a great old tree, just you and the leaves. Etcetera, etcetera. Find the perfect, nonchildlike tree-trimmer sure to get your boughs back in order.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('176'
   ,'2'
   ,'2'
   ,'Tree Trimmer'
   ,''
   ,''
   ,'Cortan ramas muertas o ramas excedentes de  rboles o arbustos trepando utilizando sofisticados aparejos de ascenso y balanceo para mantener despejado el acceso de paso de caminos, aceras, postes de cables o aparatos de suministro de servicios p£blicos, o para mejorar el aspecto, salud o valor de un  rbol. Podan o tratan  rboles o arbustos utilizando sierras de mano, podadoras manuales, cortadoras y podadoras el‚ctricas. Realizan trabajos en la copa de los  rboles y pueden utilizar elevadores montados en camiones. Excluye a los trabajadores que se dedican principalmente a las tareas desempe¤adas por los ?Operadores, Fumigadores y Aplicadores de Pesticidas, Vegetaci¢n? (37-3012) y por los ?Trabajadores de Jardiner¡a y ?reas Verdes? (37-3011).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('177'
   ,'1'
   ,'1'
   ,'Valve Installer'
   ,'Valve Installers'
   ,''
   ,'Install, repair, and maintain mechanical regulating and controlling devices, such as electric meters, gas regulators, thermostats, safety and flow valves, and other mechanical governors.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-9012'
   ,'Control and Valve Installers and Repairers, Except Mechanical Door'
   ,'Install, repair, and maintain mechanical regulating and controlling devices, such as electric meters, gas regulators, thermostats, safety and flow valves, and other mechanical governors.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('177'
   ,'2'
   ,'2'
   ,'Valve Installer'
   ,''
   ,''
   ,'Instalan, reparan y mantienen dispositivos mec nicos de regulaci¢n y control, como por ejemplo medidores de electricidad, reguladores de gas, termostatos, v lvulas de seguridad o de flujo, y dem s mecanismos de control.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('178'
   ,'1'
   ,'1'
   ,'Control Repairer'
   ,'Control Repairers'
   ,''
   ,'Install, repair, and maintain mechanical regulating and controlling devices, such as electric meters, gas regulators, thermostats, safety and flow valves, and other mechanical governors.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-9012'
   ,'Control and Valve Installers and Repairers, Except Mechanical Door'
   ,'Install, repair, and maintain mechanical regulating and controlling devices, such as electric meters, gas regulators, thermostats, safety and flow valves, and other mechanical governors.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('178'
   ,'2'
   ,'2'
   ,'Control Repairer'
   ,''
   ,''
   ,'Instalan, reparan y mantienen dispositivos mec nicos de regulaci¢n y control, como por ejemplo medidores de electricidad, reguladores de gas, termostatos, v lvulas de seguridad o de flujo, y dem s mecanismos de control.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('179'
   ,'1'
   ,'1'
   ,'Esthetician'
   ,'Estheticians'
   ,'Aesthetician, Beutician, Skincare'
   ,'Where were you when we were in high school?! Consult with clients to provide expert advice and treatment on hair, skin, and beyond. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'39-5094'
   ,'Skincare Specialists'
   ,'Provide skincare treatments to face and body to enhance an individual?s appearance.  Includes electrologists and laser hair removal specialists.'
   ,'True'
   ,'1'
   ,'Fix everything from a hangnail to a pimple patch to a hair-raising hair problem with the expert help of a trained esthetician. Where were these people when we were in high school?'
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('179'
   ,'2'
   ,'2'
   ,'Skincare Specialist'
   ,''
   ,''
   ,'Hacen tratamientos para el cuidado de la piel, tanto faciales como corporales, para mejorar la apariencia personal. Incluye a los especialistas de depilaci¢n con sistema l ser y electr¢lisis.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('180'
   ,'1'
   ,'1'
   ,'Fence Erector'
   ,'Fence Erectors'
   ,''
   ,'Erect and repair fences and fence gates, using hand and power tools.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-4031'
   ,'Fence Erectors'
   ,'Erect and repair fences and fence gates, using hand and power tools.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('180'
   ,'2'
   ,'2'
   ,'Fence Erector'
   ,''
   ,''
   ,'Erigen y reparan cercos y entradas de cercos utilizando herramientas manuales y de motor.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('181'
   ,'1'
   ,'1'
   ,'Fence Repairer'
   ,'Fence Repairers'
   ,''
   ,'Erect and repair fences and fence gates, using hand and power tools.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-4031'
   ,'Fence Erectors'
   ,'Erect and repair fences and fence gates, using hand and power tools.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('181'
   ,'2'
   ,'2'
   ,'Fence Repairer'
   ,''
   ,''
   ,'Erigen y reparan cercos y entradas de cercos utilizando herramientas manuales y de motor.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('182'
   ,'1'
   ,'1'
   ,'Career Counselor'
   ,'Career Counselors'
   ,''
   ,'Not only do you get folks back on track, you help them determine what the tracks are in the first place. Find clients in need of your adult, knowledgeable advice on all things future-related.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'21-1019'
   ,'Counselors, All Other'
   ,'All counselors not listed separately.'
   ,'True'
   ,'3'
   ,'Not only does a career counselor help you get back on track, they''ll help you figure out what that track is in the first place. Find the perfect professional to help you determine all things future-related.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('182'
   ,'2'
   ,'2'
   ,'Career Counselor'
   ,''
   ,''
   ,'Todos los consejeros que no est n listados por separado.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('183'
   ,'1'
   ,'1'
   ,'Decorative Painter'
   ,'Decorative Painters'
   ,''
   ,'Not deterred by that awful story about Van Gogh and his ear, you went ahead and made painting your profession, bringing color, artistry, and creativity to any object handed your way. Find clients interested in your particular style and approach. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'51-9123'
   ,'Painting, Coating, and Decorating Workers'
   ,'Paint, coat, or decorate articles, such as furniture, glass, plateware, pottery, jewelry, toys, books, or leather.  Excludes “Artists and Related Workers" (27-1010), "Designers" (27-1020), "Photographic Process Workers and Processing Machine Operators" (51-9151), and "Etchers and Engravers" (51-9194).'
   ,'True'
   ,'1'
   ,'Not deterred by that awful story about Van Gogh and his ear, these folks went ahead and made painting their profession. Find the perfect artist to bring color, consideration, and composition to your project. '
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('183'
   ,'2'
   ,'2'
   ,'Decorative Painter'
   ,''
   ,''
   ,'Pintan, esmaltan o decoran muebles, art°culos de vidrio, vajilla, cer mica, joyas, juguetes, libros o cuero. Excluye a los ?Artistas y Trabajadores Relacionados? (27-1010), ?Dise§adores? (27-1020), ?Trabajadores de Proceso Fotogr fico y Operadores de M quina de Procesamiento Fotogr fico? (51-9151) y a los ?Grabadores y Talladores? (51-9194).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('184'
   ,'1'
   ,'1'
   ,'Credit Counselor'
   ,'Credit Counselors'
   ,''
   ,'Advise and educate individuals or organizations on acquiring and managing debt.  May provide guidance in determining the best type of loan and explaining loan requirements or restrictions.  May help develop debt management plans, advise on credit issues, or provide budget, mortgage, and bankruptcy counseling. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'13-2071'
   ,'Credit Counselors'
   ,'Advise and educate individuals or organizations on acquiring and managing debt.  May provide guidance in determining the best type of loan and explaining loan requirements or restrictions.  May help develop debt management plans, advise on credit issues, or provide budget, mortgage, and bankruptcy counseling. '
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('184'
   ,'2'
   ,'2'
   ,'Credit Counselor'
   ,''
   ,''
   ,'Asesoran e instruyen a individuos y organizaciones sobre temas relacionados con el endeudamiento y el manejo de deudas. Pueden brindar orientaci¢n a sus clientes para ayudarlos a determinar el tipo de pr‚stamo que mejor se adapta a sus situaciones particulares y explicar los requisitos o restricciones de pr‚stamo. Pueden ayudar a desarrollar planes de administraci¢n de deuda, pueden asesorar sobre temas crediticios o dar asesoramiento sobre presupuesto, hipotecas y bancarrota.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('185'
   ,'1'
   ,'1'
   ,'Chinese Medicine Practitioner'
   ,'Chinese Medicine Practitioners'
   ,'Acupunturist,
 Acupuncture,
 Herbalist,
 Qigong,
 herbal medicine,
 medical massage,
Chinese medicine
Traditional Chinese medicine,
TCM'
   ,'An expert in the art,
 science,
 and practice of Chinese medicine (acupunture, medical qigong, medical massage, herbalism)? Find clients in need of your help.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'29-1129'
   ,'Therapists, All Other'
   ,'All therapists not listed separately.'
   ,'True'
   ,'1'
   ,'Maybe some attention to your Qi,
 meridians,
 and energy flow is just what the doctor ordered. Find a great,
 thoughtful Chinese Medicine professional sure to hit the spot.'
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('185'
   ,'2'
   ,'2'
   ,'Acupunturista'
   ,'Acupunturistas'
   ,''
   ,'Todos los dem s terapistas que no est n listados por separado.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('186'
   ,'1'
   ,'1'
   ,'Life Coach'
   ,'Life Coaches'
   ,''
   ,'After you''re done with your next client, would you mind giving us a call? Most people need a little help, and you''re there to provide it, whether its with setting goals, achieving them, or just getting back on track.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'29-1129'
   ,'Therapists, All Other'
   ,'All therapists not listed separately.'
   ,'True'
   ,'1'
   ,'Maybe you''re run off-track or haven''t yelled "GOAL!" in a while. Good news: life coaches exist solely to help you start running (towards the goal) again.'
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('186'
   ,'2'
   ,'2'
   ,'Life Coach'
   ,''
   ,''
   ,'Todos los dem s terapistas que no est n listados por separado.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('187'
   ,'1'
   ,'1'
   ,'Farm Equipment Mechanic'
   ,'Farm Equipment Mechanics'
   ,''
   ,'Diagnose, adjust, repair, or overhaul farm machinery and vehicles, such as tractors, harvesters, dairy equipment, and irrigation systems.  Excludes ?Bus and Truck Mechanics and Diesel Engine Specialists"" (49-3031).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-3041'
   ,'Farm Equipment Mechanics and Service Technicians'
   ,'Diagnose, adjust, repair, or overhaul farm machinery and vehicles, such as tractors, harvesters, dairy equipment, and irrigation systems.  Excludes ?Bus and Truck Mechanics and Diesel Engine Specialists"" (49-3031).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('187'
   ,'2'
   ,'2'
   ,'Farm Equipment Mechanic'
   ,''
   ,''
   ,'Diagnostican desperfectos, ajustan, reparan o reacondicionan maquinaria y veh°culos agr°colas, tales como tractores, cosechadoras, equipo de vaquer°a y sistemas de irrigaci¢n. Excluye a los ?Mec nicos de Autobuses y Camiones y Especialistas en Motores Diesel? (49-3031).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('188'
   ,'1'
   ,'1'
   ,'Funeral Service Manager'
   ,'Funeral Service Managers'
   ,''
   ,'Plan, direct, or coordinate the services or resources of funeral homes.  Includes activities such as determining prices for services or merchandise and managing the facilities of funeral homes.  Excludes ?Morticians, Undertakers, and Funeral Directors? (39-4031).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'11-9061'
   ,'Funeral Service Managers'
   ,'Plan, direct, or coordinate the services or resources of funeral homes.  Includes activities such as determining prices for services or merchandise and managing the facilities of funeral homes.  Excludes ?Morticians, Undertakers, and Funeral Directors? (39-4031).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('188'
   ,'2'
   ,'2'
   ,'Funeral Service Manager'
   ,''
   ,''
   ,'Planifican, dirigen o coordinan los servicios o recursos de las funerarias. Sus funciones incluyen actividades tales como la determinaci¢n de los precios de los servicios o mercader°as y la gesti¢n de las instalaciones de las funerarias. Excluye a los ?Enterradores, Sepultureros y Directores de Ceremonias F£nebres? (39-4031).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('189'
   ,'1'
   ,'1'
   ,'Mechanical Insulation Worker'
   ,'Mechanical Insulation Workers'
   ,''
   ,'Apply insulating materials to pipes or ductwork, or other mechanical systems in order to help control and maintain temperature.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2132'
   ,'Insulation Workers, Mechanical'
   ,'Apply insulating materials to pipes or ductwork, or other mechanical systems in order to help control and maintain temperature.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('189'
   ,'2'
   ,'2'
   ,'Mechanical Insulation Worker'
   ,''
   ,''
   ,'Aplican materiales aislantes en tuber°as, conductos u otros sistemas mec nicos para ayudar a controlar y mantener la temperatura.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('190'
   ,'1'
   ,'1'
   ,'Outdoor Power Equipment Repairer'
   ,'Outdoor Power Equipment Repairers'
   ,''
   ,'Diagnose, adjust, repair, or overhaul small engines used to power lawn mowers, chain saws, recreational sporting equipment and related equipment.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-3053'
   ,'Outdoor Power Equipment and Other Small Engine Mechanics'
   ,'Diagnose, adjust, repair, or overhaul small engines used to power lawn mowers, chain saws, recreational sporting equipment and related equipment.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('190'
   ,'2'
   ,'2'
   ,'Outdoor Power Equipment Repairer'
   ,''
   ,''
   ,'Diagnostican desperfectos, ajustan, reparan y reacondicionan motores peque¤os utilizados en cortadoras de c‚sped, sierras, equipo deportivo de recreaci¢n y otro equipo relacionado.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('191'
   ,'1'
   ,'1'
   ,'Iron Worker'
   ,'Iron Workers'
   ,''
   ,'Position and secure steel bars or mesh in concrete forms in order to reinforce concrete.  Use a variety of fasteners, rod-bending machines, blowtorches, and hand tools.  Includes rod busters.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2171'
   ,'Reinforcing Iron and Rebar Workers'
   ,'Position and secure steel bars or mesh in concrete forms in order to reinforce concrete.  Use a variety of fasteners, rod-bending machines, blowtorches, and hand tools.  Includes rod busters.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('191'
   ,'2'
   ,'2'
   ,'Iron Worker'
   ,''
   ,''
   ,'Colocan y aseguran barras de acero o mallas met licas en estructuras de concreto como refuerzo. Utilizan una variedad de mecanismos de sujeci¢n, m quinas para doblar varillas de metal, sopletes de soldar y herramientas manuales. Incluye a los colocadores de varillas de encofrado.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('192'
   ,'1'
   ,'1'
   ,'Insulation Installer'
   ,'Insulation Installers'
   ,''
   ,'Line and cover structures with insulating materials.  May work with batt, roll, or blown insulation materials.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2131'
   ,'Insulation Workers, Floor, Ceiling, and Wall'
   ,'Line and cover structures with insulating materials.  May work with batt, roll, or blown insulation materials.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('192'
   ,'2'
   ,'2'
   ,'Insulation Installer'
   ,''
   ,''
   ,'Instalan materiales aislantes utilizados para revestir y recubrir estructuras. Pueden trabajar con materiales aislantes en listones, rollos o en aerosol.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('193'
   ,'1'
   ,'1'
   ,'Psychotherapist'
   ,'Psychotherapists'
   ,''
   ,'Essential to keeping our world happy and healthy, you diagnose and help treat a wide variety of mental and emotional disorders. Find clients who need and want your specific expertise. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'21-1013'
   ,'Marriage and Family Therapists'
   ,'Diagnose and treat mental and emotional disorders, whether cognitive, affective, or behavioral, within the context of marriage and family systems.  Apply psychotherapeutic and family systems theories and techniques in the delivery of services to individuals, couples, and families for the purpose of treating such diagnosed nervous and mental disorders.  Excludes ?Social Workers"" (21-1021 through 21-1029) and ""Psychologists"" of all types (19-3031 through 19-3039).'
   ,'True'
   ,'1'
   ,'Take a deep breath and find you or your relative a trained professional to listen, diagnose, and treat your ills.'
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('193'
   ,'2'
   ,'2'
   ,'Marriage Therapist'
   ,''
   ,''
   ,'Diagnostican y tratan trastornos mentales y emocionales, ya sean cognitivos, afectivos o de comportamiento, dentro del contexto matrimonial o familiar. Aplican teor¡as y t‚cnicas de los sistemas psicoterap‚utico y familiar prestando servicio a individuos, parejas y familias con el fin de tratar los trastornos nerviosos y mentales diagnosticados. Excluye a los ?Trabajadores Sociales? (desde c¢digo 21-1021 hasta c¢digo 21-1029) y a los ?Psic¢logos? de todo tipo (desde c¢digo 19-3031 hasta c¢digo 19-3039).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('194'
   ,'1'
   ,'1'
   ,'Family Therapist'
   ,'Family Therapists'
   ,''
   ,'Diagnose and treat mental and emotional disorders, whether cognitive, affective, or behavioral, within the context of marriage and family systems.  Apply psychotherapeutic and family systems theories and techniques in the delivery of services to individuals, couples, and families for the purpose of treating such diagnosed nervous and mental disorders.  Excludes ?Social Workers"" (21-1021 through 21-1029) and ""Psychologists"" of all types (19-3031 through 19-3039).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'21-1013'
   ,'Marriage and Family Therapists'
   ,'Diagnose and treat mental and emotional disorders, whether cognitive, affective, or behavioral, within the context of marriage and family systems.  Apply psychotherapeutic and family systems theories and techniques in the delivery of services to individuals, couples, and families for the purpose of treating such diagnosed nervous and mental disorders.  Excludes ?Social Workers"" (21-1021 through 21-1029) and ""Psychologists"" of all types (19-3031 through 19-3039).'
   ,'False'
   ,'1'
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('194'
   ,'2'
   ,'2'
   ,'Family Therapist'
   ,''
   ,''
   ,'Diagnostican y tratan trastornos mentales y emocionales, ya sean cognitivos, afectivos o de comportamiento, dentro del contexto matrimonial o familiar. Aplican teor¡as y t‚cnicas de los sistemas psicoterap‚utico y familiar prestando servicio a individuos, parejas y familias con el fin de tratar los trastornos nerviosos y mentales diagnosticados. Excluye a los ?Trabajadores Sociales? (desde c¢digo 21-1021 hasta c¢digo 21-1029) y a los ?Psic¢logos? de todo tipo (desde c¢digo 19-3031 hasta c¢digo 19-3039).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('195'
   ,'1'
   ,'1'
   ,'Landscape Architect'
   ,'Landscape Architects'
   ,''
   ,'Ah, scaping the land. Well, shaping the land, really, and designing all sorts of features in a quest to mold our physical environment into something artistic, pleasing, provocative, meditative, or any other adjective. Your palette is at once blank and gargantuan, and clients are looking for your trained eye and expertise in transforming their surroundings. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'17-1012'
   ,'Landscape Architects'
   ,'Plan and design land areas for projects such as parks and other recreational facilities, airports, highways, hospitals, schools, land subdivisions, and commercial, industrial, and residential sites.'
   ,'True'
   ,'3'
   ,'A great landscape architect will realize your hopes for your physical environment, whether you''d like to be surrounded by something meditative, provocative, watery, dry, artistic, subtle, or, well, any other adjective, really. Find the perfect person for anything from a consultation to full-blown design and implementation. '
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('195'
   ,'2'
   ,'2'
   ,'Landscape Architect'
   ,''
   ,''
   ,'Planifican y dise§an  reas de terreno para proyectos tales como parques y otros espacios recreativos, aeropuertos, autopistas, hospitales, escuelas, subdivisiones de terreno, y locales comerciales, industriales y residenciales.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('196'
   ,'1'
   ,'1'
   ,'Furniture Finisher'
   ,'Furniture Finishers'
   ,''
   ,'We talk about polishing off the last donut, you talk about polishing up a piece of used or new furniture. Find clients looking for your help in all things treatment, varnishing, and polishing of furniture.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'51-7021'
   ,'Furniture Finishers'
   ,'Shape, finish, and refinish damaged, worn, or used furniture or new high-grade furniture to specified color or finish.'
   ,'True'
   ,'3'
   ,'While some of us speak of polishing off the last donut, these folks speak of polishing up a great old chair. Find the perfect expert in all things furnitute finishing, varnishing, polishing, and more.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('196'
   ,'2'
   ,'2'
   ,'Furniture Finisher'
   ,''
   ,''
   ,'Arman, terminan y lustran muebles da§ados, desgastados o usados o muebles nuevos de primera calidad para darle un color o acabado espec°fico.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('197'
   ,'1'
   ,'1'
   ,'Camera Operator'
   ,'Camera Operators'
   ,''
   ,'Operate television, video, or motion picture camera to record images or scenes for various purposes, such as TV broadcasts, advertising, video production, or motion pictures.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-4031'
   ,'Camera Operators, Television, Video, and Motion Picture'
   ,'Operate television, video, or motion picture camera to record images or scenes for various purposes, such as TV broadcasts, advertising, video production, or motion pictures.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('197'
   ,'2'
   ,'2'
   ,'Camera Operator'
   ,''
   ,''
   ,'Operan c maras de televisi¢n, video o cine para grabar im genes o escenas con diversos prop¢sitos, como por ejemplo emisiones de TV, publicidades, producciones de video o pel°culas cinematogr ficas.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('198'
   ,'1'
   ,'1'
   ,'Videographer'
   ,'Videographers'
   ,''
   ,'Operate television, video, or motion picture camera to record images or scenes for various purposes, such as TV broadcasts, advertising, video production, or motion pictures.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-4031'
   ,'Camera Operators, Television, Video, and Motion Picture'
   ,'Operate television, video, or motion picture camera to record images or scenes for various purposes, such as TV broadcasts, advertising, video production, or motion pictures.'
   ,'True'
   ,NULL
   ,''
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('198'
   ,'2'
   ,'2'
   ,'Videographer'
   ,''
   ,''
   ,'Operan c maras de televisi¢n, video o cine para grabar im genes o escenas con diversos prop¢sitos, como por ejemplo emisiones de TV, publicidades, producciones de video o pel°culas cinematogr ficas.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('199'
   ,'1'
   ,'1'
   ,'Septic Cleaner'
   ,'Septic Cleaners'
   ,''
   ,'You probably get all sorts of cracks about doing the dirty work, so we won''t indulge in any of that. Sure, it''s not too glamorous, but you''re sure appreciated for your expertise, trained approach, and know-how when it comes to septic tanks and sewer systems. Find clients needing consultations, general assistance, or precise repairs.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-4071'
   ,'Septic Tank Servicers and Sewer Pipe Cleaners'
   ,'Clean and repair septic tanks, sewer lines, or drains.  May patch walls and partitions of tank, replace damaged drain tile, or repair breaks in underground piping.'
   ,'True'
   ,'3'
   ,'You''re pretty much guaranteed to find a septic tank or sewer system expert -- this ain''t a job for dilly-dalliers. Find the right professional for anything from septic consultation to thoughtful repair.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('199'
   ,'2'
   ,'2'
   ,'Septic Cleaner'
   ,''
   ,''
   ,'Limpian y reparan tanques s‚pticos, l¡neas de alcantarillas o desag?es. Pueden reparar las paredes y divisiones de tanques, reemplazar azulejos de drenaje averiados o reparar roturas de ca¤er¡as subterr neas.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('200'
   ,'1'
   ,'1'
   ,'Film and Video Editor'
   ,'Film and Video Editors'
   ,''
   ,'Edit moving images on film, video, or other media.  May edit or synchronize soundtracks with images.  Excludes ?Sound Engineering Technicians?(27-4014).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-4032'
   ,'Film and Video Editors'
   ,'Edit moving images on film, video, or other media.  May edit or synchronize soundtracks with images.  Excludes ?Sound Engineering Technicians?(27-4014).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('200'
   ,'2'
   ,'2'
   ,'Film and Video Editor'
   ,''
   ,''
   ,'Editan im genes de pel¡culas cinematogr ficas, video u otro medio de grabaci¢n de im genes. Pueden editar o sincronizar las bandas de sonido con las im genes. Excluye a los ?T‚cnicos de Ingenier¡a de Sonido? (27-4014).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('201'
   ,'1'
   ,'1'
   ,'Stonemason'
   ,'Stonemasons'
   ,''
   ,'Build stone structures, such as piers, walls, and abutments.  Lay walks, curbstones, or special types of masonry for vats, tanks, and floors.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2022'
   ,'Stonemasons'
   ,'Build stone structures, such as piers, walls, and abutments.  Lay walks, curbstones, or special types of masonry for vats, tanks, and floors.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('201'
   ,'2'
   ,'2'
   ,'Stonemason'
   ,''
   ,''
   ,'Construyen estructuras de piedra, como por ejemplo, muelles, muros y refuerzos. Construyen senderos, colocan bordillos de aceras o tipos especiales de mamposter°a para dep¢sitos, tanques y pisos.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('202'
   ,'1'
   ,'1'
   ,'Electric Motor Repairer'
   ,'Electric Motor Repairers'
   ,''
   ,'Repair, maintain, or install electric motors, wiring, or switches.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-2092'
   ,'Electric Motor, Power Tool, and Related Repairers'
   ,'Repair, maintain, or install electric motors, wiring, or switches.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('202'
   ,'2'
   ,'2'
   ,'Electric Motor Repairer'
   ,''
   ,''
   ,'Reparan, mantienen o instalan motores, cableados o interruptores el‚ctricos.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('203'
   ,'1'
   ,'1'
   ,'Power Tool Repairer'
   ,'Power Tool Repairers'
   ,''
   ,'Repair, maintain, or install electric motors, wiring, or switches.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-2092'
   ,'Electric Motor, Power Tool, and Related Repairers'
   ,'Repair, maintain, or install electric motors, wiring, or switches.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('203'
   ,'2'
   ,'2'
   ,'Power Tool Repairer'
   ,''
   ,''
   ,'Reparan, mantienen o instalan motores, cableados o interruptores el‚ctricos.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('204'
   ,'1'
   ,'1'
   ,'Artistic Painter'
   ,'Artistic Painters'
   ,''
   ,'Create original artwork using any of a wide variety of media and techniques.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-1013'
   ,'Fine Artists, Including Painters, Sculptors, and Illustrators'
   ,'Create original artwork using any of a wide variety of media and techniques.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('204'
   ,'2'
   ,'2'
   ,'Pintor/a ArtÌstico/a'
   ,'Pintores/as ArtÌsticos/as'
   ,''
   ,'Crean obras de arte originales utilizando una amplia variedad de materiales y t‚cnicas.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('205'
   ,'1'
   ,'1'
   ,'Sculptor'
   ,'Sculptors'
   ,''
   ,'Create original artwork using any of a wide variety of media and techniques.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-1013'
   ,'Fine Artists, Including Painters, Sculptors, and Illustrators'
   ,'Create original artwork using any of a wide variety of media and techniques.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('205'
   ,'2'
   ,'2'
   ,'Escultor/a'
   ,'Escultores/as'
   ,''
   ,'Crean obras de arte originales utilizando una amplia variedad de materiales y t‚cnicas.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('206'
   ,'1'
   ,'1'
   ,'Illustrator'
   ,'Illustrators'
   ,''
   ,'Create original artwork using any of a wide variety of media and techniques.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-1013'
   ,'Fine Artists, Including Painters, Sculptors, and Illustrators'
   ,'Create original artwork using any of a wide variety of media and techniques.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('206'
   ,'2'
   ,'2'
   ,'Ilustrador/a'
   ,'Ilustradores/as'
   ,''
   ,'Crean obras de arte originales utilizando una amplia variedad de materiales y t‚cnicas.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('207'
   ,'1'
   ,'1'
   ,'Woodworker'
   ,'Woodworkers'
   ,''
   ,'Dovetail your woodworking expertise with clients'' visions for new cabinets, a creative scultpure, or the perfect rockingchair.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'51-7099'
   ,'Woodworkers, All Other'
   ,'All woodworkers not listed separately.'
   ,'True'
   ,'3'
   ,'Dovetail your hopes for the perfect rocking chair/table/sculpture with the expertise of a trained, possibly bearded woodworker.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('207'
   ,'2'
   ,'2'
   ,'Woodworker'
   ,''
   ,''
   ,'Todos los trabajadores de ebanister°a y carpinter°a que no est n listados por separado.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('208'
   ,'1'
   ,'1'
   ,'Recreational Therapist'
   ,'Recreational Therapists'
   ,''
   ,'Plan, direct, or coordinate medically-approved recreation programs for patients in hospitals, nursing homes, or other institutions.  Activities include sports, trips, dramatics, social activities, and arts and crafts.  May assess a patient condition and recommend appropriate recreational activity.  Excludes ?Recreation Workers? (39-9032).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'29-1125'
   ,'Recreational Therapists'
   ,'Plan, direct, or coordinate medically-approved recreation programs for patients in hospitals, nursing homes, or other institutions.  Activities include sports, trips, dramatics, social activities, and arts and crafts.  May assess a patient condition and recommend appropriate recreational activity.  Excludes ?Recreation Workers? (39-9032).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('208'
   ,'2'
   ,'2'
   ,'Recreational Therapist'
   ,''
   ,''
   ,'Planifican, dirigen o coordinan programas recreativos con aprobaci¢n m‚dica para pacientes internados en hospitales, asilos y otras instituciones. Pueden desempe¤arse en actividades deportivas, excursiones, actividades de arte dram tico, actividades sociales, arte y artesan¡as. Pueden evaluar la condici¢n del paciente y recomendar la actividad recreativa apropiada. Excluye a los ?Trabajadores de Actividades Recreativas? (39-9032).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('209'
   ,'1'
   ,'1'
   ,'Professional Agent'
   ,'Professional Agents'
   ,''
   ,'Represent and promote artists, performers, and athletes in dealings with current or prospective employers.  May handle contract negotiation and other business matters for clients.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'13-1011'
   ,'Agents and Business Managers of Artists, Performers, and Athletes'
   ,'Represent and promote artists, performers, and athletes in dealings with current or prospective employers.  May handle contract negotiation and other business matters for clients.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('209'
   ,'2'
   ,'2'
   ,'Professional Agent'
   ,''
   ,''
   ,'Representan y promueven a artistas, int‚rpretes art¡sticos y atletas en sus relaciones de negocio con sus empleadores actuales o potenciales. Pueden manejar la negociaci¢n de contratos y otros asuntos de sus clientes.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('210'
   ,'1'
   ,'1'
   ,'Fashion Designer'
   ,'Fashion Designers'
   ,''
   ,'Design clothing and accessories.  Create original designs or adapt fashion trends. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-1022'
   ,'Fashion Designers'
   ,'Design clothing and accessories.  Create original designs or adapt fashion trends. '
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('210'
   ,'2'
   ,'2'
   ,'Fashion Designer'
   ,''
   ,''
   ,'Dise§an prendas de vestir y accesorios. Crean dise§os originales o adaptan las tendencias de la moda.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('211'
   ,'1'
   ,'1'
   ,'Locksmith'
   ,'Locksmiths'
   ,''
   ,'An expert in all things lock? Find and secure customers needing anything from the basic quick-pick to a more involved consultation.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-9094'
   ,'Locksmiths and Safe Repairers'
   ,'Repair and open locks; make keys; change locks and safe combinations; and install and repair safes.'
   ,'True'
   ,'1'
   ,'Find the perfect fit of a locksmith who''ll quickly and expertly deal with your toughest lock issues.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('211'
   ,'2'
   ,'2'
   ,'Cerrajero/a'
   ,'Cerrajeros/as'
   ,''
   ,'Reparan y abren cerraduras, hacen llaves y cambian combinaciones de cerraduras y de cajas de seguridad; e instalan y reparan cajas de seguridad.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('212'
   ,'1'
   ,'1'
   ,'Boat Mechanic'
   ,'Boat Mechanics'
   ,''
   ,'Repair and adjust electrical and mechanical equipment of inboard or inboard-outboard boat engines.  Excludes ?Bus and Truck Mechanics and Diesel Engine Specialists"" (49-3031).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-3051'
   ,'Motorboat Mechanics and Service Technicians'
   ,'Repair and adjust electrical and mechanical equipment of inboard or inboard-outboard boat engines.  Excludes ?Bus and Truck Mechanics and Diesel Engine Specialists"" (49-3031).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('212'
   ,'2'
   ,'2'
   ,'Boat Mechanic'
   ,''
   ,''
   ,'Reparan y ajustan equipos mec nicos y el‚ctricos de los motores de gasolina o diesel dentro o fuera de borda de embarcaciones de motor. Excluye a los ?Mec nicos de Autobuses y Camiones y Especialistas en Motores Diesel? (49-3031).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('213'
   ,'1'
   ,'1'
   ,'Tattoo Artist'
   ,'Tattoo Artists'
   ,''
   ,'Get antsy at the sight of an unadorned bicep? Make your mark on clients searching for the perfect tattoo. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-1019'
   ,'Artists and Related Workers, All Other'
   ,'All artists and related workers not listed separately.'
   ,'True'
   ,'2'
   ,'Bicep looking a little bare? Yankle feeling a little naked? Remember Mom on your arm or get a visual retelling of Moby Dick along your side -- somewhere out there exists the perfect heart/whale tattooist for the job. Make your mark!'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('213'
   ,'2'
   ,'2'
   ,'Tatuador/a'
   ,'Tatuadores/as'
   ,''
   ,'Todos los artistas y trabajadores relacionados que no est n listados por separado.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('214'
   ,'1'
   ,'1'
   ,'Photo Restorer'
   ,'Photo Restorers'
   ,''
   ,'You polish up the past with detailed photographic expertise, artfully and accurately transforming battered, speckled, discolored, or just regular old images. Find clients needing touch-ups, coloring work, or just a knowledgeable consultation.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-1019'
   ,'Artists and Related Workers, All Other'
   ,'All artists and related workers not listed separately.'
   ,'True'
   ,'3'
   ,'We could all polish up our pasts a bit, but a photo restorer can really get the ball rolling with some phancy phootwork. Find the perfect professional for a consultation or for careful restoration of your weathered, discolored, speckled, or just regular old photographs.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('214'
   ,'2'
   ,'2'
   ,'Photo Restorer'
   ,''
   ,''
   ,'Todos los artistas y trabajadores relacionados que no est n listados por separado.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('215'
   ,'1'
   ,'1'
   ,'Picture Framer'
   ,'Picture Framers'
   ,''
   ,'Do you ever get tired of hearing all that talk about the Framers? Maybe we just watch too much of The West Wing, but someone should really make a distinction between those Constitution guys and the folks who expertly take our items and preserve them behind glass, wood, and metal. Find clients looking not for constitutional advice but some help capturing, mounting, and hanging their art and mementos.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-1019'
   ,'Artists and Related Workers, All Other'
   ,'All artists and related workers not listed separately.'
   ,'True'
   ,'3'
   ,'Rabbets, mats, shadowboxing -- we have only the slightest idea of these terms'' meanings, but luckily a trained framing professional knows that and way more. Find the right expert to listen, evaluate framing possibilities for your items, and construct the picture-perfect solution.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('215'
   ,'2'
   ,'2'
   ,'Picture Frame'
   ,''
   ,''
   ,'Todos los artistas y trabajadores relacionados que no est n listados por separado.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('216'
   ,'1'
   ,'1'
   ,'Floor Layer'
   ,'Floor Layers'
   ,''
   ,'Floor clients with your bottomless expertise -- consult, evaluate, and install the right flooring for residential properties, businesses, and more.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2042'
   ,'Floor Layers, Except Carpet, Wood, and Hard Tiles'
   ,'Apply blocks, strips, or sheets of shock-absorbing, sound-deadening, or decorative coverings to floors.'
   ,'True'
   ,'3'
   ,'Find the right expert holding a bottomless knowledge of all things groundcover, and you''ll be floored by the possibilities for your house, business, or football stadium.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('216'
   ,'2'
   ,'2'
   ,'Floor Layer'
   ,''
   ,''
   ,'Aplican bloques, bandas o l minas de revestimientos para pisos de materiales aptos para la amortiguaci¢n de golpes y sonido o con fines decorativos.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('217'
   ,'1'
   ,'1'
   ,'Auto Electronics Installer'
   ,'Auto Electronics Installers'
   ,''
   ,'You bring those thumping basslines down the street into existence, and for that, we thank you (really -- we''re known to pump up the jams on the highway ourselves). There are few things more pleasurable than feeling your nostril hairs quiver with a car''s overwhelming musical vibrations. Find customers in need of nostril hair stimulation or just some quiet classical accompaniment on their seaside drives.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-2096'
   ,'Electronic Equipment Installers and Repairers, Motor Vehicles'
   ,'Install, diagnose, or repair communications, sound, security, or navigation equipment in motor vehicles.'
   ,'True'
   ,'3'
   ,'Classical accompaniment to your seaside drives or nostril hair-quivering bass lines, there''s the right auto electronics installer for the musical desire.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('217'
   ,'2'
   ,'2'
   ,'Auto Electronics Installer'
   ,''
   ,''
   ,'Instalan, diagnostican desperfectos o reparan equipo de comunicaciones, sonido, seguridad o navegaci¢n instalados en veh°culos de motor.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('218'
   ,'1'
   ,'1'
   ,'Auto Electronics Repairer'
   ,'Auto Electronics Repairers'
   ,''
   ,'The case of the missing bass line might otherwise go unsolved without your repairwork know-how. Find clients desperately needing assistance in car electronics-related matters, musical or otherwise.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-2096'
   ,'Electronic Equipment Installers and Repairers, Motor Vehicles'
   ,'Install, diagnose, or repair communications, sound, security, or navigation equipment in motor vehicles.'
   ,'True'
   ,'3'
   ,'Got a case of the missing bass line? Find the perfect auto electronics repairer to get everything back on the right (thumping) track.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('218'
   ,'2'
   ,'2'
   ,'Auto Electronics Repairer'
   ,''
   ,''
   ,'Instalan, diagnostican desperfectos o reparan equipo de comunicaciones, sonido, seguridad o navegaci¢n instalados en veh°culos de motor.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('219'
   ,'1'
   ,'1'
   ,'Auto Glass Installer'
   ,'Auto Glass Installers'
   ,''
   ,' A car without a windshield -- not a good idea. Think of the bugs in mouths, the grime on faces, the wind in hair, and the absolutely impossible relaxing car drive! Find clients wanting none of these items but rather some nice, clean, perfectly-installed windows and windshields for their car.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-3022'
   ,'Automotive Glass Installers and Repairers'
   ,'Replace or repair broken windshields and window glass in motor vehicles.'
   ,'True'
   ,'3'
   ,' A car without a windshield -- not a good idea. Think of the bugs in mouths, the grime on faces, the wind in hair, and the absolutely impossible relaxing car drive! We assume you want none of these items but rather some nice, clean, perfectly-installed windows and windshields for your car. Luckily, the perfect installer exists.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('219'
   ,'2'
   ,'2'
   ,'Auto Glass Installer'
   ,''
   ,''
   ,'Reemplazan o reparan parabrisas rotos y vidrios de ventanas de veh°culos de motor.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('220'
   ,'1'
   ,'1'
   ,'Auto Glass Repairer'
   ,'Auto Glass Repairers'
   ,''
   ,' A car without a windshield -- not a good idea. Think of the bugs in mouths, the grime on faces, the wind in hair, and the absolutely impossible relaxing car drive! Find clients wanting none of these items but rather some nice, clean, perfect windows and windshields for their car.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-3022'
   ,'Automotive Glass Installers and Repairers'
   ,'Replace or repair broken windshields and window glass in motor vehicles.'
   ,'True'
   ,'3'
   ,' A car without a windshield -- not a good idea. Think of the bugs in mouths, the grime on faces, the wind in hair, and the absolutely impossible relaxing car drive! We assume you want none of these items but rather some nice, clean, perfect windows and windshields for your car. Luckily, the perfect repairer exists.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('220'
   ,'2'
   ,'2'
   ,'Auto Glass Repairer'
   ,''
   ,''
   ,'Reemplazan o reparan parabrisas rotos y vidrios de ventanas de veh°culos de motor.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('221'
   ,'1'
   ,'1'
   ,'Motorcycle Mechanic'
   ,'Motorcycle Mechanics'
   ,''
   ,'We may or may not have a track record of falling hopelessly in love with you folks in your jumpsuits, grease streaks, and bad-in-a-good-way bike expertise. Find more broken hearts or just, you know, real-deal customers needing your assistance with all things spark plug and carburetor.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-3052'
   ,'Motorcycle Mechanics'
   ,'Diagnose, adjust, repair, or overhaul motorcycles, scooters, mopeds, dirt bikes, or similar motorized vehicles.'
   ,'True'
   ,'3'
   ,'We may or may not have a track record of falling hopelessly in love with these folks in their jumpsuits, grease streaks, and bad-in-a-good-way bike expertise. Find the right heartbreaker or just, you know, real-deal repairperson to fix all those spark plug and carburetor woes.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('221'
   ,'2'
   ,'2'
   ,'Motorcycle Mechanic'
   ,''
   ,''
   ,'Diagnostican desperfectos, ajustan, reparan y reacondicionan motocicletas, motonetas, ciclomotores, motocicletas todo terreno o veh°culos motorizados similares.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('222'
   ,'1'
   ,'1'
   ,'Copywriter'
   ,'Copywriters'
   ,'Proofreader'
   ,'You, my friend, are one of those valuable professionals whose job is (partially) to prevent others'' embarassment. Find clients needing your eagle eyes to run over their manuscripts and more.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'43-9081'
   ,'Proofreaders and Copy Markers'
   ,'Read transcript or proof type setup to detect and mark for correction any grammatical, typographical, or compositional errors.  Excludes workers whose primary duty is editing copy.  Includes proofreaders of Braille.'
   ,'True'
   ,'2'
   ,'Ensuring a manuscript''s accuracy can eventually feel like flying too close to the sun -- blinded by your proximity to the work (and exhausting journey thus far), you might fail in your mission. Proofreaders, those winged, eagle-eyed angels, can serve as a necessary bit of outside help. Find the right one for whatever your project.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('222'
   ,'2'
   ,'2'
   ,'Corrector/a de Textos'
   ,'Correctores/as de Textos'
   ,''
   ,'Leen transcripciones o revisan material tipiado o mecanografiado para detectar y marcar correcciones de errores gramaticales, tipogr ficos o de composici¢n. Excluye a los trabajadores que se dedican principalmente a tareas de edici¢n final. Incluye a los correctores de pruebas de escritura de sistema Braille.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('223'
   ,'1'
   ,'1'
   ,'Mechanical Door Repairer'
   ,'Mechanical Door Repairers'
   ,''
   ,'Open, Sesame! While it''s unlikely that you mutter that phrase upon successfully fixing a mechanical door, you make all your clients want to shout it to high heaven. Find customers needing your magical assistance unjamming their stubborn entryways.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-9011'
   ,'Mechanical Door Repairers'
   ,'Install, service, or repair automatic door mechanisms and hydraulic doors.  Includes garage door mechanics.'
   ,'True'
   ,'3'
   ,'Open, Sesame! While it''s unlikely that these folks mutter that phrase upon successfully fixing a mechanical door, they make all their clients want to shout it to high heaven. Find the perfect magical assistance to unjam your stubborn entryway.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('223'
   ,'2'
   ,'2'
   ,'Mechanical Door Repairer'
   ,''
   ,''
   ,'Instalan, dan servicio o reparan puertas hidr ulicas y mecanismos de puertas autom ticas. Incluye a los mec nicos de puertas de garaje.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('224'
   ,'1'
   ,'1'
   ,'Athletic Trainer'
   ,'Athletic Trainers'
   ,''
   ,'Evaluate and advise individuals to assist recovery from or avoid athletic-related injuries or illnesses, or maintain peak physical fitness.  May provide first aid or emergency care.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'29-9091'
   ,'Athletic Trainers'
   ,'Evaluate and advise individuals to assist recovery from or avoid athletic-related injuries or illnesses, or maintain peak physical fitness.  May provide first aid or emergency care.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('224'
   ,'2'
   ,'2'
   ,'Athletic Trainer'
   ,''
   ,''
   ,'Eval£an y aconsejan a las personas para ayudarlas a recuperarse o evitar lesiones o enfermedades relacionadas con la pr ctica de deportes de atletismo, o a mantener un estado f°sico ¢ptimo. Pueden prestar servicios de primeros auxilios o de atenci¢n de emergencia.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('225'
   ,'1'
   ,'1'
   ,'Choreographer'
   ,'Choreographers'
   ,''
   ,'Create new dance routines.  Rehearse performance of routines.  May direct and stage presentations.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-2032'
   ,'Choreographers'
   ,'Create new dance routines.  Rehearse performance of routines.  May direct and stage presentations.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('225'
   ,'2'
   ,'2'
   ,'CoreÛgrafo/a'
   ,'CoreÛgrafos/as'
   ,''
   ,'Crean nuevas rutinas de baile o danza. Ensayan las rutinas para las presentaciones. Pueden dirigir y poner en escena representaciones de danza.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('226'
   ,'1'
   ,'1'
   ,'Umpire'
   ,'Umpires'
   ,''
   ,'A voice of well-informed reason, your rapid handgestures are incomprehensible to non-sports-people and pretty much law to everyone else. Find clients needing your impartial, informed judgement (and cool handgestures) at their next sporting event.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-2023'
   ,'Umpires, Referees, and Other Sports Officials'
   ,'Officiate at competitive athletic or sporting events.  Detect infractions of rules and decide penalties according to established regulations.  Includes all sporting officials, referees, and competition judges.'
   ,'True'
   ,'3'
   ,'A voice of well-informed reason, umpires'' rapid handgestures are incomprehensible to non-sports-people and pretty much law to everyone else. Find the right official endowed with impartial, informed judgement (and cool handgestures) for your next sporting event.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('226'
   ,'2'
   ,'2'
   ,'Umpire'
   ,''
   ,''
   ,'Ofician en eventos de competencias de atletismo o eventos deportivos. Detectan infracciones de las reglas del juego y deciden las penalidades de acuerdo a las regulaciones establecidas. Incluye a todos los oficiales deportivos, refer°s y jueces de competencias deportivas.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('227'
   ,'1'
   ,'1'
   ,'Referree'
   ,'Referrees'
   ,''
   ,'Not only do you bring an enviable black and white shirt to the field/court, you bring a voice of impartiality, reason, and eagle-eyed deduction. Find clients needing your stone-faced expertise at their next sporting event. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-2023'
   ,'Umpires, Referees, and Other Sports Officials'
   ,'Officiate at competitive athletic or sporting events.  Detect infractions of rules and decide penalties according to established regulations.  Includes all sporting officials, referees, and competition judges.'
   ,'True'
   ,'3'
   ,'Not only do referees bring an enviable black and white shirt to the field/court, they bring a voice of impartiality, reason, and eagle-eyed deduction. Find the right stone-faced official for your upcoming sporting event.  '
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('227'
   ,'2'
   ,'2'
   ,'¡rbitro/o'
   ,'¡rbitros/as'
   ,''
   ,'Ofician en eventos de competencias de atletismo o eventos deportivos. Detectan infracciones de las reglas del juego y deciden las penalidades de acuerdo a las regulaciones establecidas. Incluye a todos los oficiales deportivos, refer°s y jueces de competencias deportivas.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('228'
   ,'1'
   ,'1'
   ,'Fire Inspector'
   ,'Fire Inspectors'
   ,''
   ,'Inspect buildings to detect fire hazards and enforce local ordinances and State laws, or investigate and gather facts to determine cause of fires and explosions.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'33-2021'
   ,'Fire Inspectors and Investigators'
   ,'Inspect buildings to detect fire hazards and enforce local ordinances and State laws, or investigate and gather facts to determine cause of fires and explosions.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('228'
   ,'2'
   ,'2'
   ,'Fire Inspector'
   ,''
   ,''
   ,'Inspeccionan edificios o construcciones para detectar riesgos de incendio y para hacer cumplir las ordenanzas locales y las leyes estatales pertinentes, o investigan y re£nen informaci¢n para determinar las causas de incendios y explosiones.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('229'
   ,'1'
   ,'1'
   ,'Chimney Sweeper'
   ,'Chimney Sweepers'
   ,''
   ,'You''ve probably heard that "Chim-Chim-Cher-ee" song so many times you''ll never be able to watch Mary Poppins again. Rest assured, your clients aren''t going to force you to, they just need your expert assistance in ensuring a clean, working chimney.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'37-2019'
   ,'Building Cleaning Workers, All Other'
   ,'All building cleaning workers not listed separately.'
   ,'True'
   ,'3'
   ,'These folks have probably heard that "Chim-Chim-Cher-ee" song so many times they''ll never be able to watch Mary Poppins again. If you promise not to sing this song to your expert chimneysweeping professional, they''ll ensure a clean, working Chim-chim-ney for your home or business.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('229'
   ,'2'
   ,'2'
   ,'Chimney Sweeper'
   ,''
   ,''
   ,'Todos los trabajadores de limpieza de edificios que no est n listados por separado.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('230'
   ,'1'
   ,'1'
   ,'RV Service Technician'
   ,'RV Service Technicians'
   ,''
   ,'Ensuring perfect vacations across America, you''re indispensible to RV owners wanting no nighttime breakdowns in the middle of silent, dark woods. Find clients needing your expert, all-around assistance in getting their family-vacation-on-wheels running smooth as butter.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-3092'
   ,'Recreational Vehicle Service Technicians'
   ,'Diagnose, inspect, adjust, repair, or overhaul recreational vehicles including travel trailers.  May specialize in maintaining gas, electrical, hydraulic, plumbing, or chassis/towing systems as well as repairing generators, appliances, and interior components.  Includes workers who perform customized van conversions.  Excludes ?Automotive Service Technicians and Mechanics"" (49-3023) and ""Bus and Truck Mechanics and Diesel Engine Specialists"" (49-3031) who also work on recreation vehicles.'
   ,'True'
   ,'3'
   ,'Ensuring perfect vacations across America, these folks are indispensible to RV owners wanting no nighttime breakdowns in the middle of silent, dark woods.Find the right service professional to get your family-vacation-on-wheels running smooth as butter and full of laughter, lounging, and lovely views.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('230'
   ,'2'
   ,'2'
   ,'RV Service Technician'
   ,''
   ,''
   ,'Diagnostican desperfectos, inspeccionan, ajustan, reparan o reacondicionan veh¡culos recreativos, incluyendo casas rodantes. Pueden especializarse en el mantenimiento de sistemas de combustible, el‚ctrico, hidr ulico, de plomer¡a o del chasis/remolque, como tambi‚n en la reparaci¢n de generadores, equipos electrodom‚sticos y piezas interiores. Incluye a los trabajadores que realizan trabajos de conversi¢n de furgonetas a pedido. Excluye a los ?T‚cnicos y Mec nicos de Servicio Automotriz? (49-3023) y a los ?Mec nicos de Autobuses y Camiones y Especialistas en Motores Diesel? (49-3031) que tambi‚n trabajan con veh¡culos recreativos.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('231'
   ,'1'
   ,'1'
   ,'Dancer'
   ,'Dancers'
   ,''
   ,'Perform dances.  May perform on stage, for on-air broadcasting, or for video recording'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-2031'
   ,'Dancers'
   ,'Perform dances.  May perform on stage, for on-air broadcasting, or for video recording'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('231'
   ,'2'
   ,'2'
   ,'BailarÌn/Bailarina'
   ,'Bailarines/Bailarinas'
   ,''
   ,'Ejecutan bailes o danzas. Pueden actuar en un escenario, para emisiones en vivo o en grabaciones de video.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('232'
   ,'1'
   ,'1'
   ,'Floor Sanders and Finisher'
   ,'Floor Sanders and Finishers'
   ,''
   ,'We do not want to even think about what it would be like to walk around on hardwood floors without you folks. Find clients needing to spruce up their floors with expert sanding and finishing.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2043'
   ,'Floor Sanders and Finishers'
   ,'Scrape and sand wooden floors to smooth surfaces using floor scraper and floor sanding machine, and apply coats of finish.'
   ,'True'
   ,'3'
   ,'We do not want to even think about what it would be like to walk around on hardwood floors without these folks. Find the right expert to spruce up your floors with expert sanding and finishing.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('232'
   ,'2'
   ,'2'
   ,'Floor Sanders and Finisher'
   ,''
   ,''
   ,'Raspan y pulen pisos de madera para alisar la superficie utilizando m quinas pulidoras y lijadoras de pisos y aplican capas de productos de terminaci¢n.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('233'
   ,'1'
   ,'1'
   ,'Engraver'
   ,'Engravers'
   ,''
   ,'You''re no grave character. Scratch that. You''re a GREAT character (and you probably noticed we made three engraving puns within two sentences there). Find and impress customers needing your chiseled know-how and cutting expertise (three more puns…but much worse than before).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'51-9194'
   ,'Etchers and Engravers'
   ,'Engrave or etch metal, wood, rubber, or other materials. Includes such workers as etcher-circuit processors, pantograph engravers, and silk screen etchers.  Photoengravers are included in ""Prepress Technicians and Workers"" (51-5111).'
   ,'True'
   ,'3'
   ,'With chiseled knowledge, these professionals hold a grave command of all things etching and engraving.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('233'
   ,'2'
   ,'2'
   ,'Engraver'
   ,''
   ,''
   ,'Tallan o graban metal, madera, caucho o goma u otros materiales. Incluye a los procesadores de circuitos grabados, grabadores o talladores que operan pant¢grafos o pantallas de seda. Los fotograbadores est n dentro de la ocupaci¢n ?T‚cnicos y Trabajadores de Preimpresi¢n? (51-5111).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('234'
   ,'1'
   ,'1'
   ,'Auto Damage Appraiser'
   ,'Auto Damage Appraisers'
   ,''
   ,'Appraise automobile or other vehicle damage to determine repair costs for insurance claim settlement.  Prepare insurance forms to indicate repair cost or cost estimates and recommendations.  May seek agreement with automotive repair shop on repair costs.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'13-1032'
   ,'Insurance Appraisers, Auto Damage'
   ,'Appraise automobile or other vehicle damage to determine repair costs for insurance claim settlement.  Prepare insurance forms to indicate repair cost or cost estimates and recommendations.  May seek agreement with automotive repair shop on repair costs.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('234'
   ,'2'
   ,'2'
   ,'Auto Damage Appraiser'
   ,''
   ,''
   ,'Tasan las aver°as de autom¢viles u otros veh°culos para determinar los costos de reparaci¢n con el fin de resolver las reclamaciones de seguro. Preparan formularios de seguro para indicar el costo de reparaci¢n o elaboran presupuestos y recomendaciones de costo. Pueden tratar de acordar los costos de restauraci¢n con el taller de reparaciones.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('235'
   ,'1'
   ,'1'
   ,'Art Restorer'
   ,'Art Restorers'
   ,''
   ,'You literally keep the tradition alive. What tradition, you may ask? Oh, let''s see. Artistic, historical, material, photographic, botanical, textile, all of it. Find clients needing your specific expertise in restoration, preservation, and presentation.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'25-4013'
   ,'Museum Technicians and Conservators'
   ,'Restore, maintain, or prepare objects in museum collections for storage, research, or exhibit.  May work with specimens such as fossils, skeletal parts, or botanicals; or artifacts, textiles, or art.  May identify and record objects or install and arrange them in exhibits.  Includes book or document conservators.'
   ,'True'
   ,'3'
   ,'These folks literally keep the tradition alive. What tradition, you may ask? Oh, let''s see. Artistic, historical, material, photographic, botanical, textile, all of it. Find the right professional to help out with your specific  restoration, preservation, or presentation needs.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('235'
   ,'2'
   ,'2'
   ,'Restaurador/a de Arte'
   ,'Restauradores/as de Arte'
   ,''
   ,'Restauran, mantienen o preparan objetos de colecciones de museos para su almacenamiento, investigaci¢n o exhibici¢n. Pueden trabajar con especimenes tales como f¢siles, partes de esqueletos o plantas bot nicas; o artefactos, piezas textiles o de arte. Pueden identificar y registrar objetos o instalarlos y organizarlos para su exposici¢n. Incluye a los conservadores de libros o documentos.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('236'
   ,'1'
   ,'1'
   ,'Lumberjack'
   ,'Lumberjacks'
   ,''
   ,'Ah, you plaid-shirted, often bearded professionals of the forest! We envy your arms and your forestry knowledge. Find clients looking specifically for your rugged know-how and can-do attitude (whatever that means). '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'45-4021'
   ,'Fallers'
   ,'Use axes or chainsaws to fell trees using knowledge of tree characteristics and cutting techniques to control direction of fall and minimize tree damage.'
   ,'True'
   ,'3'
   ,'Ah, those plaid-shirted, often bearded nymphs of the forest! We envy their arms and their forestry knowledge. Find the right lumber-nymph for your tree-related task.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('236'
   ,'2'
   ,'2'
   ,'Lumberjack'
   ,''
   ,''
   ,'Usan hachas o sierras el‚ctricas para derribar  rboles utilizando conocimientos sobre las caracter¡sticas de los  rboles y las t‚cnicas de tala aplicables para controlar la direcci¢n de ca¡da y minimizar el da¤o del  rbol.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('237'
   ,'1'
   ,'1'
   ,'Bicycle Repairer'
   ,'Bicycle Repairers'
   ,''
   ,'Oh, you lovely, boisterously-quadriceped, grease-stained professionals, you! With finesse and knowledge of gears, brackets, and other things we cannot pretend to fully understand, you ensure everyone is riding around on the best possible steed. Find clients looking for tune-ups or full-blown repairs to their trusty metal stallions.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-3091'
   ,'Bicycle Repairers'
   ,'Repair and service bicycles.'
   ,'True'
   ,'1'
   ,'Oh, those lovely, boisterously-quadriceped, grease-stained professionals. With finesse and knowledge of gears, brackets, and other things we cannot pretend to fully understand, these folks ensure everyone is riding around on the best possible steed. Find the right repairperson, whether you''re looking for a tune-up or full-blown repairs to your trusty metal stallion.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('237'
   ,'2'
   ,'2'
   ,'Mec·nico/a de Bicicletas'
   ,'Mec·nico/a de Bicicletas'
   ,''
   ,'Desempe§an tareas de servicio y reparaci¢n de bicicletas.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('238'
   ,'1'
   ,'1'
   ,'Shoe Repairer'
   ,'Shoe Repairers'
   ,''
   ,'The descendents of cobblers (not the peach kind), you folks make sure everyone''s back on their own two feet, and in comfy shoes at that. Find clients needing your particular brand of fancy footwork.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'51-6041'
   ,'Shoe and Leather Workers and Repairers'
   ,'Construct, decorate, or repair leather and leather-like products, such as luggage, shoes, and saddles.'
   ,'True'
   ,'2'
   ,'Getting back on your own two feet is one thing; making sure those feet are swaddled in comfortable, durable shoes is another. Find the right shoe repairer sure to exercise some fancy footwork in getting you up and running.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('238'
   ,'2'
   ,'2'
   ,'Zapatero/a'
   ,'Zapateros/as'
   ,''
   ,'Arman, decoran o reparan productos de cuero y materiales similares al cuero, como por ejemplo, equipaje, zapatos y monturas.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('239'
   ,'1'
   ,'1'
   ,'Leather Repairer'
   ,'Leather Repairers'
   ,''
   ,'Sometimes we wish you''d take a little look-see at our skin, which could honestly benefit from your smoothing, moisturizing, elasticizing expertise. Find clients looking for help with their belts, jackets, saddles, couches -- all that buttery leather.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'51-6041'
   ,'Shoe and Leather Workers and Repairers'
   ,'Construct, decorate, or repair leather and leather-like products, such as luggage, shoes, and saddles.'
   ,'True'
   ,'2'
   ,'Find the right professional sure to buff your leather item -- belt, couch, saddle, what have you -- back into buttery bliss.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('239'
   ,'2'
   ,'2'
   ,'Leather Repairer'
   ,''
   ,''
   ,'Arman, decoran o reparan productos de cuero y materiales similares al cuero, como por ejemplo, equipaje, zapatos y monturas.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('240'
   ,'1'
   ,'1'
   ,'Embalmer'
   ,'Embalmers'
   ,''
   ,'Prepare bodies for interment in conformity with legal requirements.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'39-4011'
   ,'Embalmers'
   ,'Prepare bodies for interment in conformity with legal requirements.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('240'
   ,'2'
   ,'2'
   ,'Embalmer'
   ,''
   ,''
   ,'Prepararan los cuerpos sin vida para su entierro conforme a los requerimientos legales.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('241'
   ,'1'
   ,'1'
   ,'Wallpaperer'
   ,'Wallpaperers'
   ,''
   ,'Thanks to Martha Stewart and her infinite capacity for colorfully patterned walls, you guys are adhering left and right. Find clients, whether the stripy kind, the fluorescent polka dot kind, or the subdued floral kind, desperately looking to avoid fouling up their walls in a personal attempt at wallpapering.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2142'
   ,'Paperhangers'
   ,'Cover interior walls or ceilings of rooms with decorative wallpaper or fabric, or attach advertising posters on surfaces such as walls and billboards.  May remove old materials or prepare surfaces to be papered.'
   ,'True'
   ,'2'
   ,'If only every wallpaper was the Willy Wonka kind -- lickable. Right? Either way, wallpapering is a notoriously painstaking and difficult task, which basically means you or your wallpapering companion is going to get angry at some point during the process. Find an experienced wallpapering professional to get your stripes just right, your dots in alignment, or your neon goldfish swimming at the right angle.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('241'
   ,'2'
   ,'2'
   ,'Wallpaperer'
   ,''
   ,''
   ,'Cubren paredes interiores o techos de cuartos y habitaciones con papel o tela de uso decorativo, o fijan afiches publicitarios en superficies tales como paredes y carteleras. Pueden quitar materiales previamente fijados o preparar superficies para su posterior empapelado.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('242'
   ,'1'
   ,'1'
   ,'Musical Instrument Repairer'
   ,'Musical Instrument Repairers'
   ,''
   ,'The beat goes on, and it''s all thanks to you. Find clients needing literal tune-ups or full-blown repair work on their percussion, stringed, woodwind, or brass instruments.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-9063'
   ,'Musical Instrument Repairers and Tuners'
   ,'Repair percussion, stringed, reed, or wind instruments.  May specialize in one area, such as piano tuning.  Excludes ?Electronic Home Entertainment Equipment Installers and Repairers"" (49-2097) who repair electrical and electronic musical instruments.'
   ,'True'
   ,'3'
   ,'The beat goes on, and it''s all thanks to these folks. Whether you need a tune-up or a full-on repair, find the right professional for the musical task.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('242'
   ,'2'
   ,'2'
   ,'Musical Instrument Repairer'
   ,''
   ,''
   ,'Reparan instrumentos de percusi¢n, de cuerdas, ca¤a o de viento. Pueden especializarse en un  rea, como por ejemplo en la afinaci¢n de pianos. Excluye a los ?Instaladores y Reparadores de Equipo Electr¢nico de Entretenimiento de Uso Dom‚stico? (49-2097) que reparan instrumentos el‚ctricos o electr¢nicos.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('243'
   ,'1'
   ,'1'
   ,'Musical Instrument Tuner'
   ,'Musical Instrument Tuners'
   ,''
   ,'A finely-tuned professional, you keep music sounding as it should. Lend your ear to clients looking for your help adjusting their pianos or other instruments.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-9063'
   ,'Musical Instrument Repairers and Tuners'
   ,'Repair percussion, stringed, reed, or wind instruments.  May specialize in one area, such as piano tuning.  Excludes ?Electronic Home Entertainment Equipment Installers and Repairers"" (49-2097) who repair electrical and electronic musical instruments.'
   ,'True'
   ,'1'
   ,'A finely-tuned professional, these folks keep music sounding as it should. The right tuner will lend their ear to your instrument, whether piano or digeridoo. '
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('243'
   ,'2'
   ,'2'
   ,'Musical Instrument Tuner'
   ,''
   ,''
   ,'Reparan instrumentos de percusi¢n, de cuerdas, ca¤a o de viento. Pueden especializarse en un  rea, como por ejemplo en la afinaci¢n de pianos. Excluye a los ?Instaladores y Reparadores de Equipo Electr¢nico de Entretenimiento de Uso Dom‚stico? (49-2097) que reparan instrumentos el‚ctricos o electr¢nicos.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('244'
   ,'1'
   ,'1'
   ,'Terrazzo Worker'
   ,'Terrazzo Workers'
   ,''
   ,'Apply a mixture of cement, sand, pigment, or marble chips to floors, stairways, and cabinet fixtures to fashion durable and decorative surfaces.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'47-2053'
   ,'Terrazzo Workers and Finishers'
   ,'Apply a mixture of cement, sand, pigment, or marble chips to floors, stairways, and cabinet fixtures to fashion durable and decorative surfaces.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('244'
   ,'2'
   ,'2'
   ,'Terrazzo Worker'
   ,''
   ,''
   ,'Aplican una mezcla compuesta por cemento, arena y pigmento o peque§os fragmentos de m rmol en pisos, escaleras y accesorios de gabinete para crear superficies durables y decorativas.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('245'
   ,'1'
   ,'1'
   ,'Chef'
   ,'Chefs'
   ,''
   ,'Spicing up people''s lives and meals, your services are lip-smackingly appreciated. Find clients interested in your particular talents and experience, or, perhaps, just very tired of eating Spam.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'35-2013'
   ,'Cooks, Private Household'
   ,'Prepare meals in private homes.  Includes personal chefs.'
   ,'True'
   ,'2'
   ,'Tired of eating Spam? Or pasta? Or carrots? Culinary rut or lack of time to cook, there''s the right chef out there sure to race your motor/boil your water/julienne those carrots/make your favorite dish every night with no one the wiser.'
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('245'
   ,'2'
   ,'2'
   ,'Cocinero/a'
   ,'Cocineros/as'
   ,''
   ,'Preparan comidas en casas privadas. Incluye a los chefs personales.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('246'
   ,'1'
   ,'1'
   ,'Camera Repairer'
   ,'Camera Repairers'
   ,''
   ,'We shutter to think where we''d be without you -- the number of times we''ve, er, dropped our camera is frankly embarassing. Find clients trying to focus in on the perfect repairperson for their camera problem. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-9061'
   ,'Camera and Photographic Equipment Repairers'
   ,'Repair and adjust cameras and photographic equipment, including commercial video and motion picture camera equipment.'
   ,'True'
   ,'2'
   ,'Focus in on the right repairperson for your camera. It''s a snap!'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('246'
   ,'2'
   ,'2'
   ,'Camera Repairer'
   ,''
   ,''
   ,'Reparan y ajustan c maras y equipo fotogr fico, incluyendo las c maras comerciales de video y c maras de cinematograf°a.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('247'
   ,'1'
   ,'1'
   ,'Watch Repairer'
   ,'Watch Repairers'
   ,''
   ,'Yes, yes, time flies. Thanks to you, it does, anyway. Keep things a''ticking for clients whose whole world seems to have stopped with their watch.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-9064'
   ,'Watch Repairers'
   ,'Repair, clean, and adjust mechanisms of timing instruments, such as watches and clocks.  Includes watchmakers, watch technicians, and mechanical timepiece repairers.'
   ,'True'
   ,'2'
   ,'Time flies, sure, but only thanks to these professionals. If your watch -- and world -- have stopped, time''s a ticking. The right repairperson''s here!'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('247'
   ,'2'
   ,'2'
   ,'Relojero/a'
   ,'Relojeros/as'
   ,''
   ,'Reparan, limpian y ajustan mecanismos de instrumentos de relojer¡a, como por ejemplo relojes pulsera y de pared. Incluye a los relojeros, t‚cnicos de relojer¡a y reparadores de piezas de relojer¡a mec nica.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('248'
   ,'1'
   ,'1'
   ,'Makeup Artist'
   ,'Makeup Artists'
   ,''
   ,'You can be the foundation for any good stage production, event, or great outfit. Send a little of that blushing talent to clients looking for production help or a 90s-style makeover.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'39-5091'
   ,'Makeup Artists, Theatrical and Performance'
   ,'Apply makeup to performers to reflect period, setting, and situation of their role.'
   ,'True'
   ,'2'
   ,'A foundation for any great production or outfit, makeup artists keep us blushing. Find a professional of powder for your Victorian drama, a maven of mascara for your tearful epic, or a roguish rouge artist for your 80s flick.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('248'
   ,'2'
   ,'2'
   ,'Maquillador/a'
   ,'Maquilladores/as'
   ,''
   ,'Aplican maquillaje a los actores para reflejar la ‚poca, ambientaci¢n y situaci¢n de sus respectivos roles.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('249'
   ,'1'
   ,'1'
   ,'Model'
   ,'Models'
   ,''
   ,'When we call you a poser, we really only mean that in the best of senses. Find clients needing your expert walking, posing, wearing, even pouting for their clothing line, photo shoot, advertisement, or artistic material.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'41-9012'
   ,'Models'
   ,'Model garments or other apparel and accessories for prospective buyers at fashion shows, private showings, or retail establishments.  May pose for photos to be used in magazines or advertisements.  May pose as subject for paintings, sculptures, and other types of artistic expression.'
   ,'True'
   ,'2'
   ,'These folks are posers, but only of the most literal, positive variety. Find an expert in walking, posing, wearing, even pouting for your clothing line, photo shoot, advertisement, or artistic material.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('249'
   ,'2'
   ,'2'
   ,'Modelo'
   ,'Modelos'
   ,''
   ,'Modelan prendas de vestir, indumentaria en general y accesorios para mostrar los art°culos a los potenciales clientes en desfiles de moda, desfiles privados o en establecimientos de venta minorista. Pueden posar para tomas de fotos para revistas o medios de publicidad. Pueden posar como modelos de pintura, escultura y otros tipos de expresiones art°sticas.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('250'
   ,'1'
   ,'1'
   ,'Fabric Mender'
   ,'Fabric Menders'
   ,''
   ,'A parachute with a hole -- well, that''s no parachute at all. Lend your mending expertise to clients in need of drapery, parachute, tent, or linen repair.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-9093'
   ,'Fabric Menders, Except Garment'
   ,'Repair tears, holes, and other defects in fabrics, such as draperies, linens, parachutes, and tents.'
   ,'True'
   ,'2'
   ,'A parachute with a hole -- well, that''s no parachute at all. If you''re in need of drapery, parachute, tent, or linen repair, the right mending professional''s right here.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('250'
   ,'2'
   ,'2'
   ,'Fabric Mender'
   ,''
   ,''
   ,'Reparan rasgaduras, agujeros y otros defectos en telas, tales como cortinas, manteles y ropa de cama, paraca°das y carpas.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('251'
   ,'1'
   ,'1'
   ,'Disc Jockey'
   ,'Disc Jockeys'
   ,'DJ'
   ,'We''re jealous of you because you have a really cool alias, whether it''s DJ Sweetums or DJ Poptart (or something actually cool, which of course we can''t think of, because we are not DJs). Find clients in need of your multifold, musical skillz.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-3012'
   ,'Public Address System and Other Announcers'
   ,'Make announcements over public address system at sporting or other public events.  May act as master of ceremonies or disc jockey at weddings, parties, clubs, or other gathering places.'
   ,'True'
   ,'1'
   ,'Somewhere between DJ Sweetums and DJ Poptart lurks the perfect DJ for your get-together.'
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('251'
   ,'2'
   ,'2'
   ,'Disc Jockey'
   ,'Disc Jockeys'
   ,''
   ,'Hacen anuncios a trav‚s del sistema p£blico de altavoces en eventos deportivos u otros eventos p£blicos. Pueden actuar como maestros de ceremonias o toca discos en bodas, fiestas, clubes o en otros lugares de reuni¢n.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('252'
   ,'1'
   ,'1'
   ,'Emcee'
   ,'Emcees'
   ,''
   ,'Over and out! The proclaimed master (or mistress) of ceremonies, you''re an essential part of any organized get-together. Find clients needing your voice.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'27-3012'
   ,'Public Address System and Other Announcers'
   ,'Make announcements over public address system at sporting or other public events.  May act as master of ceremonies or disc jockey at weddings, parties, clubs, or other gathering places.'
   ,'True'
   ,'2'
   ,'Over and out! The proclaimed master (or mistress) of ceremonies, these folks are an essential part of any organized get-together. Find the perfect voice for your event.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('252'
   ,'2'
   ,'2'
   ,'Emcee'
   ,''
   ,''
   ,'Hacen anuncios a trav‚s del sistema p£blico de altavoces en eventos deportivos u otros eventos p£blicos. Pueden actuar como maestros de ceremonias o toca discos en bodas, fiestas, clubes o en otros lugares de reuni¢n.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('253'
   ,'1'
   ,'1'
   ,'Fundraiser'
   ,'Fundraisers'
   ,''
   ,'Organize activities to raise funds or otherwise solicit and gather monetary donations or other gifts for an organization.  May design and produce promotional materials.  May also raise awareness of the organization?s work, goals, and financial needs.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'13-1131'
   ,'Fundraisers'
   ,'Organize activities to raise funds or otherwise solicit and gather monetary donations or other gifts for an organization.  May design and produce promotional materials.  May also raise awareness of the organization?s work, goals, and financial needs.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('253'
   ,'2'
   ,'2'
   ,'Fundraiser'
   ,''
   ,''
   ,'Organizan actividades para recaudar fondos o para solicitar y recolectar donaciones monetarias u otros donativos para una organizaci¢n. Pueden dise¤ar y producir materiales promocionales. Tambi‚n pueden realizar tareas destinadas a incrementar el nivel de concientizaci¢n respecto al trabajo, objetivos y necesidades financieras de la organizaci¢n.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('254'
   ,'1'
   ,'1'
   ,'Computer Programmer'
   ,'Computer Programmers'
   ,''
   ,'We''d love to make a pun involving C++, but Wikipedia says C++ is already a pun. We''ll take your word for it. Find clients needing your programming expertise, knowledge of coding puns, and more.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'15-1131'
   ,'Computer Programmers'
   ,'Create, modify, and test the code, forms, and script that allow computer applications to run.  Work from specifications drawn up by software developers or other individuals.  May assist software developers by analyzing user needs and designing software solutions.  May develop and write computer programs to store, locate, and retrieve specific documents, data, and information.'
   ,'True'
   ,'3'
   ,'If you''re like us, C++ means, at best, a language you will never understand. Find practitioners of programming, creative coders, and more.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('254'
   ,'2'
   ,'2'
   ,'Programador/a Inform·tico'
   ,'Programadores/as Inform·ticos'
   ,''
   ,'Crean, modifican y prueban el c¢digo, las formas y las secuencias de comandos que permiten el funcionamiento de las aplicaciones de las computadoras. Trabajan de acuerdo a las especificaciones efectuadas por los dise§adores de programas software y otros individuos. Pueden asistir a dise§adores de programas software analizando las necesidades de los usuarios y dise§ando las soluciones de software correspondientes. Pueden desarrollar y formular programas de computaci¢n para almacenar, localizar y recuperar documentos, informaci¢n y datos espec°ficos.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('255'
   ,'1'
   ,'1'
   ,'Web Developer'
   ,'Web Developers'
   ,''
   ,'We have only an inkling of how you work your magic, but we sure are envious of those design, implementation, and computer skills you''ve got. Find clients needing spiffy web systems.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'15-1134'
   ,'Web Developers'
   ,'Design, create, and modify Web sites.  Analyze user needs to implement Web site content, graphics, performance, and capacity.  May integrate Web sites with other computer applications.  May convert written, graphic, audio, and video components to compatible Web formats by using software designed to facilitate the creation of Web and multimedia content.  Excludes ?Multimedia Artists and Animators? (27-1014).'
   ,'True'
   ,'3'
   ,'We have only an inkling of how these folks work their magic, but we sure are envious of those design, implementation, and computer skills they''ve got. Find the right developer for your spiffy web system. '
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('255'
   ,'2'
   ,'2'
   ,'Desarrollador/a Web'
   ,'Desarrolladores/as Web'
   ,''
   ,'Dise§an, crean y modifican sitios Web. Analizan las necesidades de los usuarios para implementar contenidos, gr ficos, rendimiento operativo y capacidad de los sitios Web. Pueden integrar los sitios Web a otras aplicaciones de computaci¢n. Pueden convertir los componentes gr ficos, escritos, de audio y video a formatos compatibles con la Web utilizando programas software dise§ados para facilitar la creaci¢n de contenidos Web y multimedio. Excluye a los ?Artistas y Animadores de Multimedios de Difusi¢n? (27-1014).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('256'
   ,'1'
   ,'1'
   ,'Network Administrator'
   ,'Network Administrators'
   ,''
   ,'LAN, WAN, it''s the same thing to us, which says a lot about our network administrating capabilities. Find clients needing your detailed knowledge and expertise on all things network monitoring, troubleshooting, and proactivity.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'15-1142'
   ,'Network and Computer Systems Administrators'
   ,'Install, configure, and support an organization?s local area network (LAN), wide area network (WAN), and Internet systems or a segment of a network system.  Monitor network to ensure network availability to all system users and may perform necessary maintenance to support network availability.  May monitor and test Web site performance to ensure Web sites operate correctly and without interruption.  May assist in network modeling, analysis, planning, and coordination between network and data communications hardware and software.  May supervise computer user support specialists and computer network support specialists.  May administer network security measures.  Excludes ?Information Security Analysts?(15-1122), ?Computer User Support Specialists? (15-1151), and ?Computer Network Support Specialists? (15-1152).'
   ,'True'
   ,'3'
   ,'LAN, WAN, it''s all the same to us. Find the right network adminstrator to clear up the confusion, troubleshoot, and get your systems working smoothly in a constantly updated and proactive manner.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('256'
   ,'2'
   ,'2'
   ,'Network Administrator'
   ,''
   ,''
   ,'Instalan, configuran y dan apoyo a una red de  rea local (LAN), red de  rea amplia (WAN) y sistemas de Internet o a un segmento de un sistema de red de una organizaci¢n. Monitorean la red para garantizar la disponibilidad para todos los usuarios del sistema y pueden efectuar tareas de mantenimiento para apoyar la disponibilidad de la red. Pueden monitorear y probar el funcionamiento de sitios Web para garantizar su correcto funcionamiento sin interrupci¢n. Pueden colaborar con tareas de configuraci¢n, an lisis, planificaci¢n y coordinaci¢n entre la red y el hardware y el software de comunicaci¢n de datos. Pueden supervisar a los especialistas en apoyo t‚cnico de usuarios de computadoras y especialistas en soporte de redes inform ticas. Pueden administrar medidas de seguridad de la red. Excluye a los ?Analistas de Seguridad de la Informaci¢n? (15-1122), ?Especialistas en Apoyo T‚cnico para Usuarios de Computadoras? (15-1151) y a los ?Especialistas en Apoyo T‚cnico de Computadoras y Redes Inform ticas? (15-1152).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('257'
   ,'1'
   ,'1'
   ,'Computer Tutor'
   ,'Computer Tutors'
   ,''
   ,'Geeky, savvy, or however you describe yourself, you are indispensible to most of us trying to wrap our heads around a continually changing tech world. Find clients who need help managing the most minute tasks or Matrix-level problems (we know that''s an outdated reference -- but we are not computer people. Maybe we could use your help?). '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'15-1151'
   ,'Computer User Support Specialists'
   ,'Provide technical assistance to computer users.  Answer questions or resolve computer problems for clients in person, or via telephone or electronically.  May provide assistance concerning the use of computer hardware and software, including printing, installation, word processing, electronic mail, and operating systems.  Excludes ?Network and Computer Systems Administrators? (15-1142).'
   ,'True'
   ,'3'
   ,'Congratulations! You have made it on to this website. But unfortunately, that doesn''t mean you''re able to navigate the inevitable issues your computer will evilly throw your way. Luckily, there are people who make it their job to help you do everything from printing a document to installing software to diagnosing your device''s problem.'
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('257'
   ,'2'
   ,'2'
   ,'Computer Helper'
   ,''
   ,''
   ,'Ofrecen asistencia t‚cnica a los usuarios de computadoras. Responden las preguntas o resuelven los problemas de computaci¢n de los clientes ya sea por medio de contacto personal, telef¢nico o electr¢nico. Pueden brindar asistencia en lo que se refiere al uso de programas software y hardware, lo cual incluye impresi¢n, instalaci¢n, procesamiento de texto, correo electr¢nico y sistemas operativos. Excluye a los ?Administradores de Redes Inform ticas y Sistemas de Computaci¢n? (15-1142).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('258'
   ,'1'
   ,'1'
   ,'Nurse Midwive'
   ,'Nurse Midwives'
   ,''
   ,'Diagnose and coordinate all aspects of the birthing process, either independently or as part of a healthcare team.  May provide well-woman gynecological care.  Must have specialized, graduate nursing education.  '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'29-1161'
   ,'Nurse Midwives'
   ,'Diagnose and coordinate all aspects of the birthing process, either independently or as part of a healthcare team.  May provide well-woman gynecological care.  Must have specialized, graduate nursing education.  '
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('258'
   ,'2'
   ,'2'
   ,'Nurse Midwive'
   ,''
   ,''
   ,'Diagnostican o coordinan todos los aspectos relacionados con el proceso de parto, pueden trabajar independientemente o como parte de un grupo de trabajo dedicado al cuidado de la salud. Pueden prestar servicios de cuidados generales ginecol¢gicos. Deben poseer un diploma de estudios especializados de enfermer°a.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('259'
   ,'1'
   ,'1'
   ,'Funeral Director'
   ,'Funeral Directors'
   ,''
   ,'Perform various tasks to arrange and direct funeral services, such as coordinating transportation of body to mortuary, interviewing family or other authorized person to arrange details, selecting pallbearers, aiding with the selection of officials for religious rites, and providing transportation for mourners. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'39-4031'
   ,'Morticians, Undertakers, and Funeral Directors'
   ,'Perform various tasks to arrange and direct funeral services, such as coordinating transportation of body to mortuary, interviewing family or other authorized person to arrange details, selecting pallbearers, aiding with the selection of officials for religious rites, and providing transportation for mourners.  Excludes ?Funeral Service Managers? (11-9061).'
   ,'True'
   ,'3'
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('259'
   ,'2'
   ,'2'
   ,'Funeral Director'
   ,''
   ,''
   ,'Realizan diversas tareas para coordinar y dirigir servicios f£nebres, como por ejemplo, disponer los arreglos necesarios para el transporte del cuerpo hacia la morgue, reunirse con la familia del difunto o personas autorizadas para coordinar los detalles del servicio, seleccionar a los acompa§antes del cortejo f£nebre, colaborar con la selecci¢n de oficiantes de ritos religiosos y proporcionar servicio de transporte a los allegados del difunto. Excluye a los ?Gerentes de Servicios F£nebres? (11-9061).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('260'
   ,'1'
   ,'1'
   ,'Tour Guide'
   ,'Tour Guides'
   ,''
   ,'Sightseeing can be way more than just…seeing the sights. As a great tour guide, you show interested folks around, sure, but you also encourage them to experience their surroundings, learn about the culture and history of this place, and ask questions. Find inquisitive clients setting their sights on your expertise. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'39-7011'
   ,'Tour Guides and Escorts'
   ,'Escort individuals or groups on sightseeing tours or through places of interest, such as industrial establishments, public buildings, and art galleries.'
   ,'True'
   ,'3'
   ,'Set your sights on the right tour guide to fill you in on the culture, history, and traditions of excitingly unfamiliar spots. '
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('260'
   ,'2'
   ,'2'
   ,'GuÌa TurÌstico/a'
   ,'GuÌas TurÌsticos/as'
   ,''
   ,'Escoltan personas o grupos de personas durante las excursiones a lugares de inter‚s o a trav‚s de lugares de inter‚s, como por ejemplo, en visitas guiadas a establecimientos industriales, edificios p£blicos y galer¡as de arte.'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('261'
   ,'1'
   ,'1'
   ,'Travel Guide'
   ,'Travel Guides'
   ,''
   ,'Ah, what a job -- guiding exciting people through exciting sights. Find (excited) clients eager for your expertise, travel know-how, cultural tidbits, and more.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'39-7012'
   ,'Travel Guides'
   ,'Plan, organize, and conduct long distance travel , tours, and expeditions for individuals and groups.'
   ,'True'
   ,'3'
   ,'Ah, what a job -- guiding exciting people through exciting sights. Find the right travel guide with great expertise, travel know-how, cultural tidbits, and more, for your (exciting) exploration of foreign lands.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('261'
   ,'2'
   ,'2'
   ,'Travel Guide'
   ,''
   ,''
   ,'Planifican, organizan y dirigen viajes, excursiones y expediciones de larga distancia para individuos o grupos de personas.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('262'
   ,'1'
   ,'1'
   ,'Crop Farmworker'
   ,'Crop Farmworkers'
   ,''
   ,'Plantan, cultivan y cosechan manualmente vegetales, frutas, nueces, especialidades de horticultura y otros productos cultivados en el campo. Usan herramientas manuales, como por ejemplo palas, desplantadoras, azadas, compresores, ganchos de poda, tijeras de podar y cuchillos. Sus tareas pueden incluir arar el suelo y aplicar fertilizantes; transplantar, desmalezar, ralear o podar plantas y cultivos; aplicar pesticidas o limpiar, evaluar, clasificar, empacar y cargar los productos cosechados. Pueden construir gu°as de soporte para los cultivos, reparar cercos y estructuras de la granja o participar de actividades de riego. Excluye a los ?Evaluadores y Clasificadores de Productos Agr°colas? (45-2041) y a los ?Trabajadores Forestales y de Conservaci¢n y Trabajadores de Tala Forestal? (desde c¢digo 45-4011 hasta c¢digo 45-4029).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'45-2092'
   ,'Trabajadores y Jornaleros Agr°colas, de Cultivos, de Viveros y de Invernaderos'
   ,'Plantan, cultivan y cosechan manualmente vegetales, frutas, nueces, especialidades de horticultura y otros productos cultivados en el campo. Usan herramientas manuales, como por ejemplo palas, desplantadoras, azadas, compresores, ganchos de poda, tijeras de podar y cuchillos. Sus tareas pueden incluir arar el suelo y aplicar fertilizantes; transplantar, desmalezar, ralear o podar plantas y cultivos; aplicar pesticidas o limpiar, evaluar, clasificar, empacar y cargar los productos cosechados. Pueden construir gu°as de soporte para los cultivos, reparar cercos y estructuras de la granja o participar de actividades de riego. Excluye a los ?Evaluadores y Clasificadores de Productos Agr°colas? (45-2041) y a los ?Trabajadores Forestales y de Conservaci¢n y Trabajadores de Tala Forestal? (desde c¢digo 45-4011 hasta c¢digo 45-4029).'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('262'
   ,'2'
   ,'2'
   ,'Crop Farmworker'
   ,''
   ,''
   ,'Plantan, cultivan y cosechan manualmente vegetales, frutas, nueces, especialidades de horticultura y otros productos cultivados en el campo. Usan herramientas manuales, como por ejemplo palas, desplantadoras, azadas, compresores, ganchos de poda, tijeras de podar y cuchillos. Sus tareas pueden incluir arar el suelo y aplicar fertilizantes; transplantar, desmalezar, ralear o podar plantas y cultivos; aplicar pesticidas o limpiar, evaluar, clasificar, empacar y cargar los productos cosechados. Pueden construir gu°as de soporte para los cultivos, reparar cercos y estructuras de la granja o participar de actividades de riego. Excluye a los ?Evaluadores y Clasificadores de Productos Agr°colas? (45-2041) y a los ?Trabajadores Forestales y de Conservaci¢n y Trabajadores de Tala Forestal? (desde c¢digo 45-4011 hasta c¢digo 45-4029).'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('263'
   ,'1'
   ,'1'
   ,'Animal Farmworker'
   ,'Animal Farmworkers'
   ,''
   ,'Attend to live farm, ranch, or aquacultural animals that may include cattle, sheep, swine, goats, horses and other equines, poultry, finfish, shellfish, and bees.  Attend to animals produced for animal products, such as meat, fur, skins, feathers, eggs, milk, and honey.  Duties may include feeding, watering, herding, grazing, castrating, branding, de-beaking, weighing, catching, and loading animals.  May maintain records on animals; examine animals to detect diseases and injuries; assist in birth deliveries; and administer medications, vaccinations, or insecticides as appropriate.  May clean and maintain animal housing areas.  Includes workers who shear wool from sheep, and collect eggs in hatcheries.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'45-2093'
   ,'Farmworkers, Farm, Ranch, and Aquacultural Animals'
   ,'Attend to live farm, ranch, or aquacultural animals that may include cattle, sheep, swine, goats, horses and other equines, poultry, finfish, shellfish, and bees.  Attend to animals produced for animal products, such as meat, fur, skins, feathers, eggs, milk, and honey.  Duties may include feeding, watering, herding, grazing, castrating, branding, de-beaking, weighing, catching, and loading animals.  May maintain records on animals; examine animals to detect diseases and injuries; assist in birth deliveries; and administer medications, vaccinations, or insecticides as appropriate.  May clean and maintain animal housing areas.  Includes workers who shear wool from sheep, and collect eggs in hatcheries.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('263'
   ,'2'
   ,'2'
   ,'Animal Farmworker'
   ,''
   ,''
   ,'Se ocupan de atender animales vivos de granjas, haciendas o de criaderos acu ticos que pueden incluir ganado, ovejas, puercos, cabras, caballos y otros equinos, aves, peces y crust ceos y abejas. Se ocupan de los animales que producen productos de origen animal, como por ejemplo carne, pelajes, pieles, plumas, huevos, leche y miel. Sus tareas pueden incluir alimentar, dar agua, vigilar manadas de animales, pastorear, castrar, marcar, recortar picos, pesar, atrapar y cargar animales. Pueden mantener registros de animales, examinar animales para detectar enfermedades y lesiones; colaborar con las pariciones y administrar medicamentos, vacunas o insecticidas seg£n corresponda. Pueden limpiar y mantener las  reas donde viven los animales. Incluye a los trabajadores que esquilan lana de oveja y que recogen los huevos en los gallineros.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('264'
   ,'1'
   ,'1'
   ,'General Contractor'
   ,'General Contractors'
   ,''
   ,'Mr. or Ms. Fix-It, you take your trusty tools to any tough task. Find customers relying on your general repair expertise for their sticky, gummy, shattered, clogged, jammed, dripping, or squeaking problem. '
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'49-9071'
   ,'Maintenance and Repair Workers, General'
   ,'Perform work involving the skills of two or more maintenance or craft occupations to keep machines, mechanical equipment, or the structure of an establishment in repair.  Duties may involve pipe fitting; boiler making; insulating; welding; machining; carpentry; repairing electrical or mechanical equipment; installing, aligning, and balancing new equipment; and repairing buildings, floors, or stairs.  Excludes ?Maintenance Workers, Machinery"" (49-9043).'
   ,'True'
   ,'2'
   ,'Mr. or Ms. Fix-It, these folks take their trusty tools to any tough task. Find the right general repairer with expertise in all sorts of sticky, gummy, shattered, clogged, jammed, dripping, and squeaking problems. '
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('264'
   ,'2'
   ,'2'
   ,'Contratista'
   ,'Contratistas'
   ,''
   ,'Realizan un tipo de trabajo que requiere experiencia y conocimientos de dos o m s ocupaciones relacionadas con el mantenimiento o con tareas de reparaci¢n de m quinas, equipo mec nico, o sobre la estructura de un establecimiento en reparaci¢n. Las tareas pueden incluir el ajuste de tuber¡as; servicio de calderas; aislamiento; soldaduras; mecanizaci¢n; carpinter¡a; reparaci¢n de equipo el‚ctrico o mec nico; instalaci¢n, alineaci¢n y balanceo de equipo nuevo; y reparaci¢n de edificios, pisos o escaleras. Excluye a los ?Trabajadores de Mantenimiento de Maquinaria? (49-9043).'
   ,'7/12/2011 12:00:00 AM'
   ,'10/26/2013 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('265'
   ,'1'
   ,'1'
   ,'Printer'
   ,'Printers'
   ,''
   ,'Bind books and other publications or finish printed products by hand or machine.  May set up binding and finishing machines.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'51-5113'
   ,'Print Binding and Finishing Workers'
   ,'Bind books and other publications or finish printed products by hand or machine.  May set up binding and finishing machines.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('265'
   ,'2'
   ,'2'
   ,'Printer'
   ,''
   ,''
   ,'Encuadernan libros y otras publicaciones o realizan tareas de acabado de productos impresos manualmente o a m quina. Pueden instalar m quinas de encuadernaci¢n y acabado final.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('266'
   ,'1'
   ,'1'
   ,'Flight Attendant'
   ,'Flight Attendants'
   ,''
   ,'Provide personal services to ensure the safety, security, and comfort of airline passengers during flight.  Greet passengers, verify tickets, explain use of safety equipment, and serve food or beverages.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'jd'
   ,'53-2031'
   ,'Flight Attendants'
   ,'Provide personal services to ensure the safety, security, and comfort of airline passengers during flight.  Greet passengers, verify tickets, explain use of safety equipment, and serve food or beverages.'
   ,'False'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('266'
   ,'2'
   ,'2'
   ,'Flight Attendant'
   ,''
   ,''
   ,'Prestan servicios personales para garantizar la seguridad, protecci¢n y comodidad de los pasajeros de las l¡neas a‚reas durante el vuelo. Reciben y dan la bienvenida a los pasajeros, verifican los boletos, explican el modo de uso del equipo de seguridad y sirven comidas o bebidas.'
   ,'7/12/2011 12:00:00 AM'
   ,'7/12/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('267'
   ,'1'
   ,'1'
   ,'Localista'
   ,'Localistas'
   ,''
   ,'We like to think we''re all Localistas at heart. Not sure? If you have a warm heart, good spirit, and diverse set of talents, you are. Help out folks looking for errand-runners or all-around help, and spread the cheer.'
   ,'11/2/2011 12:00:00 AM'
   ,'11/2/2011 12:00:00 AM'
   ,'fg'
   ,'53-7062'
   ,'Laborers and Freight, Stock, and Material Movers, Hand'
   ,'Manually move freight, stock, or other materials or perform other general labor.  Includes all manual laborers not elsewhere classified.  Excludes “Material Moving Workers" (53-7011 through 53-7199) who use power equipment.  Excludes “Construction Laborers" (47-2061) and "Helpers, Construction Trades  (47-3011 through 47-3019).'
   ,'True'
   ,'1'
   ,'Not quite sure who to ask for help with your persnickety lightbulb problem or your long, involved grocery list you just don''t have time to tackle? Look no further! Experts in lightbulbs, groceries, and much, much more, Localistas are generalized helpers of swell mind and sweet spirit to aid you with whatever the project.'
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('267'
   ,'2'
   ,'2'
   ,'Recadero/a'
   ,'Recaderos/as'
   ,''
   ,''
   ,'11/2/2011 12:00:00 AM'
   ,'11/2/2011 12:00:00 AM'
   ,'fg'
   ,''
   ,''
   ,''
   ,'True'
   ,NULL
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('268'
   ,'1'
   ,'1'
   ,'House Sitter'
   ,'House Sitters'
   ,''
   ,'Despite your job title, you really do a lot more than sitting. You certainly don''t sit on a house, either -- in it, maybe. Maintaining a household''s operations while its owners are gone, you''re trusted and thoughtful folks who are pretty much always in demand.'
   ,'6/25/2012 12:00:00 AM'
   ,'6/25/2012 12:00:00 AM'
   ,'jd'
   ,''
   ,''
   ,''
   ,'True'
   ,'1'
   ,'Don''t worry, hiring a housesitter doesn''t actually mean hiring someone to just sit and hold court in your house. No. Find the perfect professional to maintain day-to-day operations while you''re gone, likely with minimal sitting involved.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('269'
   ,'1'
   ,'1'
   ,'Music Teacher'
   ,'Music Teachers'
   ,'Music lessons'
   ,'Frustratingly, there are quite a few steps between the Do-Re-Mi and the Yo-Yo Ma, but you, an expert, are there to guide us along. Find clients needing everything from a musical tune-up to full-scale instruction.'
   ,'7/9/2012 12:00:00 AM'
   ,'7/9/2012 12:00:00 AM'
   ,'jd'
   ,''
   ,''
   ,''
   ,'True'
   ,'1'
   ,'Do you need a tune-up or full-scale instruction? Find the perfect music teacher to help you tackle your instrument (not literally).'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('270'
   ,'1'
   ,'1'
   ,'Tennis Instructor'
   ,'Tennis Instructors'
   ,'Tennis coach'
   ,'By no means a lazy person''s sport, tennis provides a thrill with every "thwack!" Find clients who are just starting out on the court or who need a trained eye (yours) to assess their elbows. '
   ,'7/16/2012 12:00:00 AM'
   ,'7/16/2012 12:00:00 AM'
   ,'jd'
   ,''
   ,''
   ,''
   ,'True'
   ,'1'
   ,'With every "thwack!" comes a thrill -- at least that''s what we say about tennis. Find the perfect instructor to up your game, finesse your technique, or just help you get started.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('271'
   ,'1'
   ,'1'
   ,'Dog Trainer'
   ,'Dog Trainers'
   ,''
   ,'We applaud your efforts to get our best friends in tip-top shape to heel, fetch, or just not pull on the leash so hard. Find clients (and their furry friends) eager for your help.'
   ,'1/4/2013 12:00:00 AM'
   ,'1/4/2013 12:00:00 AM'
   ,'jd'
   ,''
   ,''
   ,''
   ,'True'
   ,'1'
   ,'Remember that time Rover bit the Santa Claus impersonator? Well, we do. A dog trainer will help both you and your pup with everything from holiday agression to pulling on the leash after those tempting squirrels.'
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('272'
   ,'1'
   ,'1'
   ,'Piano Teacher'
   ,'Piano Teachers'
   ,'Piano lessons'
   ,'Frustratingly, there are quite a few steps between the Do-Re-Mi and the Ludwig-Van-Beethoven, but you, an expert, are there to guide us along. Find clients needing everything from a musical tune-up to full-scale instruction.'
   ,'1/7/2013 12:00:00 AM'
   ,'1/7/2013 12:00:00 AM'
   ,'JD'
   ,''
   ,''
   ,''
   ,'True'
   ,'1'
   ,'Frustratingly, there are quite a few steps between the Do-Re-Mi and the Ludwig-Van-Beethoven, but there are luckily quite a few experts there to guide us along. Whether you need a simple musical tune-up to full-scale instruction, there''s a master for the job.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('273'
   ,'1'
   ,'1'
   ,'Cello Teacher'
   ,'Cello Teachers'
   ,'Cello lessons'
   ,'Frustratingly, there are quite a few steps between the Do-Re-Mi and the Yo-Yo Ma, but you, an expert, are there to guide us along. Find clients needing everything from a musical tune-up to full-scale instruction.'
   ,'1/7/2013 12:00:00 AM'
   ,'1/7/2013 12:00:00 AM'
   ,'JD'
   ,''
   ,''
   ,''
   ,'True'
   ,'1'
   ,'Jealous of a cellist (say it out loud!)? Here''s your chance to shine. Head towards Yo-Yo Ma status with help and instruction from a trained expert.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('274'
   ,'1'
   ,'1'
   ,'Voice Coach'
   ,'Voice Coaches'
   ,'Voice lessons'
   ,'Frustratingly, there are quite a few steps between the Do-Re-Mi and the Pa-Va-Rot-Ti, but you, an expert, are there to guide us along. Find clients needing everything from vocal touch-ups to full-scale instruction.'
   ,'1/7/2013 12:00:00 AM'
   ,'1/7/2013 12:00:00 AM'
   ,'JD'
   ,''
   ,''
   ,''
   ,'True'
   ,'1'
   ,'Frustratingly, there are quite a few steps between the Do-Re-Mi and the Pa-Va-Rot-Ti, but there are experts a-plenty to guide us along. Find instructors well-versed in everything from vocal touch-ups to full-scale instruction.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('275'
   ,'1'
   ,'1'
   ,'Drum Teacher'
   ,'Drum Teachers'
   ,'Drum lessons, Drums'
   ,'For all the indiscriminate banging in the basement, you never know who''s bound for Ringo-hood. Refine clients'' technique or help them get started with your expert know-how. '
   ,'1/8/2013 12:00:00 AM'
   ,'1/8/2013 12:00:00 AM'
   ,'jd'
   ,''
   ,''
   ,''
   ,'True'
   ,'1'
   ,'Maybe you''re tired of the loud banging your child does at the dinner table on every possible surface or you just want to get started on your journey towards Ringo-hood. Either way, there''s a professional, and likely a really cool one, for the job.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('276'
   ,'1'
   ,'1'
   ,'Violin Teacher'
   ,'Violin Teachers'
   ,'Violin lessons'
   ,'Frustratingly, there are quite a few steps between the Do-Re-Mi and the Pag-An-In-I, but you, an expert, are there to guide us along. Find clients needing everything from a musical tune-up to full-scale instruction.'
   ,'1/8/2013 12:00:00 AM'
   ,'1/8/2013 12:00:00 AM'
   ,'jd'
   ,''
   ,''
   ,''
   ,'True'
   ,'1'
   ,'Frustratingly, there are quite a few steps between the Do-Re-Mi and the Pa-Ga-Ni-Ni, but there are luckily quite a few experts there to guide us along. Whether you need a simple musical tune-up to full-scale instruction, there''s a master for the job.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('277'
   ,'1'
   ,'1'
   ,'Guitar Teacher'
   ,'Guitar Teachers'
   ,'Guitar lessons'
   ,'Frustratingly, there are quite a few steps between the Do-Re-Mi and the Er-Ic-Clap-Ton, but you, an expert, are there to guide us along. Find clients needing everything from a musical tune-up to full-scale instruction.'
   ,'1/8/2013 12:00:00 AM'
   ,'1/8/2013 12:00:00 AM'
   ,'jd'
   ,''
   ,''
   ,''
   ,'True'
   ,'1'
   ,'Frustratingly, there are quite a few steps between the Do-Re-Mi and the Er-Ic-Clap-Ton, but there are luckily quite a few experts there to guide us along. Whether you need a simple musical tune-up to full-scale instruction, there''s a master for the job.'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('278'
   ,'1'
   ,'1'
   ,'Yoga Instructor'
   ,'Yoga Instructors'
   ,''
   ,''
   ,'1/8/2013 12:00:00 AM'
   ,'1/8/2013 12:00:00 AM'
   ,'jd'
   ,''
   ,''
   ,''
   ,'True'
   ,'1'
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('279'
   ,'1'
   ,'1'
   ,'Reiki Teacher'
   ,'Reiki Teachers'
   ,'Reiki Master'
   ,''
   ,'1/10/2013 12:00:00 AM'
   ,'1/10/2013 12:00:00 AM'
   ,'jd'
   ,''
   ,''
   ,''
   ,'True'
   ,'1'
   ,''
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('281'
   ,'1'
   ,'1'
   ,'Pilates Instructor'
   ,'Pilates Instructors'
   ,''
   ,''
   ,'1/15/2013 12:00:00 AM'
   ,'1/15/2013 12:00:00 AM'
   ,'JD'
   ,''
   ,''
   ,''
   ,'True'
   ,'1'
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('282'
   ,'1'
   ,'1'
   ,'Professional Organizer'
   ,'Professional Organizers'
   ,''
   ,''
   ,'1/16/2013 12:00:00 AM'
   ,'1/16/2013 12:00:00 AM'
   ,'jd'
   ,''
   ,''
   ,''
   ,'True'
   ,'1'
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('283'
   ,'1'
   ,'1'
   ,'Reiki Practitioner'
   ,'Reiki Practitioners'
   ,''
   ,''
   ,'1/29/2013 12:00:00 AM'
   ,'1/29/2013 12:00:00 AM'
   ,'jd'
   ,''
   ,''
   ,''
   ,'True'
   ,'1'
   ,''
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('284'
   ,'1'
   ,'1'
   ,'Comedian'
   ,'Comedians'
   ,''
   ,''
   ,'2/4/2013 12:00:00 AM'
   ,'2/4/2013 12:00:00 AM'
   ,'jd'
   ,''
   ,''
   ,''
   ,'True'
   ,'1'
   ,''
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('285'
   ,'1'
   ,'1'
   ,'Sound Healer'
   ,'Sound Healers'
   ,''
   ,''
   ,'2/14/2013 12:00:00 AM'
   ,'2/14/2013 12:00:00 AM'
   ,'jd'
   ,''
   ,''
   ,''
   ,'True'
   ,'1'
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('286'
   ,'1'
   ,'1'
   ,'Lighting Designer'
   ,'Lighting Designers'
   ,''
   ,''
   ,'2/14/2013 12:00:00 AM'
   ,'2/14/2013 12:00:00 AM'
   ,'jd'
   ,''
   ,''
   ,''
   ,'True'
   ,'1'
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('287'
   ,'1'
   ,'1'
   ,'Herbalist'
   ,'Herbalists'
   ,''
   ,''
   ,'2/26/2013 12:00:00 AM'
   ,'2/26/2013 12:00:00 AM'
   ,'jd'
   ,''
   ,''
   ,''
   ,'True'
   ,'1'
   ,''
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('288'
   ,'1'
   ,'1'
   ,'Writing Coach'
   ,'Writing Coaches'
   ,''
   ,''
   ,'3/7/2013 12:00:00 AM'
   ,'3/7/2013 12:00:00 AM'
   ,'jd'
   ,''
   ,''
   ,''
   ,'True'
   ,'1'
   ,''
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('289'
   ,'1'
   ,'1'
   ,'Writing Consultant'
   ,'Writing Consultants'
   ,''
   ,''
   ,'3/7/2013 12:00:00 AM'
   ,'3/7/2013 12:00:00 AM'
   ,'jd'
   ,''
   ,''
   ,''
   ,'True'
   ,'1'
   ,''
   ,'True'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('290'
   ,'1'
   ,'1'
   ,'User Researcher'
   ,'User Researchers'
   ,''
   ,''
   ,'7/23/2013 12:00:00 AM'
   ,'7/23/2013 12:00:00 AM'
   ,'jd'
   ,''
   ,''
   ,''
   ,'True'
   ,'1'
   ,'Hire a user researcher to make sure that your website visitors are getting the most satisfying experience possible, so that they keep coming back for more!'
   ,'False'
   ,'False'
   ,'False')
INSERT INTO [positions]
   ([PositionID]
   ,[LanguageID]
   ,[CountryID]
   ,[PositionSingular]
   ,[PositionPlural]
   ,[Aliases]
   ,[PositionDescription]
   ,[CreatedDate]
   ,[UpdatedDate]
   ,[ModifiedBy]
   ,[GovID]
   ,[GovPosition]
   ,[GovPositionDescription]
   ,[Active]
   ,[DisplayRank]
   ,[PositionSearchDescription]
   ,[AttributesComplete]
   ,[StarRatingsComplete]
   ,[PricingTypeComplete])
VALUES
   ('291'
   ,'1'
   ,'1'
   ,'UX Designer'
   ,'UX Designers'
   ,''
   ,''
   ,'7/23/2013 12:00:00 AM'
   ,'7/23/2013 12:00:00 AM'
   ,'jd'
   ,''
   ,''
   ,''
   ,'True'
   ,'1'
   ,'Do you have a website but need help creating the perfect experience for your users? Book a UX designer to help you maximize your web success!'
   ,'False'
   ,'False'
   ,'False')

/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all'
/*__NOT_IN_BATCH__*/EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER  all'
