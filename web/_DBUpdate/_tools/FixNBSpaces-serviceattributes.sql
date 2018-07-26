UPDATE [serviceattribute]
SET [ServiceAttributeDescription] = LTRIM(RTRIM(REPLACE([ServiceAttributeDescription], NCHAR(0x00A0), ' '))),
[Name] = LTRIM(RTRIM(REPLACE([Name], NCHAR(0x00A0), ' ')))